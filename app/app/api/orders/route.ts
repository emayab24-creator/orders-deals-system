
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'orders.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error('Error loading orders data:', error);
    return NextResponse.json({ error: 'Failed to load orders data' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Читаем содержимое загруженного файла
    const fileContent = await file.text();
    const newData = JSON.parse(fileContent);

    const filePath = path.join(process.cwd(), 'public', 'data', 'orders.json');
    
    let existingData = [];
    
    // Загружаем существующие данные, если файл есть
    if (fs.existsSync(filePath)) {
      const existingFileData = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(existingFileData);
    }

    // Объединяем данные (дополняем существующие новыми)
    let combinedData;
    if (Array.isArray(newData) && Array.isArray(existingData)) {
      // Если новые данные - это массив заказов
      combinedData = [...existingData, ...newData];
    } else if (Array.isArray(newData)) {
      // Если существующих данных нет, просто используем новые
      combinedData = newData;
    } else {
      // Если существующих данных нет и новые данные тоже не массив
      combinedData = existingData.length > 0 ? [...existingData, newData] : [newData];
    }

    // Убираем дубликаты по артикулу (если есть поле 'Article/Name')
    const uniqueData = combinedData.reduce((acc: any[], current: any) => {
      const articleName = current?.['Article/Name'];
      const orderName = current?.['Order Name'];
      
      // Проверяем на дубликаты по артикулу и названию заказа
      const existingIndex = acc.findIndex((item: any) => 
        item?.['Article/Name'] === articleName && item?.['Order Name'] === orderName
      );
      
      if (existingIndex !== -1) {
        // Обновляем существующую запись новыми данными
        acc[existingIndex] = { ...acc[existingIndex], ...current };
      } else {
        // Добавляем новую запись
        acc.push(current);
      }
      
      return acc;
    }, []);

    // Сохраняем объединенные данные
    fs.writeFileSync(filePath, JSON.stringify(uniqueData, null, 2));

    return NextResponse.json({ 
      message: 'Orders file updated successfully',
      totalRecords: uniqueData.length,
      addedRecords: uniqueData.length - existingData.length
    });
  } catch (error) {
    console.error('Error updating orders data:', error);
    return NextResponse.json({ error: 'Failed to update orders data' }, { status: 500 });
  }
}
