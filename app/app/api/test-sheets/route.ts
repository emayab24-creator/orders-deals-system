
import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    console.log('[TEST-SHEETS] Starting Google Sheets API test...');
    
    // Проверяем переменные окружения
    console.log('[TEST-SHEETS] Environment variables check:');
    console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL:', !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
    console.log('- GOOGLE_PRIVATE_KEY:', !!process.env.GOOGLE_PRIVATE_KEY);
    console.log('- GOOGLE_SHEETS_SPREADSHEET_ID:', !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID);
    console.log('- Spreadsheet ID:', process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.substring(0, 10) + '...');
    
    // Создаем экземпляр сервиса
    console.log('[TEST-SHEETS] Creating GoogleSheetsService instance...');
    const sheetsService = new GoogleSheetsService();
    console.log('[TEST-SHEETS] GoogleSheetsService instance created successfully');
    
    // Тестируем базовое подключение
    console.log('[TEST-SHEETS] Testing basic connection to Google Sheets...');
    const processedData = await sheetsService.getProcessedData();
    
    console.log(`[TEST-SHEETS] Success! Retrieved ${processedData.length} records`);
    
    // Показываем первые несколько записей для диагностики
    const sampleData = processedData.slice(0, 3);
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets API is working!',
      totalRecords: processedData.length,
      sampleData: sampleData,
      environment: {
        hasServiceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        spreadsheetIdPreview: process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.substring(0, 10) + '...'
      }
    });
    
  } catch (error: any) {
    console.error('[TEST-SHEETS] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message || 'Unknown error',
      stack: error.stack,
      environment: {
        hasServiceEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        hasPrivateKey: !!process.env.GOOGLE_PRIVATE_KEY,
        hasSpreadsheetId: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID
      }
    }, { status: 500 });
  }
}
