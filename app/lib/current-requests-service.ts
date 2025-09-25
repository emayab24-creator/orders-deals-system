
import fs from 'fs';
import path from 'path';

// Персистентное хранилище для текущих запросов
class CurrentRequestsService {
  private static instance: CurrentRequestsService;
  private currentRequestRows: number[] = [];
  private readonly persistentFilePath: string;

  constructor() {
    this.persistentFilePath = path.join(process.cwd(), 'current-requests-state.json');
    this.loadFromFile();
  }

  static getInstance(): CurrentRequestsService {
    if (!CurrentRequestsService.instance) {
      CurrentRequestsService.instance = new CurrentRequestsService();
    }
    return CurrentRequestsService.instance;
  }

  private loadFromFile() {
    try {
      if (fs.existsSync(this.persistentFilePath)) {
        const data = JSON.parse(fs.readFileSync(this.persistentFilePath, 'utf8'));
        this.currentRequestRows = data.currentRequestRows || [];
        console.log('[CurrentRequests] Loaded from file:', this.currentRequestRows);
      }
    } catch (error) {
      console.error('[CurrentRequests] Error loading from file:', error);
      this.currentRequestRows = [];
    }
  }

  private saveToFile() {
    try {
      const data = {
        currentRequestRows: this.currentRequestRows,
        lastUpdated: new Date().toISOString()
      };
      fs.writeFileSync(this.persistentFilePath, JSON.stringify(data, null, 2));
      console.log('[CurrentRequests] Saved to file:', this.currentRequestRows);
    } catch (error) {
      console.error('[CurrentRequests] Error saving to file:', error);
    }
  }

  setCurrentRequestRows(rows: number[]) {
    this.currentRequestRows = rows;
    this.saveToFile();
    console.log('[CurrentRequests] Set current request rows:', rows);
  }

  getCurrentRequestRows(): number[] {
    // Перезагружаем из файла для получения свежих данных
    this.loadFromFile();
    return this.currentRequestRows;
  }

  addCurrentRequestRows(newRows: number[]) {
    // Добавляем новые строки к существующим
    const allRows = [...new Set([...this.currentRequestRows, ...newRows])];
    this.setCurrentRequestRows(allRows);
    console.log('[CurrentRequests] Added new rows:', newRows, 'Total rows:', allRows);
  }

  clearCurrentRequestRows() {
    this.currentRequestRows = [];
    this.saveToFile();
    console.log('[CurrentRequests] Cleared current request rows');
  }

  // Метод для получения последних N запросов из Google Sheets
  // если текущие строки пусты
  async getRecentRequestRows(sheetsService: any, count: number = 20): Promise<number[]> {
    if (this.currentRequestRows.length > 0) {
      return this.currentRequestRows;
    }

    try {
      // Получаем все данные из Google Sheets
      const allData = await sheetsService.getProcessedData();
      
      if (allData.length === 0) {
        return [];
      }

      // Возвращаем последние count строк (предполагаем что это самые новые запросы)
      const recentRows = allData
        .slice(-count)  // Последние count записей
        .map((_: any, index: number) => allData.length - count + index + 2)  // +2 потому что строки начинаются с 2 (после заголовка)
        .filter((rowNum: number) => rowNum > 1);  // Убеждаемся что не включаем заголовок

      console.log('[CurrentRequests] No current rows found, using recent rows:', recentRows);
      return recentRows;
    } catch (error) {
      console.error('[CurrentRequests] Error getting recent rows:', error);
      return [];
    }
  }
}

export { CurrentRequestsService };
