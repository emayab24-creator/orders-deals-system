

import { NextResponse } from 'next/server';
import { GoogleSheetsService } from '@/lib/google-sheets';

export async function GET() {
  try {
    console.log('[TEST] Testing Google Sheets API access...');
    
    const sheetsService = new GoogleSheetsService();
    
    // Тестируем основные переменные окружения
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY;
    
    console.log('[TEST] Environment variables:');
    console.log('- GOOGLE_SHEETS_SPREADSHEET_ID:', spreadsheetId ? 'Set' : 'Not set');
    console.log('- GOOGLE_SERVICE_ACCOUNT_EMAIL:', serviceAccountEmail ? 'Set' : 'Not set');
    console.log('- GOOGLE_PRIVATE_KEY:', privateKey ? 'Set (length: ' + privateKey.length + ')' : 'Not set');
    
    try {
      const data = await sheetsService.getProcessedData();
      return NextResponse.json({
        success: true,
        message: 'Google Sheets API access successful',
        dataCount: data.length,
        firstItem: data[0] || null
      });
    } catch (error: any) {
      console.error('[TEST] Google Sheets API error:', error);
      return NextResponse.json({
        success: false,
        error: error.message,
        details: error.response?.data || null,
        status: error.response?.status || null
      }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error('[TEST] General error:', error);
    return NextResponse.json({
      success: false,
      error: 'General test error: ' + error.message
    }, { status: 500 });
  }
}

