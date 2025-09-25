
import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';

// GET - получение данных продуктов из Google Sheets
export async function GET(request: NextRequest) {
  try {
    console.log('[PRODUCTS API] Getting products data from Google Sheets...');
    
    // Проверяем переменные окружения на продакшене
    console.log('[PRODUCTS API] Environment check:');
    console.log('- NODE_ENV:', process.env.NODE_ENV);
    console.log('- Has GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('- Has GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('- Has GOOGLE_SHEETS_SPREADSHEET_ID:', !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    console.log('- NEXTAUTH_URL:', process.env.NEXTAUTH_URL);
    
    const sheetsService = new GoogleSheetsService();
    const processedData = await sheetsService.getProcessedData();
    
    console.log(`[PRODUCTS API] Retrieved ${processedData.length} products from Google Sheets`);
    return NextResponse.json(processedData);
      
  } catch (error: any) {
    console.error('[PRODUCTS API] Error:', error);
    console.error('[PRODUCTS API] Error message:', error?.message);
    console.error('[PRODUCTS API] Error stack:', error?.stack);
    
    // Пробуем повторно с задержкой
    console.log('[PRODUCTS API] Retrying after delay...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    try {
      const sheetsService = new GoogleSheetsService();
      const processedData = await sheetsService.getProcessedData();
      console.log(`[PRODUCTS API] Retry successful, retrieved ${processedData.length} products`);
      return NextResponse.json(processedData);
    } catch (retryError: any) {
      console.error('[PRODUCTS API] Retry failed:', retryError);
      return NextResponse.json(
        { error: 'Failed to get products data from Google Sheets after retry' },
        { status: 500 }
      );
    }
  }
}

// DELETE - очистка запросов в Google Sheets
export async function DELETE(request: NextRequest) {
  try {
    console.log('[PRODUCTS API] Clearing requests in Google Sheets...');
    
    const sheetsService = new GoogleSheetsService();
    const success = await sheetsService.clearRequests();
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Requests cleared successfully in Google Sheets'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to clear requests in Google Sheets' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[PRODUCTS API] Error clearing data:', error);
    return NextResponse.json(
      { error: 'Failed to clear requests data' },
      { status: 500 }
    );
  }
}

// POST - добавление нового запроса в Google Sheets
export async function POST(request: NextRequest) {
  try {
    const { productName } = await request.json();
    
    if (!productName || typeof productName !== 'string') {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      );
    }

    console.log('[PRODUCTS API] Adding product request to Google Sheets:', productName);
    
    const sheetsService = new GoogleSheetsService();
    const success = await sheetsService.addRequest(productName.trim());
    
    if (success) {
      return NextResponse.json({
        success: true,
        message: 'Product request added to Google Sheets successfully'
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to add request to Google Sheets' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('[PRODUCTS API] Error adding request:', error);
    return NextResponse.json(
      { error: 'Failed to add product request' },
      { status: 500 }
    );
  }
}
