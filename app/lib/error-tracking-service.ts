

// Сервис для отслеживания ошибочных позиций товаров
interface ErrorItem {
  rowNumber: number;
  originalRequest: string;
  errorReason: string;
  timestamp: number;
}

class ErrorTrackingService {
  private static instance: ErrorTrackingService;
  private errorItems: ErrorItem[] = [];
  private lastProcessedErrors: ErrorItem[] = []; // Бэкап для отладки

  static getInstance(): ErrorTrackingService {
    if (!ErrorTrackingService.instance) {
      ErrorTrackingService.instance = new ErrorTrackingService();
    }
    return ErrorTrackingService.instance;
  }

  // Добавить ошибочную позицию
  addErrorItem(rowNumber: number, originalRequest: string, errorReason: string) {
    const errorItem: ErrorItem = {
      rowNumber,
      originalRequest,
      errorReason,
      timestamp: Date.now()
    };
    
    // Проверяем, нет ли уже такой строки
    const existingIndex = this.errorItems.findIndex(item => item.rowNumber === rowNumber);
    if (existingIndex >= 0) {
      this.errorItems[existingIndex] = errorItem; // Обновляем
    } else {
      this.errorItems.push(errorItem); // Добавляем новую
    }
    
    console.log('[ErrorTracking] Added error item:', errorItem);
  }

  // Получить все ошибочные позиции
  getErrorItems(): ErrorItem[] {
    return this.errorItems.slice(); // Возвращаем копию
  }

  // Удалить ошибочную позицию (когда она успешно обработана)
  removeErrorItem(rowNumber: number) {
    const initialLength = this.errorItems.length;
    this.errorItems = this.errorItems.filter(item => item.rowNumber !== rowNumber);
    console.log(`[ErrorTracking] Removed error item for row ${rowNumber}, items count: ${initialLength} -> ${this.errorItems.length}`);
  }

  // Удалить несколько ошибочных позиций
  removeErrorItems(rowNumbers: number[]) {
    const initialLength = this.errorItems.length;
    this.errorItems = this.errorItems.filter(item => !rowNumbers.includes(item.rowNumber));
    console.log(`[ErrorTracking] Removed error items for rows [${rowNumbers.join(', ')}], items count: ${initialLength} -> ${this.errorItems.length}`);
  }

  // Очистить все ошибочные позиции
  clearErrorItems() {
    const count = this.errorItems.length;
    // Сохраняем бэкап перед очисткой
    this.lastProcessedErrors = [...this.errorItems];
    this.errorItems = [];
    console.log(`[ErrorTracking] Cleared all ${count} error items (saved to backup)`);
  }

  // Получить последние обработанные ошибки (для отладки)
  getLastProcessedErrors(): ErrorItem[] {
    return this.lastProcessedErrors.slice();
  }

  // Восстановить ошибки из бэкапа (если что-то пошло не так)
  restoreFromBackup() {
    const backupCount = this.lastProcessedErrors.length;
    this.errorItems = [...this.lastProcessedErrors];
    console.log(`[ErrorTracking] Restored ${backupCount} error items from backup`);
    return backupCount;
  }

  // Получить количество ошибочных позиций
  getErrorCount(): number {
    return this.errorItems.length;
  }

  // Получить только номера строк ошибочных позиций
  getErrorRowNumbers(): number[] {
    return this.errorItems.map(item => item.rowNumber);
  }

  // Получить только оригинальные запросы ошибочных позиций
  getErrorRequests(): string[] {
    return this.errorItems.map(item => item.originalRequest);
  }
}

export { ErrorTrackingService };
export type { ErrorItem };
