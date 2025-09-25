

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { ErrorTrackingService } from '@/lib/error-tracking-service';

// POST - повторная обработка ошибочных позиций
export async function POST(request: NextRequest) {
  try {
    console.log('[RETRY ERRORS API] Starting retry process...');
    
    const errorService = ErrorTrackingService.getInstance();
    const errorItems = errorService.getErrorItems();
    
    if (errorItems.length === 0) {
      console.log('[RETRY ERRORS API] No error items to retry');
      return NextResponse.json({
        success: true,
        message: 'No error items to retry',
        retriedCount: 0
      });
    }

    console.log(`[RETRY ERRORS API] Retrying ${errorItems.length} error items`);

    const sheetsService = new GoogleSheetsService();
    
    // Получаем оригинальные запросы из ошибочных позиций
    const requestsToRetry = errorItems.map(item => item.originalRequest);
    const errorRows = errorItems.map(item => item.rowNumber);
    
    console.log('[RETRY ERRORS API] Original requests to retry:', requestsToRetry);
    console.log('[RETRY ERRORS API] Error rows to clear:', errorRows);
    
    // Сначала обновляем CurrentRequestsService - удаляем старые ошибочные строки
    const { CurrentRequestsService } = await import('@/lib/current-requests-service');
    const requestsService = CurrentRequestsService.getInstance();
    const currentRows = requestsService.getCurrentRequestRows();
    const rowsAfterErrorRemoval = currentRows.filter(row => !errorRows.includes(row));
    
    // Полностью удаляем ошибочные строки из Google Sheets
    try {
      const deleteSuccess = await sheetsService.deleteRowsByNumbers(errorRows);
      if (deleteSuccess) {
        console.log('[RETRY ERRORS API] Successfully deleted error rows from Google Sheets');
      } else {
        console.log('[RETRY ERRORS API] Failed to delete error rows, but continuing...');
      }
    } catch (deleteError) {
      console.error('[RETRY ERRORS API] Error deleting rows:', deleteError);
      // Продолжаем выполнение даже если удаление не удалось
    }
    
    // Добавляем запросы заново
    const result = await sheetsService.addMultipleRequests(requestsToRetry);
    
    if (result.success) {
      console.log('[RETRY ERRORS API] Successfully re-added requests to new rows:', result.addedRows);
      
      // Обновляем CurrentRequestsService новыми строками
      const updatedRows = rowsAfterErrorRemoval.concat(result.addedRows);
      requestsService.setCurrentRequestRows(updatedRows);
      console.log('[RETRY ERRORS API] Updated CurrentRequestsService with rows:', updatedRows);
      
      // Удаляем старые ошибочные позиции из отслеживания только после успешного добавления
      errorService.clearErrorItems();
      
      return NextResponse.json({
        success: true,
        message: `${errorItems.length} ошибочных строк удалено и повторно добавлено в Google Sheets`,
        retriedCount: errorItems.length,
        originalErrorRows: errorRows,
        newRows: result.addedRows,
        retriedRequests: requestsToRetry,
        totalCurrentRows: updatedRows.length,
        actionType: 'deleted_and_re-added' // Указываем что строки были удалены
      });
    } else {
      console.error('[RETRY ERRORS API] Failed to re-add requests to Google Sheets');
      return NextResponse.json(
        { error: 'Не удалось повторно добавить запросы в Google Sheets' },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('[RETRY ERRORS API] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка при повторной отправке: ' + (error?.message || 'Неизвестная ошибка') },
      { status: 500 }
    );
  }
}

// GET - получение информации о возможности повтора
export async function GET(request: NextRequest) {
  try {
    const errorService = ErrorTrackingService.getInstance();
    const errorItems = errorService.getErrorItems();
    
    return NextResponse.json({
      success: true,
      canRetry: errorItems.length > 0,
      errorCount: errorItems.length,
      errorItems: errorItems.map(item => ({
        rowNumber: item.rowNumber,
        originalRequest: item.originalRequest,
        errorReason: item.errorReason
      }))
    });

  } catch (error: any) {
    console.error('[RETRY ERRORS API] Error getting retry info:', error);
    return NextResponse.json(
      { error: 'Failed to get retry info: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
