
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  // Только для отладки - НЕ показываем реальные ключи
  const envCheck = {
    NEXTAUTH_URL: !!process.env.NEXTAUTH_URL ? process.env.NEXTAUTH_URL : 'NOT SET',
    NEXTAUTH_SECRET: !!process.env.NEXTAUTH_SECRET ? 'SET' : 'NOT SET',
    GOOGLE_SHEETS_SPREADSHEET_ID: !!process.env.GOOGLE_SHEETS_SPREADSHEET_ID ? 'SET' : 'NOT SET',
    GOOGLE_SERVICE_ACCOUNT_EMAIL: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ? 'SET' : 'NOT SET',
    GOOGLE_PRIVATE_KEY: !!process.env.GOOGLE_PRIVATE_KEY ? `SET (${process.env.GOOGLE_PRIVATE_KEY?.length} chars)` : 'NOT SET',
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(envCheck);
}
