


interface BrandData {
  id: number;
  brand: string;
  code: number;
  article: string;
  quantity: number;
}

interface BrandLookup {
  [key: string]: string; // артикул -> бренд
}

export class BrandService {
  private static instance: BrandService | null = null;
  private brandLookup: BrandLookup = {};
  private isLoaded = false;
  private loadingPromise: Promise<void> | null = null;

  private constructor() {}

  public static getInstance(): BrandService {
    if (!BrandService.instance) {
      BrandService.instance = new BrandService();
    }
    return BrandService.instance;
  }

  /**
   * Загружает данные о брендах из Excel файла
   */
  public async loadBrandData(): Promise<void> {
    // Если уже загружается, ждем завершения
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Если уже загружено, ничего не делаем
    if (this.isLoaded) {
      return;
    }

    this.loadingPromise = this._loadBrandDataInternal();
    await this.loadingPromise;
    this.loadingPromise = null;
  }

  private async _loadBrandDataInternal(): Promise<void> {
    try {
      console.log('[BrandService] Loading brand data from Excel file...');
      
      // Если мы на клиенте - используем API
      if (typeof window !== 'undefined') {
        const response = await fetch('/api/brands/load', {
          method: 'POST',
        });

        if (!response.ok) {
          throw new Error(`Failed to load brand data: ${response.statusText}`);
        }

        const brandData: BrandData[] = await response.json();
        this._processBrandData(brandData);
      } else {
        // На сервере - загружаем напрямую из файла
        const fs = await import('fs');
        const path = await import('path');
        const XLSX = await import('xlsx');
        
        const filePath = path.join(process.cwd(), 'public', 'data', 'festo_smc_brands.xlsx');
        
        if (!fs.existsSync(filePath)) {
          console.error('[BrandService] Brand file not found:', filePath);
          throw new Error('Brand data file not found');
        }

        // Читаем Excel файл через Buffer
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
        
        const brandData: BrandData[] = rawData
          .filter((row, index) => row && row.length >= 4 && row[1] && row[3])
          .map((row, index) => ({
            id: row[0] || index + 1,
            brand: row[1]?.toString().trim() || '',
            code: parseInt(row[2]) || 0,
            article: row[3]?.toString().trim() || '',
            quantity: parseInt(row[4]) || 1
          }))
          .filter(item => item.brand && item.article);

        this._processBrandData(brandData);
      }

    } catch (error) {
      console.error('[BrandService] Error loading brand data:', error);
      this.brandLookup = {};
      this.isLoaded = false;
      throw error;
    }
  }

  private _processBrandData(brandData: BrandData[]): void {
    console.log(`[BrandService] Processing ${brandData.length} brand records`);

    // Создаем lookup таблицу для быстрого поиска
    this.brandLookup = {};
    brandData.forEach(item => {
      // Нормализуем артикул для поиска (убираем пробелы, приводим к нижнему регистру)
      const normalizedArticle = item.article?.trim().toLowerCase();
      if (normalizedArticle && item.brand) {
        this.brandLookup[normalizedArticle] = item.brand;
      }
    });

    console.log(`[BrandService] Created lookup table with ${Object.keys(this.brandLookup).length} entries`);
    this.isLoaded = true;
  }

  /**
   * Получает бренд по артикулу
   */
  public getBrandByArticle(article: string): string | null {
    if (!this.isLoaded) {
      console.warn('[BrandService] Brand data not loaded yet');
      return null;
    }

    if (!article) {
      return null;
    }

    // Нормализуем артикул для поиска
    const normalizedArticle = article.trim().toLowerCase();
    
    // Прямое совпадение
    if (this.brandLookup[normalizedArticle]) {
      return this.brandLookup[normalizedArticle];
    }

    // Поиск частичного совпадения - если артикул содержится в наименовании
    for (const [lookupArticle, brand] of Object.entries(this.brandLookup)) {
      if (normalizedArticle.includes(lookupArticle) || lookupArticle.includes(normalizedArticle)) {
        return brand;
      }
    }

    return null;
  }

  /**
   * Получает статистику загруженных данных
   */
  public getStats(): { isLoaded: boolean; totalBrands: number; totalArticles: number } {
    const uniqueBrands = new Set(Object.values(this.brandLookup));
    
    return {
      isLoaded: this.isLoaded,
      totalBrands: uniqueBrands.size,
      totalArticles: Object.keys(this.brandLookup).length
    };
  }

  /**
   * Перезагружает данные о брендах
   */
  public async reloadBrandData(): Promise<void> {
    this.isLoaded = false;
    this.loadingPromise = null;
    this.brandLookup = {};
    await this.loadBrandData();
  }

  /**
   * Проверяет готовность сервиса
   */
  public isReady(): boolean {
    return this.isLoaded;
  }
}
