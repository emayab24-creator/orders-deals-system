
import { NextRequest, NextResponse } from 'next/server';
import { UsersServerService } from '@/lib/users-server';

// GET - получить всех пользователей
export async function GET() {
  try {
    const users = UsersServerService.getAllUsers();
    console.log('[USERS-API] GET request - returning users:', users.length);
    return NextResponse.json({ 
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        createdAt: user.createdAt,
        isActive: user.isActive,
        password: user.password // Для админки показываем пароль
      }))
    });
  } catch (error) {
    console.error('[USERS-API] GET error:', error);
    return NextResponse.json({ error: 'Ошибка получения пользователей' }, { status: 500 });
  }
}

// POST - создать нового пользователя
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('[USERS-API] POST request - creating user:', body);

    const { email, password, role, name } = body;

    // Проверяем обязательные поля
    if (!email || !password || !role) {
      return NextResponse.json(
        { error: 'Отсутствуют обязательные поля: email, password, role' }, 
        { status: 400 }
      );
    }

    // Создаем нового пользователя
    const newUser = UsersServerService.createUser({
      email,
      password,
      role,
      name
    });

    console.log('[USERS-API] User created successfully:', newUser.email);
    return NextResponse.json({ 
      message: 'Пользователь создан успешно',
      user: newUser 
    }, { status: 201 });

  } catch (error) {
    console.error('[USERS-API] POST error:', error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Ошибка создания пользователя' }, { status: 500 });
  }
}

// DELETE - удалить пользователя
export async function DELETE(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ error: 'Не указан ID пользователя' }, { status: 400 });
    }

    const deletedUser = UsersServerService.deleteUser(userId);
    
    if (!deletedUser) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });
    }

    console.log('[USERS-API] User deleted:', deletedUser.email);

    return NextResponse.json({ 
      message: 'Пользователь удален', 
      user: deletedUser 
    });

  } catch (error) {
    console.error('[USERS-API] DELETE error:', error);
    return NextResponse.json({ error: 'Ошибка удаления пользователя' }, { status: 500 });
  }
}
