
'use client';

import { useState, useEffect } from 'react';
import SearchBar from '@/components/search-bar';
import AdminSearchBar from '@/components/admin/admin-search-bar';
import UserManagement from '@/components/admin/user-management';
import FileManagement from '@/components/admin/file-management';
import ProductProcessor from '@/components/product-processor';
import MetricsDashboard from '@/components/metrics-dashboard';
import ResultsTable from '@/components/results-table';
import ProductResultsTable from '@/components/product-results-table';
import GoogleSheetsResultsTable from '@/components/google-sheets-results-table';
import FiltersPanel from '@/components/filters-panel';
import LoginForm from '@/components/auth/login-form';
import BrandQuickSearch from '@/components/brand-quick-search';
import BrandFilter from '@/components/brand-filter';
import { DataProcessor } from '@/lib/data-processor';
import { AuthService } from '@/lib/auth';
import { CombinedData, FilterOptions, MetricsData, UserSession } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, AlertCircle, LogOut, Settings, Search, Users, Shield, User, FileText, Table, UserCheck } from 'lucide-react';

export default function HomePage() {
  const [isClient, setIsClient] = useState(false);
  const [session, setSession] = useState<UserSession | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'admin' | 'files' | 'ai-processing' | 'google-sheets-results'>('search');
  const [googleSheetsData, setGoogleSheetsData] = useState<any[]>([]);
  const [googleSheetsLoading, setGoogleSheetsLoading] = useState(false);
  const [dataProcessor, setDataProcessor] = useState<DataProcessor | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<CombinedData[]>([]);
  const [currentSearch, setCurrentSearch] = useState<{ query: string; type: string }>({ query: '', type: '' });
  const [metrics, setMetrics] = useState<MetricsData>({ 
    totalOrders: 0, 
    totalValue: 0, 
    totalQuantity: 0, 
    uniqueArticles: 0 
  });
  const [rateRanges, setRateRanges] = useState<{
    yuanMin: number;
    yuanMax: number;
    dollarMin: number;
    dollarMax: number;
  } | null>(null);
  const [filterOptions, setFilterOptions] = useState({
    statuses: [] as string[],
    contractors: [] as string[],
    managers: [] as string[],
    suppliers: [] as string[]
  });
  const [error, setError] = useState<string | null>(null);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

  // Загрузка данных Google Sheets
  const loadGoogleSheetsData = async () => {
    try {
      setGoogleSheetsLoading(true);
      const response = await fetch('/api/products');
      
      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`HTTP error! status: ${response.status}, response: ${errorData}`);
      }
      
      const data = await response.json();
      
      // Проверяем, не пришла ли ошибка в JSON формате
      if (data.error) {
        throw new Error(data.error);
      }
      
      setGoogleSheetsData(data);
      
    } catch (error: any) {
      console.error('Error loading Google Sheets data:', error);
      // Устанавливаем специальный флаг ошибки для отображения в компоненте
      setGoogleSheetsData([{ _error: error.message }]);
    } finally {
      setGoogleSheetsLoading(false);
    }
  };

  // Проверка сессии при загрузке
  useEffect(() => {
    setIsClient(true);
    
    // Проверяем сессию через API
    const checkSession = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const data = await response.json();
          if (data.authenticated) {
            setSession(data.user);
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
      }
    };
    
    checkSession();
  }, []);

  // Инициализация данных
  useEffect(() => {
    if (!session) return;
    
    const initializeData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const processor = new DataProcessor();
        const success = await processor.loadData();
        
        if (success) {
          setDataProcessor(processor);
          setMetrics(processor.getMetrics(''));
          
          // Загружаем опции для фильтров
          setFilterOptions({
            statuses: processor.getAllStatuses(),
            contractors: processor.getAllContractors(),
            managers: processor.getAllManagers(),
            suppliers: processor.getAllSuppliers()
          });

          // Загружаем доступные бренды для фильтра
          setAvailableBrands(processor.getAvailableDealBrands());
        } else {
          setError('Не удалось загрузить данные. Проверьте наличие файлов данных.');
        }
        
        // Загружаем Google Sheets данные
        loadGoogleSheetsData();
        
      } catch (err) {
        console.error('Ошибка инициализации:', err);
        setError('Произошла ошибка при загрузке данных.');
      } finally {
        setIsLoading(false);
      }
    };

    initializeData();
  }, [session]);

  const handleSearch = (article: string) => {
    if (!dataProcessor) return;
    
    setIsLoading(true);
    setCurrentSearch({ query: article, type: 'артикулу' });
    
    try {
      const results = dataProcessor.searchByArticle(article);
      setSearchResults(results);
      setMetrics(dataProcessor.getMetrics(article));
      
      if (results.length > 0) {
        setRateRanges(dataProcessor.getRateRanges(article));
      } else {
        setRateRanges(null);
      }
    } catch (err) {
      console.error('Ошибка поиска:', err);
      setError('Произошла ошибка при поиске данных.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSearch = (query: string, type: 'article' | 'deal' | 'contractor') => {
    if (!dataProcessor) return;
    
    setIsLoading(true);
    
    let typeLabel = '';
    switch (type) {
      case 'article':
        typeLabel = 'артикулу';
        break;
      case 'deal':
        typeLabel = 'сделке';
        break;
      case 'contractor':
        typeLabel = 'контрагенту';
        break;
    }
    
    setCurrentSearch({ query: query || 'все данные', type: typeLabel });
    
    try {
      let results: CombinedData[] = [];
      
      if (!query) {
        // Показать все данные
        results = dataProcessor.getAllData();
      } else {
        switch (type) {
          case 'article':
            results = dataProcessor.searchByArticle(query);
            break;
          case 'deal':
            results = dataProcessor.searchByDeal(query);
            break;
          case 'contractor':
            results = dataProcessor.searchByContractor(query);
            break;
        }
      }
      
      setSearchResults(results);
      setMetrics(dataProcessor.getMetrics(query));
      
      if (results.length > 0) {
        setRateRanges(dataProcessor.getRateRanges(query));
      } else {
        setRateRanges(null);
      }
    } catch (err) {
      console.error('Ошибка поиска:', err);
      setError('Произошла ошибка при поиске данных.');
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик поиска по бренду
  const handleBrandSearch = (brandName: string) => {
    console.log(`[HomePage] handleBrandSearch called for brand: ${brandName}`);
    
    if (!dataProcessor) {
      console.error('[HomePage] DataProcessor not available');
      setError('Система ещё загружается, попробуйте через несколько секунд');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    setCurrentSearch({ query: brandName, type: 'бренду' });
    console.log(`[HomePage] Starting search for brand: ${brandName}`);
    
    try {
      const results = dataProcessor.searchByBrand(brandName);
      console.log(`[HomePage] Found ${results.length} results for brand ${brandName}`);
      
      setSearchResults(results);
      setMetrics(dataProcessor.getMetrics(brandName)); // Общая метрика для бренда
      
      if (results.length > 0) {
        setRateRanges(dataProcessor.getRateRanges(brandName));
      } else {
        setRateRanges(null);
      }
      
      // Показываем сообщение если ничего не найдено
      if (results.length === 0) {
        setError(`По бренду ${brandName} не найдено товаров. Возможно, база брендов ещё загружается.`);
      }
    } catch (err) {
      console.error('Ошибка поиска по бренду:', err);
      setError(`Произошла ошибка при поиске товаров бренда ${brandName}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Обработчик фильтра по брендам
  const handleBrandFilterChange = (brands: string[]) => {
    console.log(`[HomePage] Brand filter changed:`, brands);
    setSelectedBrands(brands);
    
    if (!dataProcessor) return;

    setIsLoading(true);
    setError(null);
    
    try {
      const results = dataProcessor.searchByDealBrands(brands);
      setSearchResults(results);
      
      if (brands.length > 0) {
        setCurrentSearch({ query: brands.join(', '), type: 'брендам' });
      } else {
        setCurrentSearch({ query: 'все данные', type: '' });
      }
      
      // Для фильтра по брендам используем общие метрики без конкретного поиска
      if (brands.length > 0) {
        setMetrics(dataProcessor.getMetrics(brands.join(', ')));
        setRateRanges(dataProcessor.getRateRanges(brands.join(', ')));
      } else {
        setMetrics(dataProcessor.getMetrics(''));
        setRateRanges(dataProcessor.getRateRanges(''));
      }
    } catch (err) {
      console.error('Ошибка поиска по брендам:', err);
      setError('Произошла ошибка при фильтрации по брендам.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFiltersChange = (filters: FilterOptions) => {
    if (!dataProcessor) return;
    
    try {
      const filteredData = dataProcessor.getFilteredData(filters);
      setSearchResults(filteredData);
    } catch (err) {
      console.error('Ошибка фильтрации:', err);
    }
  };

  const handleLogin = (userSession: UserSession) => {
    setSession(userSession);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/session', { method: 'DELETE' });
      setSession(null);
      setSearchResults([]);
      setCurrentSearch({ query: '', type: '' });
      setActiveTab('search');
    } catch (error) {
      console.error('Error during logout:', error);
    }
  };

  const handleFileUploadComplete = async (type: 'nomenclature' | 'deals', file: File) => {
    // Перезагружаем данные после успешной загрузки файла
    if (dataProcessor) {
      setIsLoading(true);
      try {
        const success = await dataProcessor.loadData();
        if (success) {
          setMetrics(dataProcessor.getMetrics(''));
          
          // Обновляем опции для фильтров
          setFilterOptions({
            statuses: dataProcessor.getAllStatuses(),
            contractors: dataProcessor.getAllContractors(),
            managers: dataProcessor.getAllManagers(),
            suppliers: dataProcessor.getAllSuppliers()
          });

          // Обновляем доступные бренды для фильтра  
          setAvailableBrands(dataProcessor.getAvailableDealBrands());
          
          // Если есть текущий поиск, повторяем его с новыми данными
          if (currentSearch.query && currentSearch.type) {
            if (currentSearch.type === 'артикулу') {
              const results = dataProcessor.searchByArticle(currentSearch.query);
              setSearchResults(results);
              if (results.length > 0) {
                setRateRanges(dataProcessor.getRateRanges(currentSearch.query));
              }
            }
          }
        }
      } catch (error) {
        console.error('Ошибка перезагрузки данных:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Показываем загрузку до инициализации клиента
  if (!isClient) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-gray-600">Загрузка...</span>
      </div>
    );
  }

  // Если пользователь не авторизован - показываем форму входа
  if (!session) {
    return <LoginForm onLogin={handleLogin} />;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        {/* Хедер с навигацией (упрощенный для ошибки) */}
        <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/90 border-b border-slate-200 shadow-sm">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">База знаний заказов и сделок</h1>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-full">
                  {session.role === 'admin' ? (
                    <Shield className="h-4 w-4 text-indigo-600" />
                  ) : (
                    <User className="h-4 w-4 text-slate-600" />
                  )}
                  <span className="text-sm font-medium text-gray-900">{session.name || session.email}</span>
                  <Badge 
                    variant={session.role === 'admin' ? 'default' : 'secondary'}
                    className={session.role === 'admin' 
                      ? 'bg-indigo-600 hover:bg-indigo-700' 
                      : 'bg-slate-600 hover:bg-slate-700'
                    }
                  >
                    {session.role === 'admin' ? 'Администратор' : 'Пользователь'}
                  </Badge>
                </div>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={handleLogout}
                  className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Выйти
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Основной контент с ошибкой */}
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Card className="w-full max-w-md shadow-lg">
              <CardContent className="p-8">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Ошибка загрузки</h3>
                    <p className="text-sm text-gray-600 mt-2">{error}</p>
                  </div>
                  <Button
                    onClick={() => window.location.reload()}
                    className="mt-4 bg-indigo-600 hover:bg-indigo-700"
                  >
                    Попробовать снова
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* Современный хедер с навигацией */}
      <div className="sticky top-0 z-50 backdrop-blur-sm bg-white/90 border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Логотип и название */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Search className="h-4 w-4 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">База знаний заказов и сделок</h1>
              </div>
            </div>

            {/* Информация о пользователе и выход */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 px-3 py-1.5 bg-slate-100 rounded-full">
                {session.role === 'admin' ? (
                  <Shield className="h-4 w-4 text-indigo-600" />
                ) : session.role === 'employee' ? (
                  <UserCheck className="h-4 w-4 text-blue-600" />
                ) : (
                  <User className="h-4 w-4 text-slate-600" />
                )}
                <span className="text-sm font-medium text-gray-900">{session.name || session.email}</span>
                <Badge 
                  variant={session.role === 'admin' ? 'default' : 'secondary'}
                  className={session.role === 'admin' 
                    ? 'bg-indigo-600 hover:bg-indigo-700' 
                    : session.role === 'employee' 
                    ? 'bg-blue-600 hover:bg-blue-700'
                    : 'bg-slate-600 hover:bg-slate-700'
                  }
                >
                  {session.role === 'admin' ? 'Администратор' : 
                   session.role === 'employee' ? 'Сотрудник' : 'Пользователь'}
                </Badge>
              </div>
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={handleLogout}
                className="text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Выйти
              </Button>
            </div>
          </div>

          {/* Навигационные табы для админа и сотрудника */}
          {(session.role === 'admin' || session.role === 'employee') && (
            <div className="border-t border-slate-200">
              <nav className="flex space-x-1 py-2">
                <Button
                  variant={activeTab === 'search' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('search')}
                  className={`relative transition-all duration-200 ${
                    activeTab === 'search' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Search className="h-4 w-4 mr-2" />
                  <span className="font-medium">Поиск товаров</span>
                  {activeTab === 'search' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </Button>
                
                <Button
                  variant={activeTab === 'files' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('files')}
                  className={`relative transition-all duration-200 ${
                    activeTab === 'files' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  <span className="font-medium">Загрузка базы</span>
                  {activeTab === 'files' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </Button>
                
                <Button
                  variant={activeTab === 'ai-processing' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('ai-processing')}
                  className={`relative transition-all duration-200 ${
                    activeTab === 'ai-processing' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Table className="h-4 w-4 mr-2" />
                  <span className="font-medium">Кодирование товаров</span>
                  {activeTab === 'ai-processing' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </Button>
                
                <Button
                  variant={activeTab === 'google-sheets-results' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('google-sheets-results')}
                  className={`relative transition-all duration-200 ${
                    activeTab === 'google-sheets-results' 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Table className="h-4 w-4 mr-2" />
                  <span className="font-medium">Результаты ({googleSheetsData.length})</span>
                  {activeTab === 'google-sheets-results' && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full" />
                  )}
                </Button>
                

                
                {/* Управление пользователями только для администраторов */}
                {session.role === 'admin' && (
                  <Button
                    variant={activeTab === 'admin' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setActiveTab('admin')}
                    className={`relative transition-all duration-200 ${
                      activeTab === 'admin' 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Users className="h-4 w-4 mr-2" />
                    <span className="font-medium">Управление пользователями</span>
                    {activeTab === 'admin' && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 w-2 h-2 bg-indigo-600 rounded-full" />
                    )}
                  </Button>
                )}
              </nav>
            </div>
          )}
        </div>
      </div>

      {/* Основной контент */}
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">

      {/* Панель управления файлами */}
      {(session.role === 'admin' || session.role === 'employee') && activeTab === 'files' && (
        <FileManagement onFileUpload={handleFileUploadComplete} />
      )}

      {/* Обработка товаров ИИ */}
      {(session.role === 'admin' || session.role === 'employee') && activeTab === 'ai-processing' && (
        <ProductProcessor />
      )}

      {/* Результаты Google Sheets */}
      {(session.role === 'admin' || session.role === 'employee') && activeTab === 'google-sheets-results' && (
        <GoogleSheetsResultsTable 
          data={googleSheetsData}
          onRefresh={loadGoogleSheetsData}
          loading={googleSheetsLoading}
        />
      )}



      {/* Админская панель управления пользователями */}
      {session.role === 'admin' && activeTab === 'admin' && (
        <UserManagement />
      )}

      {/* Панель поиска */}
      {activeTab === 'search' && (
        <div className="space-y-8">
          {/* Строка поиска */}
          <div className="text-center">
            {(session.role === 'admin' || session.role === 'employee') ? (
              <AdminSearchBar onSearch={handleAdminSearch} isLoading={isLoading} />
            ) : (
              <SearchBar onSearch={handleSearch} isLoading={isLoading} />
            )}
            
            {currentSearch.query && (
              <p className="text-gray-600 mt-2">
                Результаты поиска по {currentSearch.type}: <span className="font-semibold">{currentSearch.query}</span>
              </p>
            )}
          </div>

          {/* Быстрый поиск по брендам */}
          <div className="max-w-2xl mx-auto">
            <BrandQuickSearch onBrandSearch={handleBrandSearch} isLoading={isLoading} />
          </div>

          {/* Фильтр по брендам */}
          <div className="max-w-2xl mx-auto">
            <BrandFilter
              availableBrands={availableBrands}
              selectedBrands={selectedBrands}
              onBrandSelectionChange={handleBrandFilterChange}
              isLoading={isLoading}
            />
          </div>

          {/* Индикатор загрузки */}
          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              <span className="ml-3 text-gray-600">Загрузка данных...</span>
            </div>
          )}

          {/* Панель метрик */}
          {!isLoading && (
            <MetricsDashboard metrics={metrics} rateRanges={rateRanges} />
          )}

          {/* Фильтры */}
          {!isLoading && dataProcessor && searchResults.length > 0 && (session.role === 'admin' || session.role === 'employee') && (
            <FiltersPanel
              onFiltersChange={handleFiltersChange}
              statuses={filterOptions.statuses}
              contractors={filterOptions.contractors}
              managers={filterOptions.managers}
              suppliers={filterOptions.suppliers}
            />
          )}

          {/* Таблица результатов */}
          {!isLoading && (
            <ResultsTable 
              data={searchResults} 
              showContractor={session.role === 'admin' || session.role === 'employee'} 
            />
          )}
        </div>
      )}
      </div>
    </div>
  );
}
