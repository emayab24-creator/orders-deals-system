
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, ExternalLink, Settings, Upload, Download, Loader2, RefreshCw } from 'lucide-react';

export default function GoogleSheetsSettings() {
  const [sheetsId, setSheetsId] = useState('');
  const [serviceAccountKey, setServiceAccountKey] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');
  const [sheetInfo, setSheetInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    // Загружаем сохраненные настройки из localStorage
    const savedSheetsId = localStorage.getItem('googleSheetsId');
    const savedKey = localStorage.getItem('googleServiceAccountKey');
    
    if (savedSheetsId) {
      setSheetsId(savedSheetsId);
    }
    if (savedKey) {
      setServiceAccountKey(savedKey);
    }
  }, []);

  const testConnection = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await fetch('/api/google-sheets/test');
      const data = await response.json();

      if (data.success) {
        setConnectionStatus('connected');
        setSheetInfo(data.sheetInfo);
        setMessage('✅ Подключение к Google Sheets успешно!');
      } else {
        setConnectionStatus('error');
        setError(data.message || 'Ошибка подключения');
      }
    } catch (err) {
      console.error('Connection test error:', err);
      setConnectionStatus('error');
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const initializeSheets = async () => {
    try {
      setLoading(true);
      setError(null);
      setMessage(null);

      const response = await fetch('/api/google-sheets/init', {
        method: 'POST'
      });
      
      const data = await response.json();

      if (data.success) {
        setSheetInfo(data.sheetInfo);
        setMessage('✅ Google Sheets инициализирована с заголовками!');
        setConnectionStatus('connected');
      } else {
        setError(data.message || 'Ошибка инициализации');
      }
    } catch (err) {
      console.error('Initialization error:', err);
      setError(err instanceof Error ? err.message : 'Неизвестная ошибка');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = () => {
    localStorage.setItem('googleSheetsId', sheetsId);
    localStorage.setItem('googleServiceAccountKey', serviceAccountKey);
    setMessage('💾 Настройки сохранены в браузере');
  };

  const clearSettings = () => {
    if (confirm('Очистить сохраненные настройки?')) {
      localStorage.removeItem('googleSheetsId');
      localStorage.removeItem('googleServiceAccountKey');
      setSheetsId('');
      setServiceAccountKey('');
      setConnectionStatus('unknown');
      setSheetInfo(null);
      setMessage('🗑️ Настройки очищены');
    }
  };

  const extractSheetsIdFromUrl = (url: string) => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : '';
  };

  const handleUrlChange = (url: string) => {
    const id = extractSheetsIdFromUrl(url);
    if (id) {
      setSheetsId(id);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Настройка Google Sheets</h1>
        <p className="text-muted-foreground">
          Подключение к Google Таблице для автоматического сохранения и синхронизации данных
        </p>
      </div>

      <Tabs defaultValue="setup" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="setup">Настройка подключения</TabsTrigger>
          <TabsTrigger value="status">Статус подключения</TabsTrigger>
        </TabsList>

        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>1. ID Google Таблицы</CardTitle>
              <CardDescription>
                Скопируйте URL вашей Google Таблицы или введите ID напрямую
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">URL Google Таблицы:</label>
                <Input
                  placeholder="https://docs.google.com/spreadsheets/d/ВАSH_SHEETS_ID/edit"
                  onChange={(e) => handleUrlChange(e.target.value)}
                />
              </div>
              
              <div>
                <label className="text-sm font-medium">ID Таблицы:</label>
                <Input
                  value={sheetsId}
                  onChange={(e) => setSheetsId(e.target.value)}
                  placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>2. Service Account Key</CardTitle>
              <CardDescription>
                JSON ключ от Google Service Account с доступом к Google Sheets API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={serviceAccountKey}
                onChange={(e) => setServiceAccountKey(e.target.value)}
                placeholder='{"type": "service_account", "project_id": "your-project"...}'
                className="min-h-[200px] font-mono text-xs"
              />
              
              <Alert>
                <Settings className="h-4 w-4" />
                <AlertDescription>
                  <strong>Как получить Service Account Key:</strong><br />
                  1. Перейдите в Google Cloud Console<br />
                  2. Создайте новый Service Account<br />
                  3. Скачайте JSON ключ<br />
                  4. Дайте Service Account доступ к вашей таблице (поделитесь таблицей с email из JSON)
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button onClick={saveSettings} variant="outline">
                  💾 Сохранить настройки
                </Button>
                <Button onClick={clearSettings} variant="destructive">
                  🗑️ Очистить
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Тестирование и инициализация</CardTitle>
              <CardDescription>
                Проверьте подключение и подготовьте таблицу для работы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={testConnection} 
                  disabled={!sheetsId || !serviceAccountKey || loading}
                  className="min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Тестирование...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Тест подключения
                    </>
                  )}
                </Button>
                
                <Button 
                  onClick={initializeSheets} 
                  disabled={connectionStatus !== 'connected' || loading}
                  variant="secondary"
                  className="min-w-[150px]"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Инициализация...
                    </>
                  ) : (
                    <>
                      <Settings className="h-4 w-4 mr-2" />
                      Инициализация
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {message && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>{message}</AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                Статус подключения
                <Badge 
                  variant={connectionStatus === 'connected' ? 'default' : 
                          connectionStatus === 'error' ? 'destructive' : 'secondary'}
                >
                  {connectionStatus === 'connected' ? '✅ Подключено' :
                   connectionStatus === 'error' ? '❌ Ошибка' : '⏳ Неизвестно'}
                </Badge>
              </CardTitle>
              <CardDescription>
                Информация о подключении к Google Таблице
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {sheetInfo && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium">Название таблицы:</div>
                    <div className="text-sm text-muted-foreground">{sheetInfo.title}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Лист:</div>
                    <div className="text-sm text-muted-foreground">{sheetInfo.sheetTitle}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Строки:</div>
                    <div className="text-sm text-muted-foreground">{sheetInfo.rows}</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Колонки:</div>
                    <div className="text-sm text-muted-foreground">{sheetInfo.columns}</div>
                  </div>
                </div>
              )}

              {sheetInfo?.url && (
                <div>
                  <Button 
                    onClick={() => window.open(sheetInfo.url, '_blank')}
                    variant="outline"
                    className="w-full"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Открыть Google Таблицу
                  </Button>
                </div>
              )}

              <div className="flex gap-2">
                <Button 
                  onClick={testConnection} 
                  variant="outline"
                  size="sm"
                  disabled={loading}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Обновить статус
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
