

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { CurrentRequestsService } from '@/lib/current-requests-service';
import { ErrorTrackingService } from '@/lib/error-tracking-service';

// POST - анализ текущих запросов и выявление ошибочных позиций
export async function POST(request: NextRequest) {
  try {
    console.log('[ANALYZE ERRORS API] Starting error analysis...');
    
    const requestsService = CurrentRequestsService.getInstance();
    const errorService = ErrorTrackingService.getInstance();
    const currentRows = requestsService.getCurrentRequestRows();
    
    if (currentRows.length === 0) {
      console.log('[ANALYZE ERRORS API] No current requests to analyze');
      return NextResponse.json({
        success: true,
        message: 'No requests to analyze',
        errorCount: 0,
        errors: []
      });
    }

    console.log('[ANALYZE ERRORS API] Analyzing rows:', currentRows);

    const sheetsService = new GoogleSheetsService();
    const processedData = await sheetsService.getProcessedDataByRows(currentRows);
    
    // Критерии для определения ошибочной позиции:
    // 1. Есть запрос (колонка B), но нет основных данных (наименование, бренд, артикул)
    // 2. Есть запрос, но нет ТН ВЭД кода
    // 3. Есть запрос, но все остальные колонки пустые
    
    const errorItems: Array<{rowNumber: number, originalRequest: string, errorReason: string}> = [];
    
    for (const row of currentRows) {
      const processedRow = processedData.find(data => data._rowNumber === row);
      
      if (!processedRow) {
        // Получаем оригинальный запрос из Google Sheets
        try {
          const requestResponse = await sheetsService.getProcessedDataByRows([row]);
          const originalRequest = requestResponse[0]?.B || 'Неизвестный запрос';
          
          errorItems.push({
            rowNumber: row,
            originalRequest,
            errorReason: 'Нет обработанных данных'
          });
        } catch (error) {
          console.error(`[ANALYZE ERRORS API] Error getting original request for row ${row}:`, error);
        }
        continue;
      }

      const { B: request, C: name, D: brand, E: article, M: tnVed } = processedRow;
      
      // Проверяем наличие ключевых данных
      const hasBasicInfo = name && name.trim() !== '' && name.trim() !== '-';
      const hasBrand = brand && brand.trim() !== '' && brand.trim() !== '-';
      const hasArticle = article && article.trim() !== '' && article.trim() !== '-';
      const hasTnVed = tnVed && tnVed.trim() !== '' && tnVed.trim() !== '-';
      
      let errorReason = '';
      
      // Если есть запрос, но нет основной информации
      if (request && request.trim() !== '') {
        const missingFields = [];
        
        if (!hasBasicInfo) missingFields.push('наименование');
        if (!hasBrand) missingFields.push('бренд');
        if (!hasArticle) missingFields.push('артикул');
        if (!hasTnVed) missingFields.push('ТН ВЭД');
        
        // Считаем ошибкой, если отсутствуют 3 или более ключевых поля
        if (missingFields.length >= 3) {
          errorReason = `Отсутствуют ключевые данные: ${missingFields.join(', ')}`;
        }
        // Или если отсутствует наименование (самое важное поле)
        else if (!hasBasicInfo) {
          errorReason = 'Отсутствует наименование товара';
        }
      }
      
      if (errorReason) {
        errorItems.push({
          rowNumber: row,
          originalRequest: request || 'Неизвестный запрос',
          errorReason
        });
      }
    }

    // Сохраняем ошибочные позиции в сервис
    errorService.clearErrorItems(); // Очищаем предыдущие ошибки
    errorItems.forEach(item => {
      errorService.addErrorItem(item.rowNumber, item.originalRequest, item.errorReason);
    });

    console.log(`[ANALYZE ERRORS API] Found ${errorItems.length} error items out of ${currentRows.length} total requests`);
    
    return NextResponse.json({
      success: true,
      totalRequests: currentRows.length,
      errorCount: errorItems.length,
      successfulCount: currentRows.length - errorItems.length,
      errors: errorItems
    });

  } catch (error: any) {
    console.error('[ANALYZE ERRORS API] Error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze errors: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET - получение текущих ошибочных позиций
export async function GET(request: NextRequest) {
  try {
    const errorService = ErrorTrackingService.getInstance();
    const errorItems = errorService.getErrorItems();
    
    console.log(`[ANALYZE ERRORS API] Retrieved ${errorItems.length} error items`);
    
    return NextResponse.json({
      success: true,
      errorCount: errorItems.length,
      errors: errorItems
    });

  } catch (error: any) {
    console.error('[ANALYZE ERRORS API] Error getting errors:', error);
    return NextResponse.json(
      { error: 'Failed to get error items: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// DELETE - очистка ошибочных позиций
export async function DELETE(request: NextRequest) {
  try {
    const errorService = ErrorTrackingService.getInstance();
    const count = errorService.getErrorCount();
    errorService.clearErrorItems();
    
    console.log(`[ANALYZE ERRORS API] Cleared ${count} error items`);
    
    return NextResponse.json({
      success: true,
      message: `Cleared ${count} error items`,
      clearedCount: count
    });

  } catch (error: any) {
    console.error('[ANALYZE ERRORS API] Error clearing errors:', error);
    return NextResponse.json(
      { error: 'Failed to clear error items: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
