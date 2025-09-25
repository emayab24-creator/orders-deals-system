

'use client';

import { useState, useEffect } from 'react';
import { AuthService } from '@/lib/auth';
import { User } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Users, 
  Plus, 
  UserCheck, 
  UserX, 
  Trash2, 
  Eye, 
  EyeOff,
  Copy,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isAddingUser, setIsAddingUser] = useState(false);
  const [newUser, setNewUser] = useState({
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user' | 'employee',
    name: ''
  });
  const [showPasswords, setShowPasswords] = useState<{ [key: string]: boolean }>({});
  const [copiedPassword, setCopiedPassword] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
      } else {
        setError('Ошибка загрузки пользователей');
      }
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Ошибка загрузки пользователей');
    }
  };

  const handleAddUser = async () => {
    setError(null);
    setSuccess(null);

    if (!newUser.email || !newUser.email.endsWith('@alekri.ru')) {
      setError('Email должен быть в домене @alekri.ru');
      return;
    }

    if (!newUser.password || newUser.password.length < 6) {
      setError('Пароль должен содержать минимум 6 символов');
      return;
    }

    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newUser),
      });

      if (response.ok) {
        const data = await response.json();
        await loadUsers();
        setNewUser({ email: '', password: '', role: 'user', name: '' });
        setIsAddingUser(false);
        setSuccess(`Пользователь ${data.user.email} успешно создан`);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Ошибка при создании пользователя');
      }
    } catch (err) {
      console.error('Error creating user:', err);
      setError('Ошибка при создании пользователя');
    }
  };

  const handleGeneratePassword = () => {
    const password = AuthService.generatePassword();
    setNewUser({ ...newUser, password });
  };

  const toggleUserStatus = (userId: string) => {
    AuthService.toggleUserStatus(userId);
    loadUsers();
  };

  const deleteUser = async (userId: string) => {
    if (window.confirm('Вы уверены, что хотите удалить пользователя?')) {
      try {
        const response = await fetch(`/api/users?id=${userId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await loadUsers();
          setSuccess('Пользователь удален');
        } else {
          const errorData = await response.json();
          setError(errorData.error || 'Ошибка при удалении пользователя');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Ошибка при удалении пользователя');
      }
    }
  };

  const togglePasswordVisibility = (userId: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const copyToClipboard = async (text: string, userId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedPassword(userId);
      setTimeout(() => setCopiedPassword(null), 2000);
    } catch (err) {
      console.error('Не удалось скопировать в буфер обмена');
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Управление пользователями
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {success && (
            <div className="flex items-center gap-2 p-3 text-sm text-green-600 bg-green-50 border border-green-200 rounded">
              <CheckCircle className="h-4 w-4 flex-shrink-0" />
              {success}
            </div>
          )}

          {/* Кнопка добавления пользователя */}
          {!isAddingUser && (
            <Button onClick={() => setIsAddingUser(true)} className="mb-4">
              <Plus className="h-4 w-4 mr-2" />
              Добавить пользователя
            </Button>
          )}

          {/* Форма добавления пользователя */}
          {isAddingUser && (
            <Card className="border-dashed">
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-email">Email</Label>
                    <div className="flex">
                      <Input
                        id="new-email"
                        type="text"
                        value={newUser.email.replace('@alekri.ru', '')}
                        onChange={(e) => setNewUser({
                          ...newUser,
                          email: e.target.value + '@alekri.ru'
                        })}
                        placeholder="username"
                        className="rounded-r-none"
                      />
                      <span className="px-3 py-2 bg-gray-100 border border-l-0 rounded-r text-sm text-gray-600">
                        @alekri.ru
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-name">Имя (опционально)</Label>
                    <Input
                      id="new-name"
                      type="text"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                      placeholder="Имя пользователя"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Пароль</Label>
                    <div className="flex gap-2">
                      <Input
                        id="new-password"
                        type="text"
                        value={newUser.password}
                        onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                        placeholder="Пароль"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGeneratePassword}
                        className="flex-shrink-0"
                      >
                        Сгенерировать
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-role">Роль</Label>
                    <Select value={newUser.role} onValueChange={(value: 'admin' | 'user' | 'employee') => setNewUser({ ...newUser, role: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">Пользователь</SelectItem>
                        <SelectItem value="employee">Сотрудник</SelectItem>
                        <SelectItem value="admin">Администратор</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2 mt-4">
                  <Button onClick={handleAddUser}>
                    Создать пользователя
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsAddingUser(false);
                      setNewUser({ email: '', password: '', role: 'user', name: '' });
                      setError(null);
                    }}
                  >
                    Отмена
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Список пользователей */}
          <div className="space-y-2">
            <h4 className="font-semibold text-gray-900">Существующие пользователи</h4>
            <div className="space-y-2">
              {users.map((user) => (
                <Card key={user.id} className={`${!user.isActive ? 'opacity-60' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{user.email}</span>
                              <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                {user.role === 'admin' ? 'Администратор' : 
                                 user.role === 'employee' ? 'Сотрудник' : 'Пользователь'}
                              </Badge>
                              {!user.isActive && <Badge variant="destructive">Деактивирован</Badge>}
                            </div>
                            {user.name && (
                              <div className="text-sm text-gray-600">{user.name}</div>
                            )}
                          </div>
                        </div>
                        
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <span className="text-gray-600">Пароль:</span>
                          <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                            {showPasswords[user.id] ? user.password : '••••••••'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => togglePasswordVisibility(user.id)}
                            className="h-6 w-6 p-0"
                          >
                            {showPasswords[user.id] ? 
                              <EyeOff className="h-3 w-3" /> : 
                              <Eye className="h-3 w-3" />
                            }
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyToClipboard(user.password, user.id)}
                            className="h-6 w-6 p-0"
                          >
                            {copiedPassword === user.id ? 
                              <CheckCircle className="h-3 w-3 text-green-600" /> : 
                              <Copy className="h-3 w-3" />
                            }
                          </Button>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleUserStatus(user.id)}
                          className={user.isActive ? 'text-orange-600' : 'text-green-600'}
                        >
                          {user.isActive ? (
                            <>
                              <UserX className="h-4 w-4 mr-1" />
                              Деактивировать
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4 mr-1" />
                              Активировать
                            </>
                          )}
                        </Button>
                        
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => deleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
