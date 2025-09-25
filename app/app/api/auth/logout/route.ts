

import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const response = NextResponse.json(
      { success: true, message: 'Logged out successfully' },
      { status: 200 }
    );
    
    // Удаляем cookie
    response.cookies.set('auth_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires: new Date(0)
    });
    
    return response;
  } catch (error) {
    return NextResponse.json(
      { error: 'Ошибка выхода' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ message: 'Logout endpoint' });
}
