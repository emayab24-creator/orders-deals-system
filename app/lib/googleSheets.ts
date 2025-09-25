
import { google } from 'googleapis';

// Инициализация Google Sheets API
export function getGoogleSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      project_id: 'orders-deals-system',
      type: 'service_account'
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

export interface SheetRow {
  rowNumber: number;
  request: string;
  name: string;
  brand: string;
  article: string;
  quantity: string;
  price: string;
  total: string;
  weight: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

// Добавить новый запрос в таблицу
export async function addRequestToSheet(request: string): Promise<{ rowNumber: number; success: boolean }> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID не найден в переменных окружения');
    }

    // Получаем последнюю строку для определения номера новой строки
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A:A',
    });

    const lastRowNumber = response.data.values?.length || 1;
    const newRowNumber = lastRowNumber + 1;

    // Добавляем новую строку с запросом
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: 'A:I',
      valueInputOption: 'RAW',
      requestBody: {
        values: [
          [
            newRowNumber - 1, // Номер строки (начинаем с 0 после заголовка)
            request,          // Запрос
            '',               // Наименование (заполнится Gemini)
            '',               // Бренд (заполнится Gemini)
            '',               // Артикул (заполнится Gemini)
            '',               // Количество (заполнится Gemini)
            '',               // Цена (заполнится Gemini)
            '',               // Итого (заполнится Gemini)
            ''                // Вес (заполнится Gemini)
          ]
        ]
      }
    });

    return { rowNumber: newRowNumber, success: true };
  } catch (error) {
    console.error('Ошибка при добавлении запроса в таблицу:', error);
    return { rowNumber: -1, success: false };
  }
}

// Получить все строки из таблицы
export async function getAllRowsFromSheet(): Promise<SheetRow[]> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID не найден в переменных окружения');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: 'A2:I', // Начинаем с 2-й строки, пропуская заголовки
    });

    const rows = response.data.values || [];
    
    return rows.map((row, index): SheetRow => {
      const hasData = row[2] && row[2].trim() !== ''; // Проверяем наличие данных в колонке "Наименование"
      
      return {
        rowNumber: index + 2, // +2 потому что начинаем с строки 2
        request: row[1] || '',
        name: row[2] || '',
        brand: row[3] || '',
        article: row[4] || '',
        quantity: row[5] || '',
        price: row[6] || '',
        total: row[7] || '',
        weight: row[8] || '',
        status: hasData ? 'completed' : (row[1] ? 'pending' : 'error')
      };
    });
  } catch (error) {
    console.error('Ошибка при получении данных из таблицы:', error);
    return [];
  }
}

// Получить конкретную строку по номеру
export async function getRowFromSheet(rowNumber: number): Promise<SheetRow | null> {
  try {
    const sheets = getGoogleSheetsClient();
    const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

    if (!spreadsheetId) {
      throw new Error('GOOGLE_SHEETS_SPREADSHEET_ID не найден в переменных окружения');
    }

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `A${rowNumber}:I${rowNumber}`,
    });

    const row = response.data.values?.[0];
    if (!row) return null;

    const hasData = row[2] && row[2].trim() !== '';
    
    return {
      rowNumber,
      request: row[1] || '',
      name: row[2] || '',
      brand: row[3] || '',
      article: row[4] || '',
      quantity: row[5] || '',
      price: row[6] || '',
      total: row[7] || '',
      weight: row[8] || '',
      status: hasData ? 'completed' : (row[1] ? 'pending' : 'error')
    };
  } catch (error) {
    console.error(`Ошибка при получении строки ${rowNumber}:`, error);
    return null;
  }
}

// Проверить статус обработки строк (для polling)
export async function checkProcessingStatus(): Promise<{ 
  pending: number; 
  processing: number; 
  completed: number; 
  total: number;
  latestRows: SheetRow[];
}> {
  const allRows = await getAllRowsFromSheet();
  
  const pending = allRows.filter(row => row.status === 'pending').length;
  const processing = allRows.filter(row => row.status === 'processing').length;
  const completed = allRows.filter(row => row.status === 'completed').length;
  
  // Берем последние 10 строк для отображения
  const latestRows = allRows.slice(-10).reverse();
  
  return {
    pending,
    processing,
    completed,
    total: allRows.length,
    latestRows
  };
}
