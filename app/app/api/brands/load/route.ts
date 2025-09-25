


import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';

interface BrandData {
  id: number;
  brand: string;
  code: number;
  article: string;
  quantity: number;
}

export async function POST() {
  try {
    console.log('[BRAND API] Loading brand data from Excel file...');
    
    // Путь к загруженному файлу
    const filePath = path.join(process.cwd(), 'public', 'data', 'festo_smc_brands.xlsx');
    
    // Проверяем существование файла
    if (!fs.existsSync(filePath)) {
      console.error('[BRAND API] Brand file not found:', filePath);
      return NextResponse.json({ error: 'Brand data file not found' }, { status: 404 });
    }

    // Читаем Excel файл через Buffer
    const fileBuffer = fs.readFileSync(filePath);
    const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0]; // Берем первый лист
    const worksheet = workbook.Sheets[sheetName];
    
    // Конвертируем в массив массивов
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
    
    console.log(`[BRAND API] Read ${rawData.length} rows from Excel file`);

    // Преобразуем в структурированные данные
    const brandData: BrandData[] = rawData
      .filter((row, index) => {
        // Пропускаем пустые строки и проверяем наличие нужных колонок
        return row && row.length >= 4 && row[1] && row[3];
      })
      .map((row, index) => ({
        id: row[0] || index + 1,
        brand: row[1]?.toString().trim() || '',
        code: parseInt(row[2]) || 0,
        article: row[3]?.toString().trim() || '',
        quantity: parseInt(row[4]) || 1
      }))
      .filter(item => item.brand && item.article); // Убираем записи без бренда или артикула

    console.log(`[BRAND API] Processed ${brandData.length} valid brand records`);
    console.log(`[BRAND API] Sample data:`, brandData.slice(0, 3));

    return NextResponse.json(brandData);

  } catch (error) {
    console.error('[BRAND API] Error loading brand data:', error);
    return NextResponse.json(
      { error: 'Failed to load brand data: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
