
import { NextResponse } from 'next/server';
import { addRequestToSheet } from '@/lib/googleSheets';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { request } = body;

    if (!request || typeof request !== 'string') {
      return NextResponse.json(
        { error: 'Запрос обязателен' },
        { status: 400 }
      );
    }

    const result = await addRequestToSheet(request);
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        rowNumber: result.rowNumber,
        message: 'Запрос успешно добавлен в таблицу'
      });
    } else {
      return NextResponse.json(
        { error: 'Не удалось добавить запрос в таблицу' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Ошибка API добавления запроса:', error);
    return NextResponse.json(
      { error: 'Внутренняя ошибка сервера' },
      { status: 500 }
    );
  }
}
