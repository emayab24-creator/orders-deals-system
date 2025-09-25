
import { google } from 'googleapis';

export class GoogleSheetsService {
  private sheets: any;
  private spreadsheetId: string;

  constructor() {
    // Получаем переменные окружения
    const serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    this.spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID || '';

    console.log('[GoogleSheetsService] Constructor - checking credentials...');
    console.log('- serviceAccountEmail exists:', !!serviceAccountEmail);
    console.log('- privateKey exists:', !!privateKey);
    console.log('- privateKey length:', privateKey?.length || 0);
    console.log('- spreadsheetId exists:', !!this.spreadsheetId);
    console.log('- spreadsheetId:', this.spreadsheetId);

    if (!serviceAccountEmail || !privateKey || !this.spreadsheetId) {
      console.error('[GoogleSheetsService] Missing credentials:', {
        serviceAccountEmail: !!serviceAccountEmail,
        privateKey: !!privateKey,
        spreadsheetId: !!this.spreadsheetId
      });
      throw new Error(`Missing Google Sheets credentials: email=${!!serviceAccountEmail}, key=${!!privateKey}, id=${!!this.spreadsheetId}`);
    }

    // Настройка аутентификации
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: serviceAccountEmail,
        private_key: privateKey,
      },
      scopes: [
        'https://www.googleapis.com/auth/spreadsheets',
        'https://www.googleapis.com/auth/drive.readonly',
      ],
    });

    this.sheets = google.sheets({ version: 'v4', auth });
  }

  /**
   * Находит последнюю используемую строку в таблице
   */
  private async findLastUsedRow(): Promise<number> {
    try {
      console.log('[GoogleSheetsService] Finding last used row...');
      
      // Получаем данные из всех колонок A:AE для определения последней строки
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:AE',
      });

      const values = response.data.values || [];
      
      // Ищем последнюю строку с данными
      let lastRow = 1; // Минимум строка заголовка
      for (let i = 0; i < values.length; i++) {
        const row = values[i];
        // Проверяем есть ли данные в строке
        if (row && row.some((cell: any) => cell && cell.toString().trim() !== '')) {
          lastRow = i + 1; // +1 потому что индексы начинаются с 0
        }
      }
      
      console.log(`[GoogleSheetsService] Last used row found: ${lastRow}`);
      return lastRow;
    } catch (error) {
      console.error('[GoogleSheetsService] Error finding last used row:', error);
      return 1; // Возвращаем 1 (строка заголовка) в случае ошибки
    }
  }

  /**
   * Добавляет новый запрос в Google Sheets
   */
  async addRequest(productName: string): Promise<boolean> {
    try {
      console.log('[GoogleSheetsService] Adding request to Google Sheets:', productName);
      
      // Находим последнюю заполненную строку в таблице
      const lastRow = await this.findLastUsedRow();
      const nextRow = lastRow + 1;
      
      console.log(`[GoogleSheetsService] Last used row: ${lastRow}, adding to row: ${nextRow}`);
      
      // Добавляем запрос в колонку B
      const range = `B${nextRow}`;
      const values = [[productName]];

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });

      console.log('[GoogleSheetsService] Successfully added request to Google Sheets at row', nextRow);
      return response.status === 200;
    } catch (error) {
      console.error('[GoogleSheetsService] Error adding request to Google Sheets:', error);
      return false;
    }
  }

  /**
   * Добавляет несколько запросов в Google Sheets одновременно
   */
  async addMultipleRequests(productNames: string[]): Promise<{success: boolean, addedRows: number[]}> {
    try {
      console.log('[GoogleSheetsService] Adding multiple requests to Google Sheets:', productNames.length);
      
      // Находим последнюю заполненную строку в таблице
      const lastRow = await this.findLastUsedRow();
      const startRow = lastRow + 1;
      const endRow = startRow + productNames.length - 1;
      
      console.log(`[GoogleSheetsService] Adding ${productNames.length} requests starting from row ${startRow}`);
      
      // Формируем данные для записи
      const values = productNames.map(name => [name]);
      const range = `B${startRow}:B${endRow}`;

      const response = await this.sheets.spreadsheets.values.update({
        spreadsheetId: this.spreadsheetId,
        range: range,
        valueInputOption: 'USER_ENTERED',
        resource: { values },
      });

      const addedRows = Array.from({ length: productNames.length }, (_, i) => startRow + i);
      console.log('[GoogleSheetsService] Successfully added multiple requests to rows:', addedRows);
      
      return {
        success: response.status === 200,
        addedRows: addedRows
      };
    } catch (error) {
      console.error('[GoogleSheetsService] Error adding multiple requests to Google Sheets:', error);
      return {
        success: false,
        addedRows: []
      };
    }
  }

  /**
   * Получает все запросы из колонки B
   */
  async getRequestsFromSheets(): Promise<string[]> {
    try {
      console.log('[GoogleSheetsService] Getting requests from Google Sheets...');
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'B:B', // Колонка запросов
      });

      const values = response.data.values || [];
      // Пропускаем заголовок (первая строка)
      const requests = values.slice(1).map((row: any[]) => row[0] || '').filter(Boolean);
      
      console.log(`[GoogleSheetsService] Retrieved ${requests.length} requests from Google Sheets`);
      return requests;
    } catch (error) {
      console.error('[GoogleSheetsService] Error getting requests from Google Sheets:', error);
      return [];
    }
  }

  /**
   * Получает все обработанные данные из Google Sheets
   */
  async getProcessedData(): Promise<any[]> {
    try {
      console.log('[GoogleSheetsService] Getting processed data from Google Sheets...');
      console.log('[GoogleSheetsService] Using spreadsheet ID:', this.spreadsheetId);
      
      const response = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A:AE', // Все колонки A-AE
      });

      const values = response.data.values || [];
      
      if (values.length === 0) {
        console.log('[GoogleSheetsService] No data found in Google Sheets');
        return [];
      }

      // Первая строка - заголовки
      const headers = values[0];
      const dataRows = values.slice(1);

      // Конвертируем в объекты
      const processedData = dataRows
        .filter((row: any[]) => row.length > 0 && row.some((cell: any) => cell && cell.toString().trim() !== ''))
        .map((row: any[], index: number) => {
          const rowData: any = {};
          
          // Используем буквенные индексы для колонок A-AE
          const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE'];
          
          columnLabels.forEach((label, idx) => {
            rowData[label] = row[idx] || '';
          });

          return rowData;
        });

      console.log(`[GoogleSheetsService] Retrieved ${processedData.length} processed records from Google Sheets`);
      return processedData;
    } catch (error: any) {
      console.error('[GoogleSheetsService] Error getting processed data from Google Sheets:', error);
      console.error('[GoogleSheetsService] Error details:', error.message);
      if (error.response) {
        console.error('[GoogleSheetsService] Error response data:', error.response.data);
        console.error('[GoogleSheetsService] Error response status:', error.response.status);
      }
      throw error; // Пробросим ошибку для лучшей диагностики
    }
  }

  /**
   * Получает обработанные данные только для определенных строк
   */
  async getProcessedDataByRows(rows: number[]): Promise<any[]> {
    try {
      console.log('[GoogleSheetsService] Getting processed data for specific rows:', rows);
      
      if (rows.length === 0) {
        return [];
      }

      const results: any[] = [];

      // Получаем заголовки
      const headersResponse = await this.sheets.spreadsheets.values.get({
        spreadsheetId: this.spreadsheetId,
        range: 'A1:AE1',
      });
      
      const headers = headersResponse.data.values?.[0] || [];
      
      // Получаем данные для каждой строки
      for (const row of rows) {
        try {
          const response = await this.sheets.spreadsheets.values.get({
            spreadsheetId: this.spreadsheetId,
            range: `A${row}:AE${row}`,
          });

          const rowData = response.data.values?.[0];
          if (rowData && rowData.some((cell: any) => cell && cell.toString().trim() !== '')) {
            const processedRow: any = {};
            
            // Используем буквенные индексы для колонок A-AE
            const columnLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', 'AA', 'AB', 'AC', 'AD', 'AE'];
            
            columnLabels.forEach((label, idx) => {
              processedRow[label] = rowData[idx] || '';
            });

            // Добавляем номер строки для отслеживания
            processedRow._rowNumber = row;
            results.push(processedRow);
          }
        } catch (error) {
          console.error(`[GoogleSheetsService] Error getting data for row ${row}:`, error);
        }
      }

      console.log(`[GoogleSheetsService] Retrieved ${results.length} processed records for specified rows`);
      return results;
    } catch (error) {
      console.error('[GoogleSheetsService] Error getting processed data by rows:', error);
      return [];
    }
  }

  /**
   * Очищает все запросы из Google Sheets (только колонка B, начиная со 2-й строки)
   */
  async clearRequests(): Promise<boolean> {
    try {
      console.log('[GoogleSheetsService] Clearing requests from Google Sheets...');
      
      // Сначала получаем количество строк с данными
      const requests = await this.getRequestsFromSheets();
      
      if (requests.length === 0) {
        console.log('[GoogleSheetsService] No requests to clear');
        return true;
      }

      // Очищаем колонку B, начиная со 2-й строки
      const range = `B2:B${requests.length + 1}`;
      
      await this.sheets.spreadsheets.values.clear({
        spreadsheetId: this.spreadsheetId,
        range: range,
      });

      console.log('[GoogleSheetsService] Successfully cleared requests from Google Sheets');
      return true;
    } catch (error) {
      console.error('[GoogleSheetsService] Error clearing requests from Google Sheets:', error);
      return false;
    }
  }

  /**
   * Очищает запросы в конкретных строках (только колонка B)
   */
  async clearRequestsByRows(rows: number[]): Promise<boolean> {
    try {
      console.log('[GoogleSheetsService] Clearing requests in specific rows:', rows);
      
      if (rows.length === 0) {
        console.log('[GoogleSheetsService] No rows to clear');
        return true;
      }

      // Очищаем каждую строку отдельно
      for (const row of rows) {
        try {
          const range = `B${row}`;
          await this.sheets.spreadsheets.values.clear({
            spreadsheetId: this.spreadsheetId,
            range: range,
          });
        } catch (error) {
          console.error(`[GoogleSheetsService] Error clearing row ${row}:`, error);
        }
      }

      console.log('[GoogleSheetsService] Successfully cleared requests from specified rows');
      return true;
    } catch (error) {
      console.error('[GoogleSheetsService] Error clearing requests by rows:', error);
      return false;
    }
  }

  /**
   * Полностью удаляет строки из Google Sheets
   */
  async deleteRowsByNumbers(rows: number[]): Promise<boolean> {
    try {
      console.log('[GoogleSheetsService] Deleting rows from Google Sheets:', rows);
      
      if (rows.length === 0) {
        console.log('[GoogleSheetsService] No rows to delete');
        return true;
      }

      // Сортируем строки в убывающем порядке, чтобы удалить снизу вверх
      // Это важно, чтобы индексы не сбивались при удалении
      const sortedRows = [...rows].sort((a, b) => b - a);
      console.log('[GoogleSheetsService] Sorted rows for deletion (descending):', sortedRows);

      // Создаем запросы на удаление для batch операции
      const deleteRequests = sortedRows.map(row => ({
        deleteDimension: {
          range: {
            sheetId: 0, // Предполагаем что работаем с первым листом
            dimension: 'ROWS',
            startIndex: row - 1, // API использует 0-based индексы
            endIndex: row // endIndex не включается в диапазон
          }
        }
      }));

      // Выполняем batch удаление
      const batchUpdateRequest = {
        spreadsheetId: this.spreadsheetId,
        resource: {
          requests: deleteRequests
        }
      };

      console.log('[GoogleSheetsService] Executing batch delete request...');
      await this.sheets.spreadsheets.batchUpdate(batchUpdateRequest);

      console.log(`[GoogleSheetsService] Successfully deleted ${rows.length} rows from Google Sheets`);
      return true;
    } catch (error) {
      console.error('[GoogleSheetsService] Error deleting rows:', error);
      if (error instanceof Error) {
        console.error('[GoogleSheetsService] Error message:', error.message);
      }
      return false;
    }
  }
}
