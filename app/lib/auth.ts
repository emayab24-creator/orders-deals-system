

'use client';

import { User, UserSession } from './types';

// Базовые пользователи (в реальном приложении это должно быть в базе данных)
const DEFAULT_USERS: User[] = [
  {
    id: '1',
    email: 'admin@alekri.ru',
    password: 'admin123',
    role: 'admin',
    name: 'Администратор',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: '2',
    email: 'user@alekri.ru',
    password: 'user123',
    role: 'user',
    name: 'Пользователь',
    createdAt: new Date().toISOString(),
    isActive: true
  },
  {
    id: '3',
    email: 'employee@alekri.ru',
    password: 'employee123',
    role: 'employee',
    name: 'Сотрудник',
    createdAt: new Date().toISOString(),
    isActive: true
  }
];

export class AuthService {
  private static readonly STORAGE_KEY = 'orders_system_users';
  private static readonly SESSION_KEY = 'orders_system_session';

  static initializeUsers(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const existingUsers = localStorage.getItem(this.STORAGE_KEY);
      if (!existingUsers) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(DEFAULT_USERS));
      }
    } catch (error) {
      console.warn('Could not initialize users in localStorage:', error);
    }
  }

  static getUsers(): User[] {
    if (typeof window === 'undefined') return [];
    
    const users = localStorage.getItem(this.STORAGE_KEY);
    return users ? JSON.parse(users) : DEFAULT_USERS;
  }

  static saveUsers(users: User[]): void {
    if (typeof window === 'undefined') return;
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
  }

  static login(email: string, password: string): UserSession | null {
    const users = this.getUsers();
    const user = users.find(u => u.email === email && u.password === password && u.isActive);
    
    if (user) {
      const session: UserSession = {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name
      };
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
      }
      
      return session;
    }
    
    return null;
  }

  static logout(): void {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem(this.SESSION_KEY);
  }

  static getCurrentSession(): UserSession | null {
    if (typeof window === 'undefined') return null;
    
    const session = localStorage.getItem(this.SESSION_KEY);
    return session ? JSON.parse(session) : null;
  }

  static createUser(userData: {
    email: string;
    password: string;
    role: 'admin' | 'user' | 'employee';
    name?: string;
  }): User {
    const users = this.getUsers();
    const newUser: User = {
      id: Date.now().toString(),
      ...userData,
      createdAt: new Date().toISOString(),
      isActive: true
    };
    
    users.push(newUser);
    this.saveUsers(users);
    
    return newUser;
  }

  static toggleUserStatus(userId: string): boolean {
    const users = this.getUsers();
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex >= 0) {
      users[userIndex].isActive = !users[userIndex].isActive;
      this.saveUsers(users);
      return true;
    }
    
    return false;
  }

  static deleteUser(userId: string): boolean {
    const users = this.getUsers();
    const filteredUsers = users.filter(u => u.id !== userId);
    
    if (filteredUsers.length < users.length) {
      this.saveUsers(filteredUsers);
      return true;
    }
    
    return false;
  }

  static generatePassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
