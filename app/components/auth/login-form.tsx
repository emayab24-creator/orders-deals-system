

'use client';

import { useState } from 'react';
import { AuthService } from '@/lib/auth';
import { UserSession } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertCircle, LogIn } from 'lucide-react';

interface LoginFormProps {
  onLogin: (session: UserSession) => void;
}

export default function LoginForm({ onLogin }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include' // Важно для cookies
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        try {
          const contentType = response.headers.get('content-type');
          console.log('Response content-type:', contentType);
          
          if (contentType && contentType.includes('application/json')) {
            const data = await response.json();
            console.log('Response data:', data);
            if (data.success && data.user) {
              // Сохраняем сессию в localStorage для клиента
              localStorage.setItem('user_session', JSON.stringify(data.user));
              onLogin(data.user);
            } else {
              setError('Неверный логин или пароль');
            }
          } else {
            // Если не JSON, возможно получили HTML или редирект
            const text = await response.text();
            console.log('Non-JSON response:', text.substring(0, 200));
            setError('Получен некорректный ответ от сервера');
          }
        } catch (parseError) {
          console.error('Error parsing response:', parseError);
          setError('Ошибка обработки ответа сервера: ' + (parseError instanceof Error ? parseError.message : String(parseError)));
        }
      } else {
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            setError(errorData.error || 'Неверный логин или пароль');
          } else {
            setError(`Ошибка сервера (${response.status}: ${response.statusText})`);
          }
        } catch (parseError) {
          setError(`Ошибка сервера (${response.status}): ${response.statusText}`);
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Произошла ошибка при входе: ' + (err instanceof Error ? err.message : 'Неизвестная ошибка'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold flex items-center justify-center gap-2">
            <LogIn className="h-6 w-6" />
            Вход в систему
          </CardTitle>
          <p className="text-gray-600">База знаний заказов и сделок</p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                required
                disabled={isLoading}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? 'Вход...' : 'Войти'}
            </Button>
          </form>


        </CardContent>
      </Card>
    </div>
  );
}
