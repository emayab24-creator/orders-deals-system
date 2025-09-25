
'use client';

import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Package, DollarSign, TrendingUp, Hash } from 'lucide-react';
import { MetricsData } from '@/lib/types';

interface MetricsDashboardProps {
  metrics: MetricsData;
  rateRanges?: {
    yuanMin: number;
    yuanMax: number;
    dollarMin: number;
    dollarMax: number;
  } | null;
}

export default function MetricsDashboard({ metrics, rateRanges }: MetricsDashboardProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-blue-700">
            Всего заказов
          </CardTitle>
          <Package className="h-4 w-4 text-blue-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-900">{metrics.totalOrders}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-green-700">
            Общая стоимость
          </CardTitle>
          <DollarSign className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-900">
            {metrics.totalValue.toLocaleString()} ¥
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-purple-700">
            Общее количество
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-purple-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-900">{metrics.totalQuantity || 0}</div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-orange-700">
            Уникальных артикулов
          </CardTitle>
          <Hash className="h-4 w-4 text-orange-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-900">{metrics.uniqueArticles}</div>
        </CardContent>
      </Card>

      {rateRanges && (
        <>
          <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-cyan-700">
                Курс юаня (мин-макс)
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-cyan-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-cyan-900">
                {rateRanges.yuanMin} - {rateRanges.yuanMax}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-700">
                Курс доллара (мин-макс)
              </CardTitle>
              <DollarSign className="h-4 w-4 text-indigo-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-indigo-900">
                {rateRanges.dollarMin} - {rateRanges.dollarMax}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
