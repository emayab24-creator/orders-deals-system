
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Download, RotateCcw, Plus, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import ProductErrorsList from './product-errors-list';

interface ProductData {
  [key: string]: string;
}

export default function ProductProcessor() {
  const [inputText, setInputText] = useState('');
  const [tableData, setTableData] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingProduct, setAddingProduct] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Загрузка данных из Google Sheets (только текущие запросы)
  const loadTableData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/products/current-results');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setTableData(data);
      
    } catch (error) {
      console.error('Error loading table data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setTableData([]);
    } finally {
      setLoading(false);
    }
  };

  // Загружаем данные при монтировании компонента
  useEffect(() => {
    loadTableData();
    
    // Автообновление каждые 10 секунд
    const interval = setInterval(() => {
      loadTableData();
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  // Добавление товаров в Google Sheets (разбивает по строкам)
  const addProduct = async () => {
    if (!inputText.trim()) {
      setError('Пожалуйста, введите название товара');
      return;
    }

    try {
      setAddingProduct(true);
      setError(null);
      setSuccess(null);

      // Разбиваем текст на отдельные строки и очищаем их
      const productLines = inputText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0);

      if (productLines.length === 0) {
        throw new Error('Нет корректных названий товаров');
      }

      console.log('Adding products:', productLines);

      const response = await fetch('/api/products/batch-add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productNames: productLines }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        const count = productLines.length;
        setSuccess(`${count} ${count === 1 ? 'товар' : 'товара'} успешно добавлен${count === 1 ? '' : 'о'} в Google Sheets!`);
        setInputText('');
        // Обновляем данные через 2 секунды
        setTimeout(() => {
          loadTableData();
        }, 2000);
      } else {
        throw new Error(result.message || 'Failed to add products');
      }

    } catch (error) {
      console.error('Error adding products:', error);
      setError(error instanceof Error ? error.message : 'Failed to add products');
    } finally {
      setAddingProduct(false);
    }
  };

  // Очистка данных (только текущие запросы)
  const clearData = async () => {
    if (!confirm('Очистить текущие запросы в Google Sheets?')) {
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch('/api/products/current-results', { method: 'DELETE' });
      
      if (response.ok) {
        const result = await response.json();
        setSuccess(result.message || 'Текущие запросы очищены в Google Sheets');
        setTimeout(() => {
          loadTableData();
        }, 2000);
      } else {
        throw new Error('Failed to clear data');
      }
    } catch (error) {
      console.error('Error clearing data:', error);
      setError('Ошибка при очистке данных');
    } finally {
      setLoading(false);
    }
  };

  // Экспорт в Excel с правильными названиями столбцов
  const exportToExcel = () => {
    try {
      if (tableData.length === 0) {
        alert('Нет данных для экспорта');
        return;
      }

      // Преобразуем данные с читаемыми названиями столбцов
      const exportData = tableData.map((row, index) => ({
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
      XLSX.writeFile(wb, `processed_products_${new Date().toISOString().split('T')[0]}.xlsx`);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Ошибка при экспорте в Excel');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Обработка товаров через Google Sheets</h1>
        <p className="text-muted-foreground">
          Введите товары для добавления в Google Sheets. Обработанные результаты будут автоматически отображаться в таблице ниже.
        </p>
      </div>

      <Tabs defaultValue="add" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="add">Ввод товаров</TabsTrigger>
          <TabsTrigger value="results">
            Результаты ({tableData.length})
          </TabsTrigger>
          <TabsTrigger value="errors">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Ошибки
          </TabsTrigger>
        </TabsList>

        <TabsContent value="add" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Добавить товары</CardTitle>
              <CardDescription>
                Введите названия товаров (каждый товар на новой строке) для добавления в Google Sheets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder={`Введите названия товаров, каждый на новой строке, например:
Аккумулятор Li-lon 18650x3 10400 mAh, 3,7V
6GK7343-1CX10-0XE0
MSFW-230-50/60, Катушка, 4540`}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="min-h-[150px]"
                disabled={addingProduct}
              />
              
              <div className="flex justify-between items-center">
                <div className="text-sm text-muted-foreground">
                  {inputText.trim() ? 
                    `Готов к добавлению: ${inputText.split('\n').filter(line => line.trim()).length} товаров` : 
                    'Введите товары'}
                </div>
                
                <div className="flex gap-2">
                  <Button 
                    onClick={addProduct} 
                    disabled={addingProduct || !inputText.trim()}
                  >
                    {addingProduct ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Добавление...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Добавить товары
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Результаты обработки</CardTitle>
                  <CardDescription>
                    Данные из Google Sheets ({tableData.length} записей)
                    {tableData.length > 0 && (
                      <span className="ml-2 text-green-600">• Данные загружены</span>
                    )}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={loadTableData} variant="outline" disabled={loading}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Обновить
                  </Button>
                  <Button onClick={exportToExcel} disabled={tableData.length === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    Excel
                  </Button>
                  <Button 
                    onClick={clearData} 
                    variant="destructive" 
                    disabled={tableData.length === 0}
                  >
                    Очистить текущие запросы
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  Загрузка данных...
                </div>
              ) : tableData.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <div className="mb-2">📄 Нет обработанных товаров</div>
                  <div className="text-sm">
                    Добавьте товары во вкладке "Ввод товаров" или нажмите "Обновить" для загрузки данных из Google Sheets.
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden">
                  <div className="max-h-96 overflow-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2 border-b border-r min-w-[60px]">№</th>
                          <th className="text-left p-2 border-b border-r min-w-[120px]">Запрос</th>
                          <th className="text-left p-2 border-b border-r min-w-[150px]">Наименование</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Бренд</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Артикул</th>
                          <th className="text-left p-2 border-b border-r min-w-[80px]">Вес, кг</th>
                          <th className="text-left p-2 border-b border-r min-w-[80px]">Объем</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">ТН ВЭД</th>
                          <th className="text-left p-2 border-b border-r min-w-[60px]">НДС</th>
                          <th className="text-left p-2 border-b border-r min-w-[80px]">Пошлина</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Группа</th>
                          <th className="text-left p-2 border-b border-r min-w-[200px]">Описание</th>
                          <th className="text-left p-2 border-b border-r min-w-[150px]">Электрические параметры</th>
                          <th className="text-left p-2 border-b border-r min-w-[120px]">Макс. давление</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Рабочая среда</th>
                          <th className="text-left p-2 border-b border-r min-w-[120px]">Ном. диаметр</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Материал</th>
                          <th className="text-left p-2 border-b border-r min-w-[80px]">Фото</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Марка</th>
                          <th className="text-left p-2 border-b border-r min-w-[150px]">Компания произв.</th>
                          <th className="text-left p-2 border-b border-r min-w-[120px]">Страна происх.</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">Сертификация</th>
                          <th className="text-left p-2 border-b border-r min-w-[120px]">Стоимость сертиф.</th>
                          <th className="text-left p-2 border-b border-r min-w-[150px]">Название компании</th>
                          <th className="text-left p-2 border-b border-r min-w-[100px]">ИНН</th>
                          <th className="text-left p-2 border-b min-w-[120px]">Сайт</th>
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, index) => (
                          <tr key={index} className="hover:bg-muted/50">
                            <td className="p-2 border-b border-r text-muted-foreground">{row.A || index + 1}</td>
                            <td className="p-2 border-b border-r font-medium">{row.B || '-'}</td>
                            <td className="p-2 border-b border-r">{row.C || '-'}</td>
                            <td className="p-2 border-b border-r">{row.D || '-'}</td>
                            <td className="p-2 border-b border-r">{row.E || '-'}</td>
                            <td className="p-2 border-b border-r">{row.I || '-'}</td>
                            <td className="p-2 border-b border-r">{row.K || '-'}</td>
                            <td className="p-2 border-b border-r">{row.M || '-'}</td>
                            <td className="p-2 border-b border-r">{row.N || '-'}</td>
                            <td className="p-2 border-b border-r">{row.O || '-'}</td>
                            <td className="p-2 border-b border-r">{row.P || '-'}</td>
                            <td className="p-2 border-b border-r max-w-[200px] truncate" title={row.Q}>
                              {row.Q || '-'}
                            </td>
                            <td className="p-2 border-b border-r max-w-[150px] truncate" title={row.R}>
                              {row.R || '-'}
                            </td>
                            <td className="p-2 border-b border-r">{row.S || '-'}</td>
                            <td className="p-2 border-b border-r">{row.T || '-'}</td>
                            <td className="p-2 border-b border-r">{row.U || '-'}</td>
                            <td className="p-2 border-b border-r">{row.V || '-'}</td>
                            <td className="p-2 border-b border-r">
                              {row.W && (row.W.startsWith('http://') || row.W.startsWith('https://')) ? (
                                <a 
                                  href={row.W} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800 underline"
                                >
                                  🖼️ Фото
                                </a>
                              ) : (
                                row.W || '-'
                              )}
                            </td>
                            <td className="p-2 border-b border-r">{row.X || '-'}</td>
                            <td className="p-2 border-b border-r max-w-[150px] truncate" title={row.Y}>
                              {row.Y || '-'}
                            </td>
                            <td className="p-2 border-b border-r">{row.Z || '-'}</td>
                            <td className="p-2 border-b border-r">{row.AA || '-'}</td>
                            <td className="p-2 border-b border-r">{row.AB || '-'}</td>
                            <td className="p-2 border-b border-r max-w-[150px] truncate" title={row.AC}>
                              {row.AC || '-'}
                            </td>
                            <td className="p-2 border-b border-r">{row.AD || '-'}</td>
                            <td className="p-2 border-b">
                              {row.AE && (row.AE.includes('.') && !row.AE.includes(' ')) ? (
                                <a 
                                  href={row.AE.startsWith('http') ? row.AE : `https://${row.AE}`}
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="text-blue-600 hover:text-blue-800 underline truncate block max-w-[120px]"
                                  title={row.AE}
                                >
                                  {row.AE.replace(/^https?:\/\//, '').split('/')[0]}
                                </a>
                              ) : (
                                row.AE || '-'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <ProductErrorsList 
            onRetryComplete={() => {
              // Показываем состояние загрузки
              setLoading(true);
              setSuccess('Ожидаем обработку повторно отправленных позиций...');
              
              // Обновляем данные после повторной обработки
              setTimeout(() => {
                setSuccess(null);
                loadTableData();
              }, 8000); // Синхронизируем с временем в ProductErrorsList
            }}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
