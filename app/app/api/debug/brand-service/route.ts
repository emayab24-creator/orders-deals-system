


import { NextResponse } from 'next/server';
import { BrandService } from '@/lib/brand-service';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    console.log('[DEBUG] Checking brand service status...');
    
    const brandService = BrandService.getInstance();
    
    // Проверяем готовность сервиса
    const isReady = brandService.isReady();
    const stats = brandService.getStats();
    
    console.log('[DEBUG] Brand service ready:', isReady);
    console.log('[DEBUG] Brand service stats:', stats);
    
    // Проверяем наличие файла брендов
    const brandFilePath = path.join(process.cwd(), 'public', 'data', 'festo_smc_brands.xlsx');
    const brandFileExists = fs.existsSync(brandFilePath);
    
    // Проверяем наличие файла заказов
    const ordersFilePath = path.join(process.cwd(), 'public', 'data', 'orders.json');
    const ordersFileExists = fs.existsSync(ordersFilePath);
    let ordersCount = 0;
    
    if (ordersFileExists) {
      try {
        const ordersData = JSON.parse(fs.readFileSync(ordersFilePath, 'utf8'));
        ordersCount = Array.isArray(ordersData) ? ordersData.length : 0;
      } catch (err) {
        console.error('[DEBUG] Error reading orders file:', err);
      }
    }
    
    // Пробуем загрузить данные брендов если не готов
    if (!isReady) {
      console.log('[DEBUG] Attempting to load brand data...');
      try {
        await brandService.loadBrandData();
        console.log('[DEBUG] Brand data loaded successfully');
      } catch (loadError) {
        console.error('[DEBUG] Error loading brand data:', loadError);
      }
    }
    
    // Тестируем поиск бренда
    let testResults: (string | null)[] = [];
    if (brandService.isReady()) {
      testResults = [
        brandService.getBrandByArticle('10P-10-4A-AO-R-Y-4M+PZ'),
        brandService.getBrandByArticle('KQB2H12-03S'),
        brandService.getBrandByArticle('nonexistent-article')
      ];
    }
    
    const debugInfo = {
      brandService: {
        isReady: brandService.isReady(),
        stats: brandService.getStats()
      },
      files: {
        brandFile: {
          exists: brandFileExists,
          path: brandFilePath
        },
        ordersFile: {
          exists: ordersFileExists,
          path: ordersFilePath,
          count: ordersCount
        }
      },
      testBrandLookup: testResults,
      timestamp: new Date().toISOString()
    };
    
    console.log('[DEBUG] Debug info:', debugInfo);
    
    return NextResponse.json(debugInfo);
    
  } catch (error) {
    console.error('[DEBUG] Error in debug endpoint:', error);
    return NextResponse.json({
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
