

import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';
import { CurrentRequestsService } from '@/lib/current-requests-service';

// POST - batch добавление запросов в Google Sheets
export async function POST(request: NextRequest) {
  try {
    console.log('[BATCH ADD API] POST request received');
    const body = await request.json();
    console.log('[BATCH ADD API] Request body:', body);
    
    const { productNames } = body;
    
    if (!productNames || !Array.isArray(productNames) || productNames.length === 0) {
      console.log('[BATCH ADD API] Invalid productNames:', productNames);
      return NextResponse.json(
        { error: 'Product names array is required' },
        { status: 400 }
      );
    }

    console.log('[BATCH ADD API] Adding multiple product requests to Google Sheets:', productNames.length);
    console.log('[BATCH ADD API] Product names:', productNames);
    
    const sheetsService = new GoogleSheetsService();
    const result = await sheetsService.addMultipleRequests(productNames.map(name => name.trim()));
    
    console.log('[BATCH ADD API] Google Sheets result:', result);
    
    if (result.success) {
      // Добавляем информацию о новых строках к существующим для отслеживания результатов
      const requestsService = CurrentRequestsService.getInstance();
      requestsService.addCurrentRequestRows(result.addedRows);
      
      return NextResponse.json({
        success: true,
        message: `${productNames.length} product requests added to Google Sheets successfully`,
        addedRows: result.addedRows,
        startRow: Math.min(...result.addedRows),
        endRow: Math.max(...result.addedRows),
        totalCurrentRows: requestsService.getCurrentRequestRows().length
      });
    } else {
      console.error('[BATCH ADD API] Google Sheets operation failed');
      return NextResponse.json(
        { error: 'Failed to add requests to Google Sheets' },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    console.error('[BATCH ADD API] Error adding requests:', error);
    console.error('[BATCH ADD API] Error message:', error?.message);
    console.error('[BATCH ADD API] Error stack:', error?.stack);
    return NextResponse.json(
      { error: 'Failed to add product requests: ' + (error?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}

// GET - получение информации о текущих запросах
export async function GET(request: NextRequest) {
  try {
    const requestsService = CurrentRequestsService.getInstance();
    const currentRows = requestsService.getCurrentRequestRows();
    
    return NextResponse.json({
      success: true,
      currentRequestRows: currentRows,
      hasCurrentRequests: currentRows.length > 0
    });
    
  } catch (error) {
    console.error('[BATCH ADD API] Error getting current requests info:', error);
    return NextResponse.json(
      { error: 'Failed to get current requests info' },
      { status: 500 }
    );
  }
}


