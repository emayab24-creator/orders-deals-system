
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { FilterOptions } from '@/lib/types';
import { Filter, RefreshCw } from 'lucide-react';

interface FiltersPanelProps {
  onFiltersChange: (filters: FilterOptions) => void;
  statuses: string[];
  contractors: string[];
  managers: string[];
  suppliers: string[];
}

export default function FiltersPanel({
  onFiltersChange,
  statuses,
  contractors,
  managers,
  suppliers
}: FiltersPanelProps) {
  const [filters, setFilters] = useState<FilterOptions>({});
  const [isOpen, setIsOpen] = useState(false);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { ...filters, [key]: value || undefined };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const clearFilters = () => {
    setFilters({});
    onFiltersChange({});
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Фильтры
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? 'Скрыть' : 'Показать'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Очистить
            </Button>
          </div>
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Дата создания от:</label>
              <Input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Дата создания до:</label>
              <Input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Статус:</label>
              <select 
                className="w-full p-2 border rounded-md text-sm"
                value={filters.status || ''}
                onChange={(e) => handleFilterChange('status', e.target.value)}
              >
                <option value="">Все статусы</option>
                {statuses.map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Контрагент:</label>
              <Input
                type="text"
                placeholder="Поиск по контрагенту..."
                value={filters.contractor || ''}
                onChange={(e) => handleFilterChange('contractor', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Менеджер:</label>
              <Input
                type="text"
                placeholder="Поиск по менеджеру..."
                value={filters.manager || ''}
                onChange={(e) => handleFilterChange('manager', e.target.value)}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Снабженец:</label>
              <Input
                type="text"
                placeholder="Поиск по снабженцу..."
                value={filters.supplier || ''}
                onChange={(e) => handleFilterChange('supplier', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
