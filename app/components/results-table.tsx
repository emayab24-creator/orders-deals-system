
'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, Loader2 } from 'lucide-react';
import { CombinedData } from '@/lib/types';
import { useState } from 'react';

interface ResultsTableProps {
  data: CombinedData[];
  showContractor?: boolean;
}

export default function ResultsTable({ data, showContractor = true }: ResultsTableProps) {
  const [isExporting, setIsExporting] = useState(false);

  const exportToExcel = async () => {
    if (data.length === 0) return;
    
    try {
      setIsExporting(true);
      
      const response = await fetch('/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: data,
          type: 'combined'
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при экспорте данных');
      }

      // Получаем файл как blob
      const blob = await response.blob();
      
      // Создаем ссылку для скачивания
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Получаем имя файла из заголовка или создаем дефолтное
      const contentDisposition = response.headers.get('content-disposition');
      const fileName = contentDisposition 
        ? decodeURIComponent(contentDisposition.split('filename=')[1]?.replace(/"/g, ''))
        : `заказы_и_сделки_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.xlsx`;
      
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // Очищаем ресурсы
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (error) {
      console.error('Export error:', error);
      alert('Произошла ошибка при экспорте данных');
    } finally {
      setIsExporting(false);
    }
  };

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Результаты поиска</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Введите артикул для поиска данных
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Найдено записей: {data.length}</CardTitle>
          <Button 
            onClick={exportToExcel}
            variant="outline"
            size="sm"
            disabled={isExporting}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Экспорт...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Экспорт в Excel
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50">
                <th className="text-left p-3 font-medium">Наименование</th>
                <th className="text-left p-3 font-medium">Бренд</th>
                <th className="text-left p-3 font-medium">Бренд сделка</th>
                <th className="text-left p-3 font-medium">Количество заказанных позиций</th>
                <th className="text-left p-3 font-medium">Цена в юанях</th>
                <th className="text-left p-3 font-medium">Курс юаня</th>
                <th className="text-left p-3 font-medium">Курс $</th>
                <th className="text-left p-3 font-medium">Масса товара</th>
                {showContractor && (
                  <th className="text-left p-3 font-medium">Наименование сделки</th>
                )}
                <th className="text-left p-3 font-medium">Статус</th>
                <th className="text-left p-3 font-medium">Дата создания сделки</th>
                <th className="text-left p-3 font-medium">Даты первой оплаты сделки</th>
                {showContractor && (
                  <th className="text-left p-3 font-medium">Контрагент</th>
                )}
                <th className="text-left p-3 font-medium">ВХОД. ю</th>
                <th className="text-left p-3 font-medium">ВХОД. $</th>
                <th className="text-left p-3 font-medium">Менеджер по продажам</th>
                <th className="text-left p-3 font-medium">Снабженец</th>
              </tr>
            </thead>
            <tbody>
              {data.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="p-3">{item?.['Article/Name'] || '-'}</td>
                  <td className="p-3">
                    {item?.detectedBrand ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {item.detectedBrand}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">не определен</span>
                    )}
                  </td>
                  <td className="p-3">
                    {item?.dealBrand ? (
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {item.dealBrand}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">не указан</span>
                    )}
                  </td>
                  <td className="p-3">{item?.['Quantity'] || '-'}</td>
                  <td className="p-3">{item?.['Price per unit'] || '-'}</td>
                  <td className="p-3">{item?.['Yuan Rate'] || '-'}</td>
                  <td className="p-3">{item?.['Dollar Rate'] || '-'}</td>
                  <td className="p-3">{item?.['Weight'] || '-'}</td>
                  {showContractor && (
                    <td className="p-3 max-w-xs truncate" title={item?.['Order Name']}>
                      {item?.['Order Name'] || '-'}
                    </td>
                  )}
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      item?.dealStatus?.includes('Принято') ? 'bg-green-100 text-green-800' :
                      item?.dealStatus?.includes('выставлен') ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {item?.dealStatus || '-'}
                    </span>
                  </td>
                  <td className="p-3">
                    {item?.dealCreationDate ? 
                      new Date(item.dealCreationDate).toLocaleDateString('ru-RU') : '-'}
                  </td>
                  <td className="p-3">
                    {item?.dealFirstPaymentDate ? 
                      new Date(item.dealFirstPaymentDate).toLocaleDateString('ru-RU') : '-'}
                  </td>
                  {showContractor && (
                    <td className="p-3">{item?.contractor || '-'}</td>
                  )}
                  <td className="p-3">{item?.entranceYuan || '-'}</td>
                  <td className="p-3">{item?.entranceDollar || '-'}</td>
                  <td className="p-3">{item?.salesManager || '-'}</td>
                  <td className="p-3">{item?.supplier || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
