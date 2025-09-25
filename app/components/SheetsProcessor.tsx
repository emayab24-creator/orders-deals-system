
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Plus, RefreshCw, ExternalLink } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SheetRow {
  rowNumber: number;
  request: string;
  name: string;
  brand: string;
  article: string;
  quantity: string;
  price: string;
  total: string;
  weight: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface StatusData {
  pending: number;
  processing: number;
  completed: number;
  total: number;
  latestRows: SheetRow[];
}

export default function SheetsProcessor() {
  const [request, setRequest] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusData, setStatusData] = useState<StatusData>({
    pending: 0,
    processing: 0,
    completed: 0,
    total: 0,
    latestRows: []
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Функция для добавления запроса
  const handleAddRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!request.trim()) return;

    setIsAdding(true);
    try {
      const response = await fetch('/api/sheets/add-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: request.trim() }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Запрос добавлен в таблицу!');
        setRequest('');
        // Сразу обновляем данные
        await fetchStatusData();
      } else {
        toast.error(data.error || 'Ошибка при добавлении запроса');
      }
    } catch (error) {
      console.error('Ошибка:', error);
      toast.error('Не удалось добавить запрос');
    } finally {
      setIsAdding(false);
    }
  };

  // Функция для получения статуса
  const fetchStatusData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch('/api/sheets/status');
      const data = await response.json();

      if (data.success) {
        setStatusData(data);
      } else {
        toast.error('Не удалось обновить данные');
      }
    } catch (error) {
      console.error('Ошибка при получении статуса:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Автообновление каждые 10 секунд
  useEffect(() => {
    fetchStatusData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchStatusData, 10000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Функция для получения класса статуса
  const getStatusBadge = (status: SheetRow['status']) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Завершено</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Ожидание</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">Обработка</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Ошибка</Badge>;
      default:
        return <Badge>Неизвестно</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и ссылка на таблицу */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Google Sheets зеркало</h1>
        <Button 
          variant="outline" 
          onClick={() => window.open('https://docs.google.com/spreadsheets/d/1SDY_ExYpm6OnnJozFAqoZwvLzo82-WbfZ71FzTGiDlY/edit', '_blank')}
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Открыть таблицу
        </Button>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusData.total}</div>
            <div className="text-sm text-gray-600">Всего запросов</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{statusData.pending}</div>
            <div className="text-sm text-gray-600">В ожидании</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{statusData.processing}</div>
            <div className="text-sm text-gray-600">В обработке</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{statusData.completed}</div>
            <div className="text-sm text-gray-600">Завершено</div>
          </CardContent>
        </Card>
      </div>

      {/* Форма добавления запроса */}
      <Card>
        <CardHeader>
          <CardTitle>Добавить новый запрос</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddRequest} className="flex gap-2">
            <Input
              value={request}
              onChange={(e) => setRequest(e.target.value)}
              placeholder="Введите описание товара..."
              className="flex-1"
              disabled={isAdding}
            />
            <Button type="submit" disabled={isAdding || !request.trim()}>
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Plus className="w-4 h-4 mr-2" />
              )}
              Добавить
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Управление обновлением */}
      <div className="flex items-center gap-4">
        <Button 
          onClick={fetchStatusData} 
          disabled={isRefreshing}
          variant="outline"
        >
          {isRefreshing ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Обновить
        </Button>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={autoRefresh}
            onChange={(e) => setAutoRefresh(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Автообновление (10 сек)</span>
        </label>
      </div>

      {/* Таблица результатов */}
      <Card>
        <CardHeader>
          <CardTitle>Последние запросы</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-200">
              <thead>
                <tr className="bg-gray-50">
                  <th className="border border-gray-200 p-2 text-left">№</th>
                  <th className="border border-gray-200 p-2 text-left">Запрос</th>
                  <th className="border border-gray-200 p-2 text-left">Наименование</th>
                  <th className="border border-gray-200 p-2 text-left">Бренд</th>
                  <th className="border border-gray-200 p-2 text-left">Артикул</th>
                  <th className="border border-gray-200 p-2 text-left">Кол-во</th>
                  <th className="border border-gray-200 p-2 text-left">Цена</th>
                  <th className="border border-gray-200 p-2 text-left">Итого</th>
                  <th className="border border-gray-200 p-2 text-left">Вес</th>
                  <th className="border border-gray-200 p-2 text-left">Статус</th>
                </tr>
              </thead>
              <tbody>
                {statusData.latestRows.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="border border-gray-200 p-4 text-center text-gray-500">
                      Нет данных для отображения
                    </td>
                  </tr>
                ) : (
                  statusData.latestRows.map((row) => (
                    <tr key={row.rowNumber} className="hover:bg-gray-50">
                      <td className="border border-gray-200 p-2">{row.rowNumber}</td>
                      <td className="border border-gray-200 p-2 max-w-xs">
                        <div className="truncate" title={row.request}>
                          {row.request}
                        </div>
                      </td>
                      <td className="border border-gray-200 p-2">{row.name}</td>
                      <td className="border border-gray-200 p-2">{row.brand}</td>
                      <td className="border border-gray-200 p-2">{row.article}</td>
                      <td className="border border-gray-200 p-2">{row.quantity}</td>
                      <td className="border border-gray-200 p-2">{row.price}</td>
                      <td className="border border-gray-200 p-2">{row.total}</td>
                      <td className="border border-gray-200 p-2">{row.weight}</td>
                      <td className="border border-gray-200 p-2">
                        {getStatusBadge(row.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
