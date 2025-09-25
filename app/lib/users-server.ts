
// Сервер-сайд управление пользователями
// В реальном приложении это должно быть в базе данных

export type ServerUser = {
  id: string;
  email: string;
  password: string;
  role: 'admin' | 'user' | 'employee';
  name: string;
  createdAt: string;
  isActive: boolean;
};

let SERVER_USERS: ServerUser[] = [
  {
    id: '1',
    email: 'admin@alekri.ru',
    password: 'admin123',
    role: 'admin' as const,
    name: 'Администратор',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: '2',
    email: 'user@alekri.ru',
    password: 'user123',
    role: 'user' as const,
    name: 'Пользователь',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: '3',
    email: 'employee@alekri.ru',
    password: 'employee123',
    role: 'employee' as const,
    name: 'Сотрудник',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

export class UsersServerService {
  static getAllUsers(): ServerUser[] {
    console.log('[UsersServer] Getting all users, count:', SERVER_USERS.length);
    return SERVER_USERS;
  }

  static getUserById(id: string): ServerUser | undefined {
    return SERVER_USERS.find(user => user.id === id);
  }

  static getUserByEmail(email: string): ServerUser | undefined {
    return SERVER_USERS.find(user => user.email === email);
  }

  static authenticateUser(email: string, password: string): ServerUser | null {
    const user = SERVER_USERS.find(u => u.email === email && u.password === password && u.isActive);
    console.log('[UsersServer] Authenticating user:', email, 'Found:', !!user);
    return user || null;
  }

  static createUser(userData: {
    email: string;
    password: string;
    role: 'admin' | 'user' | 'employee';
    name?: string;
  }): ServerUser {
    // Проверяем уникальность email
    if (SERVER_USERS.find(user => user.email === userData.email)) {
      throw new Error('Пользователь с таким email уже существует');
    }

    const newUser: ServerUser = {
      id: Date.now().toString(),
      email: userData.email,
      password: userData.password,
      role: userData.role,
      name: userData.name || userData.email.split('@')[0],
      createdAt: new Date().toISOString(),
      isActive: true
    };

    SERVER_USERS.push(newUser);
    console.log('[UsersServer] User created:', newUser.email);
    return newUser;
  }

  static updateUser(id: string, updates: Partial<Omit<ServerUser, 'id' | 'createdAt'>>): ServerUser | null {
    const userIndex = SERVER_USERS.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    SERVER_USERS[userIndex] = { ...SERVER_USERS[userIndex], ...updates };
    console.log('[UsersServer] User updated:', SERVER_USERS[userIndex].email);
    return SERVER_USERS[userIndex];
  }

  static deleteUser(id: string): ServerUser | null {
    const userIndex = SERVER_USERS.findIndex(user => user.id === id);
    
    if (userIndex === -1) {
      return null;
    }

    const deletedUser = SERVER_USERS.splice(userIndex, 1)[0];
    console.log('[UsersServer] User deleted:', deletedUser.email);
    return deletedUser;
  }

  static toggleUserStatus(id: string): ServerUser | null {
    const user = this.getUserById(id);
    
    if (!user) {
      return null;
    }

    return this.updateUser(id, { isActive: !user.isActive });
  }
}
