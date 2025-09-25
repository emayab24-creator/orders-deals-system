
'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Download, RefreshCw, Loader2 } from 'lucide-react';
import { useState } from 'react';

interface GoogleSheetsResultsTableProps {
  data: any[];
  onRefresh?: () => void;
  loading?: boolean;
}

export default function GoogleSheetsResultsTable({ 
  data, 
  onRefresh, 
  loading = false 
}: GoogleSheetsResultsTableProps) {
  const [isExporting, setIsExporting] = useState(false);
  

  
  // Получаем все доступные колонки из данных с приоритетной сортировкой
  const getAllColumns = (): string[] => {
    if (data.length === 0) return [];
    
    // Получаем все ключи из всех объектов данных
    const allKeys = new Set<string>();
    data.forEach(item => {
      Object.keys(item).forEach(key => {
        // Исключаем служебные ключи
        if (!key.startsWith('_')) {
          allKeys.add(key);
        }
      });
    });
    
    // Приоритетные столбцы (самые важные согласно списку пользователя)
    const priorityColumns = ['C', 'D', 'E', 'I', 'K', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE'];
    
    const availableKeys = Array.from(allKeys);
    const result: string[] = [];
    
    // Сначала добавляем A и B (номер и запрос)
    if (availableKeys.includes('A')) result.push('A');
    if (availableKeys.includes('B')) result.push('B');
    
    // Затем добавляем приоритетные в указанном порядке
    priorityColumns.forEach(column => {
      if (availableKeys.includes(column)) {
        result.push(column);
      }
    });
    
    // Затем добавляем остальные в алфавитном порядке
    availableKeys.forEach(column => {
      if (!result.includes(column)) {
        result.push(column);
      }
    });
    
    return result;
  };

  const columns = getAllColumns();

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
          type: 'google-sheets'
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
        : `товары_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.xlsx`;
      
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Результаты из Google Sheets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-blue-500 mr-2" />
            <span className="text-gray-600">Загрузка данных...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Проверяем наличие ошибки
  if (data && data.length === 1 && data[0]?._error) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Результаты из Google Sheets</CardTitle>
            {onRefresh && (
              <Button 
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-red-800 font-medium mb-2">Ошибка загрузки данных</h4>
            <p className="text-red-600 text-sm">{data[0]._error}</p>
            <p className="text-red-500 text-xs mt-2">
              Возможные причины: проблемы с Google Sheets API, отсутствие доступа к таблице, неверные настройки сервисного аккаунта.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Результаты из Google Sheets</CardTitle>
            {onRefresh && (
              <Button 
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500 text-center py-8">
            Нет данных для отображения {data ? `(получено ${data.length} элементов)` : '(данные не загружены)'}
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
          <div className="flex gap-2">
            {onRefresh && (
              <Button 
                onClick={onRefresh}
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Обновить
              </Button>
            )}
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
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-max">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b bg-gray-50">
                  {columns.map((column, index) => (
                    <th 
                      key={column} 
                      className="text-left p-3 font-medium border-r last:border-r-0 min-w-[120px]"
                    >
                      <div className="flex flex-col">
                        <span className="font-bold text-xs text-gray-500">{column}</span>
                        <span className="font-medium text-gray-900">
                          {getColumnDisplayName(column)}
                        </span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    {columns.map((column) => (
                      <td 
                        key={`${index}-${column}`} 
                        className="p-3 border-r last:border-r-0 max-w-[200px]"
                      >
                        <div className="truncate">
                          {formatCellValue(item[column], column)}
                        </div>
                      </td>
                    ))}
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

// Функция для получения читаемого названия колонки
function getColumnDisplayName(column: string): string {
  // Маппинг известных колонок на русские названия согласно предоставленным номерам столбцов
  const columnNames: Record<string, string> = {
    'A': '№',                           // Колонка 1
    'B': 'Запрос',                      // Колонка 2 
    'C': 'Наименование',                // Колонка 3
    'D': 'Бренд',                       // Колонка 4
    'E': 'Артикул',                     // Колонка 5
    'F': 'Кол-во, шт',                  // Колонка 6
    'G': 'Цена, ю',                     // Колонка 7
    'H': 'ИТОГО, ю',                    // Колонка 8
    'I': 'Вес, кг',                     // Колонка 9
    'J': 'ИТОГО, кг',                   // Колонка 10
    'K': 'Объем',                       // Колонка 11
    'L': 'ИТОГО объем',                 // Колонка 12
    'M': 'ТН ВЭД',                      // Колонка 13
    'N': 'НДС',                         // Колонка 14
    'O': 'Пошлина',                     // Колонка 15
    'P': 'Группа',                      // Колонка 16
    'Q': 'Описание',                    // Колонка 17
    'R': 'Электрические параметры',     // Колонка 18
    'S': 'Максимальное давление',       // Колонка 19
    'T': 'Рабочая среда',               // Колонка 20
    'U': 'Номинальный диаметр',         // Колонка 21
    'V': 'Материал',                    // Колонка 22
    'W': 'Фото',                        // Колонка 23
    'X': 'Марка',                       // Колонка 24
    'Y': 'Компания производитель',      // Колонка 25
    'Z': 'Страна происхождения',        // Колонка 26
    'AA': 'Сертификация',               // Колонка 27
    'AB': 'Стоимость сертификации',     // Колонка 28
    'AC': 'Название компании',          // Колонка 29
    'AD': 'ИНН',                        // Колонка 30
    'AE': 'Сайт'                        // Колонка 31
  };
  
  return columnNames[column] || column;
}

// Функция для форматирования значения ячейки
function formatCellValue(value: any, column?: string): React.ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className="text-gray-400">-</span>;
  }
  
  const stringValue = String(value);
  
  // Форматирование для колонки "Фото" (W)
  if (column === 'W' && (stringValue.startsWith('http://') || stringValue.startsWith('https://'))) {
    return (
      <a 
        href={stringValue} 
        target="_blank" 
        rel="noopener noreferrer" 
        className="text-blue-600 hover:text-blue-800 underline"
      >
        🖼️ Фото
      </a>
    );
  }
  
  // Форматирование для колонки "Сайт" (AE) и других ссылок
  if ((column === 'AE' || stringValue.startsWith('http://') || stringValue.startsWith('https://')) && stringValue.includes('.')) {
    try {
      const url = new URL(stringValue.startsWith('http') ? stringValue : `https://${stringValue}`);
      return (
        <a 
          href={stringValue.startsWith('http') ? stringValue : `https://${stringValue}`}
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-blue-600 hover:text-blue-800 underline"
          title={stringValue}
        >
          {url.hostname}
        </a>
      );
    } catch {
      return <span title={stringValue}>{stringValue}</span>;
    }
  }
  
  // Форматирование числовых значений с единицами измерения
  if (column === 'I' && stringValue) { // Вес
    return <span>{stringValue} кг</span>;
  }
  
  if (column === 'K' && stringValue) { // Объем
    return <span>{stringValue}</span>;
  }
  
  if (column === 'G' && stringValue) { // Цена в юанях
    return <span>{stringValue} ¥</span>;
  }
  
  // Форматирование процентных значений для НДС и Пошлина
  if ((column === 'N' || column === 'O') && stringValue && !stringValue.includes('%')) {
    const numValue = parseFloat(stringValue);
    if (!isNaN(numValue)) {
      return <span>{numValue}%</span>;
    }
  }
  
  // Длинный текст - обрезаем и показываем полный в title
  if (stringValue.length > 50) {
    return (
      <span title={stringValue}>
        {stringValue.substring(0, 47)}...
      </span>
    );
  }
  
  return <span title={stringValue}>{stringValue}</span>;
}
