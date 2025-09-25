


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Loader2, Search, Tag } from 'lucide-react';

interface BrandQuickSearchProps {
  onBrandSearch: (brandName: string) => void;
  isLoading?: boolean;
}

export default function BrandQuickSearch({ onBrandSearch, isLoading }: BrandQuickSearchProps) {
  const [brandStats, setBrandStats] = useState<{ [brand: string]: number }>({});
  const [statsLoading, setStatsLoading] = useState(true);

  // Загружаем статистику брендов
  useEffect(() => {
    const loadBrandStats = async () => {
      try {
        setStatsLoading(true);
        
        // Загружаем статистику брендов
        const statsResponse = await fetch('/api/brands/stats');
        if (!statsResponse.ok) {
          throw new Error('Failed to load brand statistics');
        }

        const stats = await statsResponse.json();
        console.log('Loaded brand stats:', stats);
        setBrandStats(stats);
        
      } catch (error) {
        console.error('Error loading brand stats:', error);
        // Если не удалось загрузить, показываем базовые бренды без статистики
        setBrandStats({
          'Festo': 0,
          'SMC': 0
        });
      } finally {
        setStatsLoading(false);
      }
    };

    loadBrandStats();
  }, []);

  const handleBrandClick = (brandName: string) => {
    if (!isLoading) {
      console.log(`[BrandQuickSearch] Clicked on ${brandName} brand`);
      onBrandSearch(brandName);
    } else {
      console.log(`[BrandQuickSearch] Click ignored - already loading`);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Tag className="h-5 w-5" />
          Быстрый поиск по брендам
        </CardTitle>
        <p className="text-sm text-gray-600">
          Нажмите на бренд чтобы найти все товары этого производителя
        </p>
      </CardHeader>
      
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          
          {/* Кнопка Festo */}
          <Button
            onClick={() => handleBrandClick('Festo')}
            disabled={isLoading || statsLoading}
            size="lg"
            className="w-full sm:w-auto min-w-[160px] h-14 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Поиск...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                Festo
                {brandStats['Festo'] !== undefined && brandStats['Festo'] > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white text-blue-600">
                    {brandStats['Festo']}
                  </Badge>
                )}
              </>
            )}
          </Button>

          {/* Кнопка SMC */}
          <Button
            onClick={() => handleBrandClick('SMC')}
            disabled={isLoading || statsLoading}
            size="lg"
            className="w-full sm:w-auto min-w-[160px] h-14 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold text-lg transition-all duration-200 transform hover:scale-105"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Поиск...
              </>
            ) : (
              <>
                <Search className="h-5 w-5 mr-2" />
                SMC
                {brandStats['SMC'] !== undefined && brandStats['SMC'] > 0 && (
                  <Badge variant="secondary" className="ml-2 bg-white text-green-600">
                    {brandStats['SMC']}
                  </Badge>
                )}
              </>
            )}
          </Button>
          
        </div>

        {/* Информационное сообщение */}
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-center">
          <p className="text-blue-800">
            💡 <strong>Совет:</strong> После поиска вы сможете скачать все найденные товары в Excel файле
          </p>
        </div>

        {/* Показываем статус загрузки */}
        {statsLoading && (
          <div className="flex items-center justify-center mt-4 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Загружается база брендов...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
