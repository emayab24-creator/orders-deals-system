
import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { data, type = 'combined' } = body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return NextResponse.json(
        { error: 'Нет данных для экспорта' },
        { status: 400 }
      );
    }

    // Подготавливаем данные для экспорта
    let exportData;
    
    if (type === 'google-sheets') {
      // Для данных Google Sheets - экспортируем все столбцы
      exportData = data.map((item, index) => {
        const exportRow: any = { '№': index + 1 };
        
        // Маппинг колонок из Google Sheets
        const columnMapping: Record<string, string> = {
          'B': 'Запрос',
          'C': 'Наименование',
          'D': 'Бренд', 
          'E': 'Артикул',
          'F': 'Кол-во, шт',
          'G': 'Цена, ю',
          'H': 'ИТОГО, ю',
          'I': 'Вес, кг',
          'J': 'ИТОГО, кг',
          'K': 'Объем',
          'L': 'ИТОГО объем',
          'M': 'ТН ВЭД',
          'N': 'НДС',
          'O': 'Пошлина',
          'P': 'Группа',
          'Q': 'Описание',
          'R': 'Электрические параметры',
          'S': 'Максимальное давление',
          'T': 'Рабочая среда',
          'U': 'Номинальный диаметр',
          'V': 'Материал',
          'W': 'Фото',
          'X': 'Марка',
          'Y': 'Компания производитель',
          'Z': 'Страна происхождения',
          'AA': 'Сертификация',
          'AB': 'Стоимость сертификации',
          'AC': 'Название компании',
          'AD': 'ИНН',
          'AE': 'Сайт'
        };
        
        // Добавляем все доступные столбцы
        Object.keys(item).forEach(key => {
          if (!key.startsWith('_') && columnMapping[key]) {
            exportRow[columnMapping[key]] = item[key] || '';
          }
        });
        
        return exportRow;
      });
    } else {
      // Для основных данных заказов и сделок
      exportData = data.map((item, index) => ({
        '№': index + 1,
        'Наименование': item?.['Article/Name'] || '',
        'Бренд': item?.detectedBrand || '',
        'Количество заказанных позиций': item?.['Quantity'] || '',
        'Цена в юанях': item?.['Price per unit'] || '',
        'Курс юаня': item?.['Yuan Rate'] || '',
        'Курс $': item?.['Dollar Rate'] || '',
        'Масса товара': item?.['Weight'] || '',
        'Наименование сделки': item?.['Order Name'] || '',
        'Статус': item?.dealStatus || '',
        'Дата создания сделки': item?.dealCreationDate ? 
          new Date(item.dealCreationDate).toLocaleDateString('ru-RU') : '',
        'Даты первой оплаты сделки': item?.dealFirstPaymentDate ? 
          new Date(item.dealFirstPaymentDate).toLocaleDateString('ru-RU') : '',
        'Контрагент': item?.contractor || '',
        'ВХОД. ю': item?.entranceYuan || '',
        'ВХОД. $': item?.entranceDollar || '',
        'Менеджер по продажам': item?.salesManager || '',
        'Снабженец': item?.supplier || ''
      }));
    }

    // Создаем Excel файл
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);
    
    // Настраиваем ширину колонок
    const colWidths = type === 'google-sheets' ? [
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
    ] : [
      { wch: 5 },   // №
      { wch: 40 },  // Наименование
      { wch: 20 },  // Бренд
      { wch: 15 },  // Количество
      { wch: 15 },  // Цена в юанях
      { wch: 12 },  // Курс юаня
      { wch: 12 },  // Курс $
      { wch: 15 },  // Масса товара
      { wch: 50 },  // Наименование сделки
      { wch: 20 },  // Статус
      { wch: 15 },  // Дата создания сделки
      { wch: 15 },  // Дата первой оплаты
      { wch: 30 },  // Контрагент
      { wch: 12 },  // ВХОД. ю
      { wch: 12 },  // ВХОД. $
      { wch: 25 },  // Менеджер
      { wch: 25 }   // Снабженец
    ];
    
    ws['!cols'] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws, 'Данные');
    
    // Генерируем имя файла
    const fileName = type === 'google-sheets' 
      ? `товары_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.xlsx`
      : `заказы_и_сделки_${new Date().toLocaleDateString('ru-RU').replace(/\./g, '_')}.xlsx`;
    
    // Конвертируем в buffer
    const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' });
    
    // Возвращаем файл
    return new NextResponse(wbout, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName)}"`,
        'Content-Length': wbout.length.toString(),
      },
    });

  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Ошибка при экспорте данных' },
      { status: 500 }
    );
  }
}
