
'use client';

import { OrderData, DealData, CombinedData, FilterOptions, MetricsData } from './types';
import { BrandService } from './brand-service';

export class DataProcessor {
  private ordersData: OrderData[] = [];
  private dealsData: DealData[] = [];
  private brandService: BrandService;
  
  constructor() {
    this.brandService = BrandService.getInstance();
  }
  
  async loadData() {
    try {
      const [ordersResponse, dealsResponse] = await Promise.all([
        fetch('/api/orders'),
        fetch('/api/deals')
      ]);
      
      this.ordersData = await ordersResponse.json();
      const dealsFile = await dealsResponse.json();
      
      // Извлекаем данные из раздела "Реестр сделок"
      if (dealsFile?.['Реестр сделок']?.rows) {
        const rows = dealsFile['Реестр сделок'].rows;
        const headers = rows[0]; // Первая строка - заголовки
        
        this.dealsData = rows.slice(1).map((row: any[]) => {
          const deal: any = {};
          headers.forEach((header: string, index: number) => {
            deal[header] = row[index];
          });
          return deal as DealData;
        }).filter((deal: DealData) => deal?.['Наименование сделки']); // Фильтруем пустые записи
      }
      
      // Загружаем данные о брендах
      try {
        console.log('[DataProcessor] Loading brand data...');
        await this.brandService.loadBrandData();
        const brandStats = this.brandService.getStats();
        console.log('[DataProcessor] Brand data loaded:', brandStats);
      } catch (brandError) {
        console.warn('[DataProcessor] Failed to load brand data, continuing without brands:', brandError);
      }
      
      return true;
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
      return false;
    }
  }
  
  searchByArticle(article: string): CombinedData[] {
    const searchTerms = article.split(',').map(term => term.trim().toLowerCase()).filter(term => term);
    
    if (searchTerms.length === 0) return [];
    
    const matchingOrders = this.ordersData.filter(order => {
      const articleName = order?.['Article/Name'];
      if (!articleName) return false;
      
      const normalizedArticleName = articleName.trim().toLowerCase();
      
      // Проверяем, соответствует ли артикул любому из поисковых терминов
      return searchTerms.some(searchTerm => {
        // Сначала проверяем точное совпадение
        if (normalizedArticleName === searchTerm) {
          return true;
        }
        
        // Затем проверяем, содержится ли поисковый запрос в названии артикула
        return normalizedArticleName.includes(searchTerm);
      });
    });
    
    return matchingOrders.map(order => this.combineOrderWithDeal(order));
  }

  searchByDeal(dealName: string): CombinedData[] {
    const searchTerms = dealName.split(',').map(term => term.trim().toLowerCase()).filter(term => term);
    
    if (searchTerms.length === 0) return [];
    
    const matchingOrders = this.ordersData.filter(order => {
      const orderName = order?.['Order Name'];
      if (!orderName) return false;
      
      const normalizedOrderName = orderName.trim().toLowerCase();
      
      // Проверяем, соответствует ли название сделки любому из поисковых терминов
      return searchTerms.some(searchTerm => {
        // Проверяем точное и частичное совпадение
        return normalizedOrderName === searchTerm || 
               normalizedOrderName.includes(searchTerm);
      });
    });
    
    return matchingOrders.map(order => this.combineOrderWithDeal(order));
  }

  searchByContractor(contractor: string): CombinedData[] {
    const searchTerms = contractor.split(',').map(term => term.trim().toLowerCase()).filter(term => term);
    
    if (searchTerms.length === 0) return [];
    
    const matchingDeals = this.dealsData.filter(deal => {
      const contractorName = deal?.['Контрагент'];
      if (!contractorName) return false;
      
      const normalizedContractorName = contractorName.trim().toLowerCase();
      
      // Проверяем, соответствует ли контрагент любому из поисковых терминов
      return searchTerms.some(searchTerm => 
        normalizedContractorName.includes(searchTerm)
      );
    });
    
    const matchingDealNames = matchingDeals.map(deal => deal['Наименование сделки']);
    
    const matchingOrders = this.ordersData.filter(order => 
      matchingDealNames.includes(order?.['Order Name'])
    );
    
    return matchingOrders.map(order => this.combineOrderWithDeal(order));
  }

  getAllData(): CombinedData[] {
    return this.ordersData.map(order => this.combineOrderWithDeal(order));
  }

  /**
   * Поиск всех товаров по конкретному бренду
   */
  searchByBrand(brandName: string): CombinedData[] {
    console.log(`[DataProcessor] Searching for brand: ${brandName}`);
    console.log(`[DataProcessor] Orders data length: ${this.ordersData.length}`);
    
    if (!this.brandService.isReady()) {
      console.warn('[DataProcessor] Brand service not ready yet');
      return [];
    }

    console.log(`[DataProcessor] Brand service is ready, proceeding with search`);

    // Получаем все данные с определенными брендами
    const allData = this.ordersData.map(order => this.combineOrderWithDeal(order));
    console.log(`[DataProcessor] Combined data length: ${allData.length}`);
    
    // Проверим сколько товаров имеют определенный бренд
    const withBrands = allData.filter(item => item.detectedBrand);
    console.log(`[DataProcessor] Items with detected brand: ${withBrands.length}`);
    
    if (withBrands.length > 0) {
      console.log(`[DataProcessor] Sample brands found:`, withBrands.slice(0, 5).map(item => ({
        article: item['Article/Name']?.substring(0, 20) + '...',
        brand: item.detectedBrand
      })));
    }
    
    // Фильтруем по конкретному бренду
    const filteredData = allData.filter(item => {
      return item.detectedBrand && item.detectedBrand.toLowerCase() === brandName.toLowerCase();
    });

    console.log(`[DataProcessor] Found ${filteredData.length} items for brand ${brandName}`);
    
    if (filteredData.length > 0) {
      console.log(`[DataProcessor] Sample results:`, filteredData.slice(0, 3).map(item => ({
        article: item['Article/Name'],
        brand: item.detectedBrand
      })));
    }
    
    return filteredData;
  }

  /**
   * Получает статистику по брендам
   */
  getBrandStats(): { [brand: string]: number } {
    if (!this.brandService.isReady()) {
      return {};
    }

    const allData = this.ordersData.map(order => this.combineOrderWithDeal(order));
    const brandStats: { [brand: string]: number } = {};

    allData.forEach(item => {
      if (item.detectedBrand) {
        brandStats[item.detectedBrand] = (brandStats[item.detectedBrand] || 0) + 1;
      }
    });

    return brandStats;
  }

  /**
   * Получает все уникальные бренды из поля "Бренд" для фильтра
   */
  getAvailableDealBrands(): string[] {
    const brandsSet = new Set<string>();
    
    this.ordersData.forEach(order => {
      if (order?.['Бренд'] && order['Бренд'].trim() !== '') {
        brandsSet.add(order['Бренд'].trim());
      }
    });

    return Array.from(brandsSet).sort();
  }

  /**
   * Поиск товаров по выбранным брендам из фильтра
   */
  searchByDealBrands(brands: string[]): CombinedData[] {
    if (!brands || brands.length === 0) {
      return this.getAllData();
    }

    const brandsLower = brands.map(brand => brand.toLowerCase());
    
    return this.ordersData
      .filter(order => {
        if (!order?.['Бренд']) return false;
        return brandsLower.includes(order['Бренд'].toLowerCase());
      })
      .map(order => this.combineOrderWithDeal(order));
  }
  
  private combineOrderWithDeal(order: OrderData): CombinedData {
    const matchingDeal = this.dealsData.find(deal => 
      deal?.['Наименование сделки'] === order?.['Order Name']
    );
    
    // Определяем бренд на основе артикула
    let detectedBrand: string | null = null;
    if (order?.['Article/Name'] && this.brandService.isReady()) {
      detectedBrand = this.brandService.getBrandByArticle(order['Article/Name']);
    }
    
    const combined: CombinedData = {
      ...order,
      dealData: matchingDeal,
      dealStatus: matchingDeal?.['Статус'],
      dealCreationDate: matchingDeal?.['Дата создания сделки'],
      dealFirstPaymentDate: matchingDeal?.['Даты первой оплаты сделки'],
      contractor: matchingDeal?.['Контрагент'],
      entranceYuan: matchingDeal?.['ВХОД. ю'],
      entranceDollar: matchingDeal?.['ВХОД. $'],
      salesManager: matchingDeal?.['Менеджер по продажам'],
      supplier: matchingDeal?.['Снабженец'],
      // Добавляем определенный бренд из Excel файла
      detectedBrand: detectedBrand || undefined,
      // Добавляем бренд из поля "Бренд" в заказе для третьей колонки
      dealBrand: order?.['Бренд'] || undefined
    };
    
    return combined;
  }
  
  getMetrics(article?: string): MetricsData {
    let dataToAnalyze = this.ordersData;
    
    if (article) {
      const searchTerms = article.split(',').map(term => term.trim().toLowerCase()).filter(term => term);
      
      if (searchTerms.length > 0) {
        dataToAnalyze = this.ordersData.filter(order => {
          const articleName = order?.['Article/Name'];
          if (!articleName) return false;
          
          const normalizedArticleName = articleName.trim().toLowerCase();
          
          return searchTerms.some(searchTerm => {
            return normalizedArticleName === searchTerm || normalizedArticleName.includes(searchTerm);
          });
        });
      }
    }
    
    if (dataToAnalyze.length === 0) {
      return {
        totalOrders: 0,
        totalValue: 0,
        totalQuantity: 0,
        uniqueArticles: 0
      };
    }
    
    const totalOrders = dataToAnalyze.length;
    const totalValue = dataToAnalyze.reduce((sum, order) => 
      sum + (order?.['Price per unit'] * order?.['Quantity'] || 0), 0);
    const totalQuantity = dataToAnalyze.reduce((sum, order) => 
      sum + (order?.['Quantity'] || 0), 0);
    const uniqueArticles = new Set(dataToAnalyze.map(order => 
      order?.['Article/Name'])).size;
    
    return {
      totalOrders,
      totalValue: Math.round(totalValue),
      totalQuantity: Math.round(totalQuantity),
      uniqueArticles
    };
  }
  
  getRateRanges(article: string): { 
    yuanMin: number; 
    yuanMax: number; 
    dollarMin: number; 
    dollarMax: number; 
  } {
    const searchTerms = article.split(',').map(term => term.trim().toLowerCase()).filter(term => term);
    
    if (searchTerms.length === 0) {
      return { yuanMin: 0, yuanMax: 0, dollarMin: 0, dollarMax: 0 };
    }
    
    const matchingOrders = this.ordersData.filter(order => {
      const articleName = order?.['Article/Name'];
      if (!articleName) return false;
      
      const normalizedArticleName = articleName.trim().toLowerCase();
      
      return searchTerms.some(searchTerm => {
        return normalizedArticleName === searchTerm || normalizedArticleName.includes(searchTerm);
      });
    });
    
    if (matchingOrders.length === 0) {
      return { yuanMin: 0, yuanMax: 0, dollarMin: 0, dollarMax: 0 };
    }
    
    const yuanRates = matchingOrders.map(order => order?.['Yuan Rate'] || 0);
    const dollarRates = matchingOrders.map(order => order?.['Dollar Rate'] || 0);
    
    return {
      yuanMin: Math.min(...yuanRates),
      yuanMax: Math.max(...yuanRates),
      dollarMin: Math.min(...dollarRates),
      dollarMax: Math.max(...dollarRates)
    };
  }
  
  getFilteredData(filters: FilterOptions): CombinedData[] {
    let filtered = this.ordersData.map(order => this.combineOrderWithDeal(order));
    
    if (filters.startDate) {
      filtered = filtered.filter(item => {
        if (!item.dealCreationDate) return false;
        const creationDate = new Date(item.dealCreationDate);
        return creationDate >= new Date(filters.startDate!);
      });
    }
    
    if (filters.endDate) {
      filtered = filtered.filter(item => {
        if (!item.dealCreationDate) return false;
        const creationDate = new Date(item.dealCreationDate);
        return creationDate <= new Date(filters.endDate!);
      });
    }
    
    if (filters.status) {
      filtered = filtered.filter(item => item.dealStatus === filters.status);
    }
    
    if (filters.contractor) {
      filtered = filtered.filter(item => 
        item.contractor?.toLowerCase().includes(filters.contractor!.toLowerCase()));
    }
    
    if (filters.manager) {
      filtered = filtered.filter(item => 
        item.salesManager?.toLowerCase().includes(filters.manager!.toLowerCase()));
    }
    
    if (filters.supplier) {
      filtered = filtered.filter(item => 
        item.supplier?.toLowerCase().includes(filters.supplier!.toLowerCase()));
    }
    
    return filtered;
  }
  
  getAllStatuses(): string[] {
    const statuses = new Set(this.dealsData.map(deal => deal?.['Статус']).filter(Boolean));
    return Array.from(statuses);
  }
  
  getAllContractors(): string[] {
    const contractors = new Set(this.dealsData.map(deal => deal?.['Контрагент']).filter(Boolean));
    return Array.from(contractors);
  }
  
  getAllManagers(): string[] {
    const managers = new Set(this.dealsData.map(deal => deal?.['Менеджер по продажам']).filter(Boolean));
    return Array.from(managers);
  }
  
  getAllSuppliers(): string[] {
    const suppliers = new Set(this.dealsData.map(deal => deal?.['Снабженец']).filter(Boolean));
    return Array.from(suppliers);
  }
}
