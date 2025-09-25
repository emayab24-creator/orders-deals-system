

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { RotateCcw, AlertTriangle, RefreshCw, CheckCircle, XCircle, Loader2 } from 'lucide-react';

interface ErrorItem {
  rowNumber: number;
  originalRequest: string;
  errorReason: string;
  timestamp: number;
}

interface ProductErrorsListProps {
  onRetryComplete?: () => void; // Callback когда повтор завершен
  className?: string;
}

export default function ProductErrorsList({ onRetryComplete, className }: ProductErrorsListProps) {
  const [errorItems, setErrorItems] = useState<ErrorItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  // Загрузка ошибочных позиций
  const loadErrorItems = async () => {
    try {
      setLoading(true);
      
      const response = await fetch('/api/products/analyze-errors');
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setErrorItems(data.errors || []);
      } else {
        throw new Error(data.error || 'Failed to load error items');
      }
      
    } catch (error) {
      console.error('Error loading error items:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to load error items');
      setMessageType('error');
      setErrorItems([]);
    } finally {
      setLoading(false);
    }
  };

  // Анализ текущих запросов для выявления ошибок
  const analyzeErrors = async () => {
    try {
      setAnalyzing(true);
      setMessage(null);
      
      const response = await fetch('/api/products/analyze-errors', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setErrorItems(data.errors || []);
        
        if (data.errorCount > 0) {
          setMessage(`Найдено ${data.errorCount} позиций с ошибками из ${data.totalRequests} добавленных`);
          setMessageType('error');
        } else {
          setMessage(`Все ${data.totalRequests} позиций обработаны успешно!`);
          setMessageType('success');
        }
      } else {
        throw new Error(data.error || 'Failed to analyze errors');
      }
      
    } catch (error) {
      console.error('Error analyzing errors:', error);
      setMessage(error instanceof Error ? error.message : 'Failed to analyze errors');
      setMessageType('error');
    } finally {
      setAnalyzing(false);
    }
  };

  // Повторная обработка ошибочных позиций
  const retryErrors = async () => {
    if (errorItems.length === 0) {
      return;
    }

    try {
      setRetrying(true);
      setMessage(null);
      
      // Показываем промежуточное сообщение
      setMessage(`Отправка ${errorItems.length} позиций на повторную обработку...`);
      setMessageType('success');
      
      const response = await fetch('/api/products/retry-errors', {
        method: 'POST',
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setErrorItems([]);
        
        // Подробное сообщение об успехе
        const successMessage = `✅ ${data.retriedCount} позиций успешно отправлено на повторную обработку!
        
🗑️ Ошибочные строки: ${data.originalErrorRows?.join(', ')} → полностью удалены из таблицы
➕ Новые строки: ${data.newRows?.join(', ')} → добавлены для обработки
📊 Всего отслеживаемых строк: ${data.totalCurrentRows || 'неизвестно'}

⏱️ Автоматическое обновление результатов через 8 секунд.
Google Sheets требуется время для обработки данных.`;
        
        setMessage(successMessage);
        setMessageType('success');
        
        // Вызываем callback если он передан
        if (onRetryComplete) {
          // Увеличиваем время ожидания для обработки Google Sheets
          setTimeout(() => {
            onRetryComplete();
          }, 8000); // Увеличено с 2 до 8 секунд
        }
        
      } else {
        throw new Error(data.error || 'Failed to retry errors');
      }
      
    } catch (error) {
      console.error('Error retrying errors:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to retry errors';
      setMessage(`❌ Ошибка при повторной отправке: ${errorMessage}`);
      setMessageType('error');
    } finally {
      setRetrying(false);
    }
  };

  // Загрузка при монтировании компонента
  useEffect(() => {
    loadErrorItems();
  }, []);

  // Очистка сообщения через 5 секунд
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className={className}>
      {/* Сообщения */}
      {message && (
        <Alert variant={messageType === 'error' ? 'destructive' : 'default'} className="mb-4">
          {messageType === 'error' ? (
            <XCircle className="h-4 w-4" />
          ) : (
            <CheckCircle className="h-4 w-4" />
          )}
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      )}

      {/* Карточка с ошибочными позициями */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                Ошибочные позиции
                {errorItems.length > 0 && (
                  <Badge variant="destructive">{errorItems.length}</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Позиции, которые не были корректно обработаны в Google Sheets
              </CardDescription>
            </div>
            
            <div className="flex gap-2">
              <Button 
                onClick={analyzeErrors} 
                variant="outline" 
                size="sm"
                disabled={analyzing}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Анализ...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Проверить ошибки
                  </>
                )}
              </Button>
              
              {errorItems.length > 0 && (
                <Button 
                  onClick={retryErrors} 
                  variant="default"
                  size="sm"
                  disabled={retrying}
                >
                  {retrying ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Отправка...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Отправить на доработку
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin mr-2" />
              Загрузка ошибочных позиций...
            </div>
          ) : errorItems.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-3 text-green-500" />
              <p>Нет ошибочных позиций</p>
              <p className="text-sm">Все добавленные товары успешно обработаны</p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground mb-3">
                Найдено {errorItems.length} ошибочных позиций:
              </div>
              
              <div className="max-h-64 overflow-y-auto space-y-2">
                {errorItems.map((item, index) => (
                  <div 
                    key={`${item.rowNumber}-${index}`}
                    className="border rounded-lg p-3 bg-red-50 border-red-200"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium text-sm text-red-800">
                        Строка {item.rowNumber}
                      </div>
                      <Badge variant="destructive" className="text-xs">
                        Ошибка
                      </Badge>
                    </div>
                    
                    <div className="space-y-1">
                      <div className="text-sm">
                        <span className="font-medium">Запрос:</span> {item.originalRequest}
                      </div>
                      <div className="text-xs text-red-600">
                        <span className="font-medium">Причина:</span> {item.errorReason}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="border-t pt-3 mt-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Совет:</strong> Нажмите "Отправить на доработку" чтобы полностью удалить ошибочные строки и добавить их заново для обработки в Google Sheets.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
