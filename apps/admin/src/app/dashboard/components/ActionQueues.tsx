import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { CreditCard, Package, Clock, AlertTriangle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import type { DashboardKPIs } from '@nuraskin/shared-types';

interface ActionQueuesProps {
  data?: DashboardKPIs;
  isLoading: boolean;
}

export function ActionQueues({ data, isLoading }: ActionQueuesProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-5 w-8 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-32">
              <CardContent className="p-6">
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const totalActions = Object.values(data.action_queues).reduce((a, b) => a + b, 0);

  const actions = [
    {
      title: 'To\'lov tasdiqlash',
      count: data.action_queues.pending_payment_verification,
      description: 'Mijoz chek yuborgan, tasdiqlash kutilmoqda',
      icon: CreditCard,
      href: '/orders?status=PAYMENT_SUBMITTED',
      cta: 'Ko\'rish →',
      urgency: data.action_queues.pending_payment_verification >= 4 ? 'high' : data.action_queues.pending_payment_verification > 0 ? 'medium' : 'none',
    },
    {
      title: 'Yig\'ish uchun tayyor',
      count: data.action_queues.ready_to_pack,
      description: 'To\'lov tasdiqlangan, yig\'ishni boshlang',
      icon: Package,
      href: '/orders?status=PAYMENT_VERIFIED',
      cta: 'Yig\'ishga o\'tish →',
      urgency: data.action_queues.ready_to_pack >= 4 ? 'high' : data.action_queues.ready_to_pack > 0 ? 'medium' : 'none',
    },
    {
      title: 'Muddati tugayotgan bronlar',
      count: data.action_queues.reservations_expiring_soon,
      description: "To'lanmagan buyurtmalar — bron muddati tugayapti",
      icon: Clock,
      href: '/orders?status=PENDING_PAYMENT',
      cta: "Ko'rish →",
      urgency: data.action_queues.reservations_expiring_soon > 0 ? 'high' : 'none',
    },
    {
      title: 'Kam qolgan tovarlar',
      count: data.action_queues.low_stock_skus,
      description: "Zaxirani to'ldirish tavsiya etiladi",
      icon: AlertTriangle,
      href: '/inventory?filter=low_stock',
      cta: "Ko'rish →",
      urgency: data.action_queues.low_stock_skus >= 6 ? 'high' : data.action_queues.low_stock_skus > 0 ? 'medium' : 'none',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-bold">Bajarilishi kerak</h2>
        <Badge variant="secondary" className="bg-coral-100 text-coral-700">
          {totalActions}
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {actions.map((action, i) => {
          const isHigh = action.urgency === 'high';
          const isMed = action.urgency === 'medium';
          
          return (
            <Card 
              key={i} 
              className={`relative overflow-hidden transition-all border-2 ${
                isHigh ? 'border-red-500 animate-pulse' : 
                isMed ? 'border-yellow-500' : 
                'border-gray-200'
              }`}
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <action.icon className={`h-5 w-5 ${isHigh ? 'text-red-500' : isMed ? 'text-yellow-600' : 'text-gray-500'}`} />
                      <h3 className="font-semibold">{action.title}</h3>
                    </div>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                  <div className="text-3xl font-bold">{action.count}</div>
                </div>
                
                <div className="mt-4 flex justify-end">
                  <Link 
                    to={action.href as any}
                    className="text-sm font-medium text-coral-600 hover:text-coral-700 hover:underline"
                  >
                    {action.cta}
                  </Link>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
