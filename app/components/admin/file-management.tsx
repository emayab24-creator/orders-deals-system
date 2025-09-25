
'use client';

import { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Input } from '../ui/input';
import { 
  Upload, 
  FileText, 
  ShoppingCart, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Loader2,
  Download
} from 'lucide-react';
import { toast } from '../ui/use-toast';

interface FileInfo {
  name: string;
  type: 'nomenclature' | 'deals';
  size: number;
  lastModified: Date;
  path: string;
}

interface FileManagementProps {
  onFileUpload?: (type: 'nomenclature' | 'deals', file: File) => void;
}

export default function FileManagement({ onFileUpload }: FileManagementProps) {
  const [files, setFiles] = useState<FileInfo[]>([
    {
      name: 'orders.json',
      type: 'nomenclature',
      size: 458752,
      lastModified: new Date('2024-01-15'),
      path: '/data/orders.json'
    },
    {
      name: 'deal.json',
      type: 'deals',
      size: 234567,
      lastModified: new Date('2024-01-15'),
      path: '/data/deal.json'
    }
  ]);
  
  const [uploading, setUploading] = useState(false);
  const [uploadType, setUploadType] = useState<'nomenclature' | 'deals' | null>(null);
  
  const nomenclatureRef = useRef<HTMLInputElement>(null);
  const dealsRef = useRef<HTMLInputElement>(null);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileUpload = async (type: 'nomenclature' | 'deals') => {
    const fileRef = type === 'nomenclature' ? nomenclatureRef : dealsRef;
    const file = fileRef.current?.files?.[0];
    
    if (!file) return;

    // Проверяем формат файла
    if (!file.name.endsWith('.json')) {
      toast({
        title: "Ошибка загрузки",
        description: "Поддерживаются только файлы формата JSON",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    setUploadType(type);

    try {
      // Создаем FormData для отправки файла
      const formData = new FormData();
      formData.append('file', file);

      // Отправляем файл на соответствующий API endpoint
      const apiEndpoint = type === 'nomenclature' ? '/api/orders' : '/api/deals';
      const response = await fetch(apiEndpoint, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Обновляем список файлов
      const newFile: FileInfo = {
        name: file.name,
        type: type,
        size: file.size,
        lastModified: new Date(),
        path: `/data/${file.name}`
      };

      setFiles(prev => {
        const filtered = prev.filter(f => f.type !== type || f.name !== file.name);
        return [...filtered, newFile];
      });

      // Вызываем callback если есть
      if (onFileUpload) {
        onFileUpload(type, file);
      }

      toast({
        title: "Файл обновлен",
        description: `Файл ${file.name} успешно добавлен в категорию "${type === 'nomenclature' ? 'Номенклатура' : 'Сделки'}". Общий объем: ${result.totalRecords} записей, добавлено: ${result.addedRecords} записей.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Ошибка загрузки",
        description: "Произошла ошибка при загрузке и обработке файла",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      setUploadType(null);
      
      // Очищаем input
      if (fileRef.current) {
        fileRef.current.value = '';
      }
    }
  };

  const handleDeleteFile = (fileName: string, type: 'nomenclature' | 'deals') => {
    setFiles(prev => prev.filter(f => !(f.name === fileName && f.type === type)));
    
    toast({
      title: "Файл удален",
      description: `Файл ${fileName} был удален`,
    });
  };

  const nomenclatureFiles = files.filter(f => f.type === 'nomenclature');
  const dealsFiles = files.filter(f => f.type === 'deals');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Управление файлами данных
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            Здесь вы можете загружать и управлять файлами номенклатуры и сделок. 
            Поддерживаются только файлы формата JSON.
          </p>
        </CardContent>
      </Card>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Номенклатура */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShoppingCart className="h-5 w-5 text-blue-500" />
              Номенклатура
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Input
                ref={nomenclatureRef}
                type="file"
                accept=".json"
                onChange={() => handleFileUpload('nomenclature')}
                disabled={uploading}
                className="cursor-pointer"
              />
              <Button 
                onClick={() => nomenclatureRef.current?.click()}
                disabled={uploading && uploadType === 'nomenclature'}
                className="w-full"
                variant="outline"
              >
                {uploading && uploadType === 'nomenclature' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить файл номенклатуры
                  </>
                )}
              </Button>
            </div>

            {/* Список файлов номенклатуры */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Загруженные файлы:</h4>
              {nomenclatureFiles.length > 0 ? (
                <div className="space-y-2">
                  {nomenclatureFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.lastModified.toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Активен
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFile(file.name, file.type)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Файлы номенклатуры не загружены</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Сделки */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-green-500" />
              Сделки
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col gap-3">
              <Input
                ref={dealsRef}
                type="file"
                accept=".json"
                onChange={() => handleFileUpload('deals')}
                disabled={uploading}
                className="cursor-pointer"
              />
              <Button 
                onClick={() => dealsRef.current?.click()}
                disabled={uploading && uploadType === 'deals'}
                className="w-full"
                variant="outline"
              >
                {uploading && uploadType === 'deals' ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Загрузка...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Загрузить файл сделок
                  </>
                )}
              </Button>
            </div>

            {/* Список файлов сделок */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm text-gray-700">Загруженные файлы:</h4>
              {dealsFiles.length > 0 ? (
                <div className="space-y-2">
                  {dealsFiles.map((file, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-green-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{file.name}</p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(file.size)} • {file.lastModified.toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          Активен
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteFile(file.name, file.type)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                  <p className="text-sm">Файлы сделок не загружены</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Информационный блок */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-medium text-blue-900 mb-1">Важная информация</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Файлы должны быть в формате JSON</li>
                <li>• При загрузке нового файла данные будут дополнены существующими</li>
                <li>• Дублирующие записи обновляются, новые записи добавляются</li>
                <li>• Изменения применяются автоматически после загрузки</li>
                <li>• Рекомендуется делать резервные копии важных файлов</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
