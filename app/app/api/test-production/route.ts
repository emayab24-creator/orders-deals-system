
import { NextRequest, NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function GET(request: NextRequest) {
  try {
    console.log('[PRODUCTION TEST] Starting Google Sheets test...');
    
    // Проверяем environment variables
    const envVariables = {
      GOOGLE_SHEETS_SPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
      GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
      privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
      NODE_ENV: process.env.NODE_ENV
    };
    
    console.log('[PRODUCTION TEST] Environment check:', envVariables);
    
    // Пробуем создать GoogleSheetsService
    const sheetsService = new GoogleSheetsService();
    console.log('[PRODUCTION TEST] GoogleSheetsService created');
    
    // Пробуем получить данные
    const data = await sheetsService.getProcessedData();
    console.log('[PRODUCTION TEST] Data retrieved:', data.length, 'records');
    
    return NextResponse.json({
      success: true,
      message: 'Google Sheets API working in production',
      recordCount: data.length,
      environmentVariables: envVariables,
      sampleData: data.slice(0, 2) // Показываем только первые 2 записи
    });
    
  } catch (error: any) {
    console.error('[PRODUCTION TEST] Error:', error);
    
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      environmentVariables: {
        GOOGLE_SHEETS_SPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID,
        GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY,
        privateKeyLength: process.env.GOOGLE_PRIVATE_KEY?.length || 0,
        NODE_ENV: process.env.NODE_ENV
      }
    }, { status: 500 });
  }
}
