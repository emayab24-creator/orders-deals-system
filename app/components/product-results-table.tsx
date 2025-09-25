
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, RotateCcw, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface ProductData {
  [key: string]: string;
}

interface ProductResultsTableProps {
  data: ProductData[];
  onRefresh: () => void;
  loading?: boolean;
}

export default function ProductResultsTable({ data, onRefresh, loading = false }: ProductResultsTableProps) {
  const exportToExcel = () => {
    if (data.length === 0) return;
    
    try {
      // Преобразуем данные с читаемыми названиями столбцов
      const exportData = data.map((row, index) => ({
        '№': row.A || index + 1,
        'Запрос': row.B || '',
        'Наименование': row.C || '',
        'Бренд': row.D || '',
        'Артикул': row.E || '',
        'Кол-во, шт': row.F || '',
        'Цена, ю': row.G || '',
        'ИТОГО, ю': row.H || '',
        'Вес, кг': row.I || '',
        'ИТОГО, кг': row.J || '',
        'Объем': row.K || '',
        'ИТОГО объем': row.L || '',
        'ТН ВЭД': row.M || '',
        'НДС': row.N || '',
        'Пошлина': row.O || '',
        'Группа': row.P || '',
        'Описание': row.Q || '',
        'Электрические параметры': row.R || '',
        'Максимальное давление': row.S || '',
        'Рабочая среда': row.T || '',
        'Номинальный диаметр': row.U || '',
        'Материал': row.V || '',
        'Фото': row.W || '',
        'Марка': row.X || '',
        'Компания производитель': row.Y || '',
        'Страна происхождения': row.Z || '',
        'Сертификация': row.AA || '',
        'Стоимость сертификации': row.AB || '',
        'Название компании': row.AC || '',
        'ИНН': row.AD || '',
        'Сайт': row.AE || ''
      }));
      
      const ws = XLSX.utils.json_to_sheet(exportData);
      
      // Устанавливаем ширину колонок
      const columnWidths = [
        { wch: 5 },   // №
        { wch: 25 },  // Запрос
        { wch: 40 },  // Наименование
        { wch: 20 },  // Бренд
        { wch: 20 },  // Артикул
        { wch: 12 },  // Кол-во, шт
        { wch: 12 },  // Цена, ю
        { wch: 12 },  // ИТОГО, ю
        { wch: 12 },  // Вес, кг
        { wch: 12 },  // ИТОГО, кг
        { wch: 12 },  // Объем
        { wch: 12 },  // ИТОГО объем
        { wch: 15 },  // ТН ВЭД
        { wch: 8 },   // НДС
        { wch: 10 },  // Пошлина
        { wch: 20 },  // Группа
        { wch: 50 },  // Описание
        { wch: 30 },  // Электрические параметры
        { wch: 20 },  // Максимальное давление
        { wch: 20 },  // Рабочая среда
        { wch: 18 },  // Номинальный диаметр
        { wch: 20 },  // Материал
        { wch: 40 },  // Фото
        { wch: 20 },  // Марка
        { wch: 30 },  // Компания производитель
        { wch: 20 },  // Страна происхождения
        { wch: 15 },  // Сертификация
        { wch: 18 },  // Стоимость сертификации
        { wch: 30 },  // Название компании
        { wch: 15 },  // ИНН
        { wch: 25 }   // Сайт
      ];
      
      ws['!cols'] = columnWidths;
      
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Обработанные товары');
      XLSX.writeFile(wb, `google_sheets_products_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Ошибка при экспорте в Excel');
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Результаты из Google Sheets</CardTitle>
            <Button onClick={onRefresh} variant="outline" disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Загрузка данных из Google Sheets...
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">
              Нет данных из Google Sheets. Добавьте товары для обработки.
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Найдено записей из Google Sheets: {data.length}</CardTitle>
          <div className="flex gap-2">
            <Button onClick={onRefresh} variant="outline" disabled={loading}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Обновить
            </Button>
            <Button 
              onClick={exportToExcel}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Экспорт в Excel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  <th className="text-left p-3 font-medium border-r min-w-[60px]">№</th>
                  <th className="text-left p-3 font-medium border-r min-w-[120px]">Запрос</th>
                  <th className="text-left p-3 font-medium border-r min-w-[150px]">Наименование</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Бренд</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Артикул</th>
                  <th className="text-left p-3 font-medium border-r min-w-[80px]">Вес, кг</th>
                  <th className="text-left p-3 font-medium border-r min-w-[80px]">Объем</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">ТН ВЭД</th>
                  <th className="text-left p-3 font-medium border-r min-w-[60px]">НДС</th>
                  <th className="text-left p-3 font-medium border-r min-w-[80px]">Пошлина</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Группа</th>
                  <th className="text-left p-3 font-medium border-r min-w-[200px]">Описание</th>
                  <th className="text-left p-3 font-medium border-r min-w-[150px]">Электрич. параметры</th>
                  <th className="text-left p-3 font-medium border-r min-w-[120px]">Макс. давление</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Рабочая среда</th>
                  <th className="text-left p-3 font-medium border-r min-w-[120px]">Ном. диаметр</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Материал</th>
                  <th className="text-left p-3 font-medium border-r min-w-[80px]">Фото</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Марка</th>
                  <th className="text-left p-3 font-medium border-r min-w-[150px]">Компания произв.</th>
                  <th className="text-left p-3 font-medium border-r min-w-[120px]">Страна происх.</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">Сертификация</th>
                  <th className="text-left p-3 font-medium border-r min-w-[120px]">Стоимость сертиф.</th>
                  <th className="text-left p-3 font-medium border-r min-w-[150px]">Название компании</th>
                  <th className="text-left p-3 font-medium border-r min-w-[100px]">ИНН</th>
                  <th className="text-left p-3 font-medium min-w-[120px]">Сайт</th>
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-3 border-r">{item.A || index + 1}</td>
                    <td className="p-3 border-r font-medium">{item.B || '-'}</td>
                    <td className="p-3 border-r">{item.C || '-'}</td>
                    <td className="p-3 border-r">{item.D || '-'}</td>
                    <td className="p-3 border-r">{item.E || '-'}</td>
                    <td className="p-3 border-r">{item.I || '-'}</td>
                    <td className="p-3 border-r">{item.K || '-'}</td>
                    <td className="p-3 border-r">{item.M || '-'}</td>
                    <td className="p-3 border-r">{item.N || '-'}</td>
                    <td className="p-3 border-r">{item.O || '-'}</td>
                    <td className="p-3 border-r">{item.P || '-'}</td>
                    <td className="p-3 border-r max-w-[200px] truncate" title={item.Q}>
                      {item.Q || '-'}
                    </td>
                    <td className="p-3 border-r max-w-[150px] truncate" title={item.R}>
                      {item.R || '-'}
                    </td>
                    <td className="p-3 border-r">{item.S || '-'}</td>
                    <td className="p-3 border-r">{item.T || '-'}</td>
                    <td className="p-3 border-r">{item.U || '-'}</td>
                    <td className="p-3 border-r">{item.V || '-'}</td>
                    <td className="p-3 border-r">
                      {item.W && (item.W.startsWith('http://') || item.W.startsWith('https://')) ? (
                        <a 
                          href={item.W} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline"
                        >
                          🖼️ Фото
                        </a>
                      ) : (
                        item.W || '-'
                      )}
                    </td>
                    <td className="p-3 border-r">{item.X || '-'}</td>
                    <td className="p-3 border-r max-w-[150px] truncate" title={item.Y}>
                      {item.Y || '-'}
                    </td>
                    <td className="p-3 border-r">{item.Z || '-'}</td>
                    <td className="p-3 border-r">{item.AA || '-'}</td>
                    <td className="p-3 border-r">{item.AB || '-'}</td>
                    <td className="p-3 border-r max-w-[150px] truncate" title={item.AC}>
                      {item.AC || '-'}
                    </td>
                    <td className="p-3 border-r">{item.AD || '-'}</td>
                    <td className="p-3">
                      {item.AE && (item.AE.includes('.') && !item.AE.includes(' ')) ? (
                        <a 
                          href={item.AE.startsWith('http') ? item.AE : `https://${item.AE}`}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:text-blue-800 underline truncate block max-w-[120px]"
                          title={item.AE}
                        >
                          {item.AE.replace(/^https?:\/\//, '').split('/')[0]}
                        </a>
                      ) : (
                        item.AE || '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
