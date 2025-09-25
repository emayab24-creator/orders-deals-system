
import { NextResponse } from 'next/server';
import { checkProcessingStatus } from '@/lib/googleSheets';

export async function GET() {
  try {
    const status = await checkProcessingStatus();
    
    return NextResponse.json({
      success: true,
      ...status
    });
  } catch (error) {
    console.error('Ошибка API проверки статуса:', error);
    return NextResponse.json(
      { error: 'Не удалось проверить статус обработки' },
      { status: 500 }
    );
  }
}
