

import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Получаем cookie с сессией
    const authSession = request.cookies.get('auth_session');
    
    if (!authSession) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
    try {
      const session = JSON.parse(authSession.value);
      
      // Проверяем валидность сессии
      if (!session.id || !session.email) {
        return NextResponse.json({ authenticated: false }, { status: 200 });
      }
      
      return NextResponse.json({ 
        authenticated: true, 
        user: session 
      });
      
    } catch (parseError) {
      return NextResponse.json({ authenticated: false }, { status: 200 });
    }
    
  } catch (error) {
    console.error('[SESSION] Error:', error);
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const response = NextResponse.json({ success: true });
    
    // Удаляем cookie
    response.cookies.delete('auth_session');
    
    return response;
  } catch (error) {
    console.error('[LOGOUT] Error:', error);
    return NextResponse.json(
      { error: 'Ошибка выхода из системы' },
      { status: 500 }
    );
  }
}
