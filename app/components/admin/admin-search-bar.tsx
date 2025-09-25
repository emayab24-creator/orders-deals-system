

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Loader2 } from 'lucide-react';

interface AdminSearchBarProps {
  onSearch: (query: string, type: 'article' | 'deal' | 'contractor') => void;
  isLoading: boolean;
}

export default function AdminSearchBar({ onSearch, isLoading }: AdminSearchBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType, setSearchType] = useState<'article' | 'deal' | 'contractor'>('article');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      onSearch(searchQuery.trim(), searchType);
    }
  };

  const handleShowAll = () => {
    setSearchQuery('');
    onSearch('', 'article'); // Показать все данные
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSearch} className="flex gap-3">
        <div className="flex-1">
          <Input
            type="text"
            placeholder={
              searchType === 'article' ? 'Введите артикул или название товара (можно через запятую)...' :
              searchType === 'deal' ? 'Введите название сделки (можно через запятую)...' :
              'Введите название контрагента (можно через запятую)...'
            }
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="text-lg py-3"
            disabled={isLoading}
          />
        </div>

        <Select value={searchType} onValueChange={(value: 'article' | 'deal' | 'contractor') => setSearchType(value)}>
          <SelectTrigger className="w-48 py-3">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="article">По артикулу</SelectItem>
            <SelectItem value="deal">По сделке</SelectItem>
            <SelectItem value="contractor">По контрагенту</SelectItem>
          </SelectContent>
        </Select>

        <Button type="submit" size="lg" disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Search className="h-4 w-4 mr-2" />
          )}
          Поиск
        </Button>
      </form>

      <div className="flex gap-2 items-center">
        <Button variant="outline" onClick={handleShowAll} disabled={isLoading}>
          Показать все данные
        </Button>
        
        <div className="text-sm text-gray-600 flex items-center">
          Тип поиска: 
          <span className="ml-1 font-semibold">
            {searchType === 'article' && 'По артикулу'}
            {searchType === 'deal' && 'По сделке'}
            {searchType === 'contractor' && 'По контрагенту'}
          </span>
        </div>
      </div>
      
      <p className="text-xs text-gray-500 text-center">
        💡 Для поиска нескольких значений используйте запятую: значение1, значение2, значение3
      </p>
    </div>
  );
}
