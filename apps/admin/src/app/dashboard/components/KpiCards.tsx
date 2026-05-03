import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ShoppingBag, Percent, Package, AlertCircle, TrendingUp, CircleDollarSign } from 'lucide-react';
import type { DashboardKPIs } from '@nuraskin/shared-types';
import { formatKrw } from '@/lib/utils';

interface KpiCardsProps {
  data?: DashboardKPIs;
  isLoading: boolean;
}


export function KpiCards({ data, isLoading }: KpiCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {[...Array(5)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data) return null;

  const margin = data.margin_today_percent;
  const marginColor = margin >= 30 ? 'text-green-600' : margin >= 15 ? 'text-yellow-600' : 'text-red-600';

  const cards = [
    {
      title: 'Bugungi daromad',
      value: formatKrw(data.revenue_today_krw),
      icon: CircleDollarSign,
      color: 'text-coral-500', 
      accent: 'border-l-4 border-coral-500',
    },
    {
      title: 'Bugungi buyurtmalar',
      value: data.orders_today.toString(),
      icon: ShoppingBag,
      color: 'text-blue-500',
      accent: 'border-l-4 border-blue-500',
    },
    {
      title: 'Bugungi marja',
      value: margin.toFixed(1) + '%',
      icon: Percent,
      color: marginColor,
      accent: `border-l-4 ${margin >= 30 ? 'border-green-500' : margin >= 15 ? 'border-yellow-500' : 'border-red-500'}`,
    },
    {
      title: 'Ombor qiymati',
      value: formatKrw(data.inventory_value_krw),
      icon: Package,
      color: 'text-purple-500',
      accent: 'border-l-4 border-purple-500',
      subtext: 'Joriy baho bo\'yicha',
    },
    {
      title: 'Qarzdorlik',
      value: formatKrw(data.outstanding_debt_krw),
      icon: AlertCircle,
      color: BigInt(data.outstanding_debt_krw) > 0n ? 'text-red-500' : 'text-green-500',
      accent: BigInt(data.outstanding_debt_krw) > 0n ? 'border-l-4 border-red-500' : 'border-l-4 border-green-500',
      subtext: 'Tasdiqlanmagan to\'lovlar',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
      {cards.map((card, i) => (
        <Card key={i} className={card.accent}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
            <card.icon className={`h-4 w-4 ${card.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
            {card.subtext && (
              <p className="text-xs text-muted-foreground mt-1">{card.subtext}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
