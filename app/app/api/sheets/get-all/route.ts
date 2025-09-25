
import { NextResponse } from 'next/server';
import { getAllRowsFromSheet } from '@/lib/googleSheets';

export async function GET() {
  try {
    const rows = await getAllRowsFromSheet();
    
    return NextResponse.json({
      success: true,
      data: rows,
      count: rows.length
    });
  } catch (error) {
    console.error('Ошибка API получения всех строк:', error);
    return NextResponse.json(
      { error: 'Не удалось получить данные из таблицы' },
      { status: 500 }
    );
  }
}
