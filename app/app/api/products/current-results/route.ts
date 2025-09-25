

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { CurrentRequestsService } from '@/lib/current-requests-service';

// GET - получение результатов только по текущим запросам
export async function GET(request: NextRequest) {
  try {
    console.log('[CURRENT RESULTS API] Getting results for current requests...');
    
    const requestsService = CurrentRequestsService.getInstance();
    let currentRows = requestsService.getCurrentRequestRows();
    
    const sheetsService = new GoogleSheetsService();
    
    // Если нет текущих строк, пытаемся получить недавние запросы
    if (currentRows.length === 0) {
      console.log('[CURRENT RESULTS API] No current requests found, trying to get recent requests...');
      
      // Попробуем получить последние 30 записей из Google Sheets  
      currentRows = await requestsService.getRecentRequestRows(sheetsService, 30);
      
      if (currentRows.length === 0) {
        console.log('[CURRENT RESULTS API] No recent requests found either, returning all data');
        // В крайнем случае возвращаем все данные из Google Sheets
        const allData = await sheetsService.getProcessedData();
        return NextResponse.json(allData);
      }
    }
    
    const processedData = await sheetsService.getProcessedDataByRows(currentRows);
    
    // Проверяем, есть ли обработанные данные
    const actualProcessedCount = processedData.filter(row => row.C && row.C.trim() !== '').length;
    const expectedCount = currentRows.length;
    
    console.log(`[CURRENT RESULTS API] Retrieved ${processedData.length} results for ${currentRows.length === 30 ? 'recent' : 'current'} requests (rows: ${currentRows.slice(0, 5).join(', ')}${currentRows.length > 5 ? '...' : ''})`);
    console.log(`[CURRENT RESULTS API] Processed data ratio: ${actualProcessedCount}/${expectedCount} (${Math.round(actualProcessedCount/expectedCount*100)}% processed)`);
    
    return NextResponse.json(processedData);
      
  } catch (error) {
    console.error('[CURRENT RESULTS API] Error:', error);
    // В случае ошибки с текущими запросами, попробуем получить все данные
    try {
      console.log('[CURRENT RESULTS API] Fallback: getting all data from Google Sheets...');
      const sheetsService = new GoogleSheetsService();
      const allData = await sheetsService.getProcessedData();
      console.log(`[CURRENT RESULTS API] Fallback successful: retrieved ${allData.length} records`);
      return NextResponse.json(allData);
    } catch (fallbackError) {
      console.error('[CURRENT RESULTS API] Fallback also failed:', fallbackError);
      return NextResponse.json(
        { error: 'Failed to get current results data from Google Sheets' },
        { status: 500 }
      );
    }
  }
}

// DELETE - очистка текущих запросов
export async function DELETE(request: NextRequest) {
  try {
    console.log('[CURRENT RESULTS API] Clearing current requests...');
    
    const requestsService = CurrentRequestsService.getInstance();
    const currentRows = requestsService.getCurrentRequestRows();
    
    if (currentRows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No current requests to clear'
      });
    }
    
    // Очищаем только колонку B для текущих запросов
    const sheetsService = new GoogleSheetsService();
    const success = await sheetsService.clearRequestsByRows(currentRows);
    
    if (success) {
      // Очищаем отслеживание текущих запросов
      requestsService.clearCurrentRequestRows();
      
      return NextResponse.json({
        success: true,
        message: `Cleared ${currentRows.length} current requests from Google Sheets`,
        clearedRows: currentRows
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to clear current requests in Google Sheets' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[CURRENT RESULTS API] Error clearing current requests:', error);
    return NextResponse.json(
      { error: 'Failed to clear current requests' },
      { status: 500 }
    );
  }
}
