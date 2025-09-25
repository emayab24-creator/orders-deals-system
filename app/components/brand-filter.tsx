


'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Filter, X, ChevronDown, ChevronUp } from 'lucide-react';

interface BrandFilterProps {
  availableBrands: string[];
  selectedBrands: string[];
  onBrandSelectionChange: (brands: string[]) => void;
  isLoading?: boolean;
}

export default function BrandFilter({
  availableBrands,
  selectedBrands,
  onBrandSelectionChange,
  isLoading = false
}: BrandFilterProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleBrandToggle = (brand: string) => {
    const newSelection = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    
    onBrandSelectionChange(newSelection);
  };

  const handleClearAll = () => {
    onBrandSelectionChange([]);
  };

  const handleSelectAll = () => {
    onBrandSelectionChange([...availableBrands]);
  };

  return (
    <Card className="w-full">
      <CardHeader className="cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            <span>Фильтр по брендам</span>
            {selectedBrands.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {selectedBrands.length} выбрано
              </Badge>
            )}
          </div>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </CardTitle>
      </CardHeader>

      {isExpanded && (
        <CardContent>
          {/* Кнопки управления */}
          <div className="flex gap-2 mb-4">
            <Button
              onClick={handleSelectAll}
              size="sm"
              variant="outline"
              disabled={isLoading || availableBrands.length === 0}
            >
              Выбрать все
            </Button>
            <Button
              onClick={handleClearAll}
              size="sm"
              variant="outline"
              disabled={isLoading || selectedBrands.length === 0}
            >
              <X className="h-3 w-3 mr-1" />
              Очистить
            </Button>
          </div>

          {/* Список брендов */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {availableBrands.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                {isLoading ? 'Загружаются бренды...' : 'Бренды не найдены'}
              </div>
            ) : (
              availableBrands.map((brand) => (
                <div key={brand} className="flex items-center space-x-2">
                  <Checkbox
                    id={`brand-${brand}`}
                    checked={selectedBrands.includes(brand)}
                    onCheckedChange={() => handleBrandToggle(brand)}
                    disabled={isLoading}
                  />
                  <label
                    htmlFor={`brand-${brand}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                  >
                    {brand}
                  </label>
                </div>
              ))
            )}
          </div>

          {/* Показываем выбранные бренды */}
          {selectedBrands.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <p className="text-sm font-medium mb-2">Выбранные бренды:</p>
              <div className="flex flex-wrap gap-1">
                {selectedBrands.map((brand) => (
                  <Badge
                    key={brand}
                    variant="secondary"
                    className="bg-blue-100 text-blue-800 cursor-pointer"
                    onClick={() => handleBrandToggle(brand)}
                  >
                    {brand}
                    <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}
