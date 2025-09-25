
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'public', 'data', 'deal.json');
    const fileData = fs.readFileSync(filePath, 'utf8');
    const jsonData = JSON.parse(fileData);
    
    return NextResponse.json(jsonData);
  } catch (error) {
    console.error('Error loading deals data:', error);
    return NextResponse.json({ error: 'Failed to load deals data' }, { status: 500 });
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

    const filePath = path.join(process.cwd(), 'public', 'data', 'deal.json');
    
    let existingData: any = {};
    
    // Загружаем существующие данные, если файл есть
    if (fs.existsSync(filePath)) {
      const existingFileData = fs.readFileSync(filePath, 'utf8');
      existingData = JSON.parse(existingFileData);
    }

    // Объединяем данные для структуры deals (которая имеет вложенный формат)
    let combinedData: any = { ...existingData };

    if (newData && typeof newData === 'object') {
      // Проверяем, есть ли раздел "Реестр сделок"
      if (newData['Реестр сделок'] && newData['Реестр сделок'].rows) {
        const newDealsRows = newData['Реестр сделок'].rows;
        
        // Если существующие данные уже содержат раздел "Реестр сделок"
        if (existingData['Реестр сделок'] && existingData['Реестр сделок'].rows) {
          const existingRows = existingData['Реестр сделок'].rows;
          const headers = existingRows[0]; // Первая строка - заголовки
          const existingDataRows = existingRows.slice(1);
          const newDataRows = newDealsRows.slice(1);
          
          // Объединяем строки, избегая дублирования по названию сделки
          const combinedRows = [headers]; // Добавляем заголовки
          const seenDeals = new Set();
          
          // Добавляем существующие записи
          existingDataRows.forEach((row: any, index: number) => {
            const dealName = row[headers.indexOf('Наименование сделки')];
            if (dealName && !seenDeals.has(dealName)) {
              combinedRows.push(row);
              seenDeals.add(dealName);
            }
          });
          
          // Добавляем новые записи, пропуская дубликаты
          newDataRows.forEach((row: any, index: number) => {
            const dealName = row[headers.indexOf('Наименование сделки')];
            if (dealName) {
              if (seenDeals.has(dealName)) {
                // Обновляем существующую запись
                const existingRowIndex = combinedRows.findIndex((r: any) => 
                  r[headers.indexOf('Наименование сделки')] === dealName
                );
                if (existingRowIndex !== -1) {
                  // Обновляем данными из нового файла
                  combinedRows[existingRowIndex] = row;
                }
              } else {
                // Добавляем новую запись
                combinedRows.push(row);
                seenDeals.add(dealName);
              }
            }
          });
          
          combinedData['Реестр сделок'] = {
            ...existingData['Реестр сделок'],
            rows: combinedRows
          };
        } else {
          // Если существующих данных нет, просто используем новые
          combinedData['Реестр сделок'] = newData['Реестр сделок'];
        }
      }
      
      // Объединяем другие разделы файла
      Object.keys(newData).forEach(key => {
        if (key !== 'Реестр сделок') {
          combinedData[key] = newData[key];
        }
      });
    }

    // Сохраняем объединенные данные
    fs.writeFileSync(filePath, JSON.stringify(combinedData, null, 2));

    const totalRecords = combinedData['Реестр сделок']?.rows ? 
      combinedData['Реестр сделок'].rows.length - 1 : 0; // -1 для заголовков
    const existingRecords = existingData['Реестр сделок']?.rows ? 
      existingData['Реестр сделок'].rows.length - 1 : 0;

    return NextResponse.json({ 
      message: 'Deals file updated successfully',
      totalRecords: totalRecords,
      addedRecords: Math.max(0, totalRecords - existingRecords)
    });
  } catch (error) {
    console.error('Error updating deals data:', error);
    return NextResponse.json({ error: 'Failed to update deals data' }, { status: 500 });
  }
}
