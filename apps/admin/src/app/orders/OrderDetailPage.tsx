import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from './api/orders.api';
import { useParams, useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { useAuthStore } from '@/stores/auth.store';
import { 
  ArrowLeft, 
  PackageCheck, 
  Truck, 
  CheckCircle2, 
  XCircle, 
  Printer, 
  ExternalLink,
  Info,
  Clock,
  Scan,
  MapPin,
  Phone,
} from 'lucide-react';
import { OrderStatusBadge } from './components/OrderStatusBadge';
import { OrderItemsTable } from './components/OrderItemsTable';
import { PaymentVerificationCard } from './components/PaymentVerificationCard';
import { PackingScanner } from './components/PackingScanner';
import { Skeleton } from '@/components/ui/skeleton';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function OrderDetailPage() {
  const { orderId } = useParams({ from: '/_app/orders/$orderId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isScannerOpen, setIsScannerOpen] = React.useState(false);
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<string | null>(null);
  const [receiptUrl, setReceiptUrl] = React.useState<string | null>(null);
  const token = useAuthStore(s => s.token);

  const { data: order, isLoading } = useQuery({
    queryKey: ['orders', orderId],
    queryFn: () => ordersApi.getById(orderId),
  });

  React.useEffect(() => {
    if (orderId) {
      ordersApi.getReceipt(orderId)
        .then(res => setReceiptUrl(res.receipt_url))
        .catch(() => setReceiptUrl(null));
    }
  }, [orderId]);

  React.useEffect(() => {
    if (order?.status === 'PENDING_PAYMENT' && order.paymentExpiresAt) {
      const interval = setInterval(() => {
        const expiry = new Date(order.paymentExpiresAt!).getTime();
        const now = new Date().getTime();
        const diff = expiry - now;

        if (diff <= 0) {
          setTimeLeft('EXPIRED');
          clearInterval(interval);
          return;
        }

        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const secs = Math.floor((diff % (1000 * 60)) / 1000);
        setTimeLeft(`${mins}:${secs.toString().padStart(2, '0')}`);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setTimeLeft(null);
    }
  }, [order]);

  const statusMutation = useMutation({
    mutationFn: (to: string) => ordersApi.updateStatus(orderId, { to: to as any }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      if (variables === 'CANCELED') {
        toast.success("Buyurtma bekor qilindi");
      } else {
        toast.success(`Holat o'zgartirildi: ${variables}`);
      }
    },
    onError: (err: any) => toast.error(err.message || 'Xatolik yuz berdi'),
  });

  const completePackingMutation = useMutation({
    mutationFn: () => ordersApi.completePacking(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', orderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success("Buyurtma tayyorlandi");
    },
    onError: (err: any) => toast.error(err.message || 'Xatolik yuz berdi'),
  });

  const handleDownloadReceipt = async () => {
    if (!order) return;
    const API_BASE = import.meta.env.VITE_API_BASE_URL || '';
    window.open(`${API_BASE}/api/orders/${order.id}/download-receipt`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-8 w-[200px]" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-[200px] md:col-span-2" />
          <Skeleton className="h-[200px]" />
        </div>
        <Skeleton className="h-[400px] w-full" />
      </div>
    );
  }

  if (!order) return <div className="p-6 text-center">Buyurtma topilmadi.</div>;

  const allScanned = order.items.every(i => i.isScanned);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/orders' })}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
              Order {order.orderNumber}
              <OrderStatusBadge status={order.status} />
            </h1>
            <p className="text-sm text-muted-foreground">
              {format(new Date(order.createdAt), 'dd MMMM, yyyy HH:mm')}
            </p>
          </div>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={handleDownloadReceipt}
            disabled={isDownloading}
          >
            <Printer className="mr-2 h-4 w-4" />
            {isDownloading ? 'Yuklanmoqda...' : 'Chek yuklab olish'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Timeout Banner */}
          {order.status === 'PENDING_PAYMENT' && timeLeft && (
            <Card className={`border-none ${timeLeft === 'EXPIRED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
              <CardContent className="flex items-center justify-between py-3 px-4">
                <div className="flex items-center gap-2 font-medium">
                  <Clock className="h-4 w-4" />
                  {timeLeft === 'EXPIRED' ? "To'lov muddati tugagan" : "To'lov kutish vaqti"}
                </div>
                <div className={`text-xl font-mono font-bold ${timeLeft !== 'EXPIRED' && (timeLeft.startsWith('0:') || timeLeft.startsWith('1:') || timeLeft.startsWith('2:') || timeLeft.startsWith('3:') || timeLeft.startsWith('4:')) ? 'text-red-600 animate-pulse' : ''}`}>
                  {timeLeft === 'EXPIRED' ? '00:00' : timeLeft}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Payment Section */}
          <PaymentVerificationCard order={order} />

          {/* Items Section */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between py-4">
              <CardTitle className="text-lg">Mahsulotlar</CardTitle>
              <div className="text-sm font-medium">
                {order.items.filter(i => i.isScanned).length} / {order.items.length} skanerlandi
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <OrderItemsTable items={order.items} currency={order.currency} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Customer Info */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Mijoz</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="font-bold text-lg">{order.customerName}</div>
                <div className="text-sm text-muted-foreground uppercase">{order.regionCode} Region</div>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span>
                    {order.currency === 'UZS' 
                      ? (Number(BigInt(order.subtotal)) / 100).toLocaleString()
                      : Number(BigInt(order.subtotal)).toLocaleString()} 
                    {' '}{order.currency}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cargo fee:</span>
                  <span>
                    {order.currency === 'UZS'
                      ? (Number(BigInt(order.cargoFee)) / 100).toLocaleString()
                      : Number(BigInt(order.cargoFee)).toLocaleString()}
                    {' '}{order.currency}
                  </span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t text-primary">
                  <span>Jami:</span>
                  <span>
                    {order.currency === 'UZS'
                      ? (Number(BigInt(order.totalAmount)) / 100).toLocaleString()
                      : Number(BigInt(order.totalAmount)).toLocaleString()}
                    {' '}{order.currency}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Address Card */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Yetkazib berish manzili</CardTitle>
            </CardHeader>
            <CardContent>
              {order.deliveryFullName ? (
                <div className="space-y-1.5 text-sm">
                  <p className="font-bold text-base">{order.deliveryFullName}</p>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Phone className="h-3.5 w-3.5" />
                    {order.deliveryPhone}
                  </p>
                  <div className="pt-2 border-t mt-2 space-y-1 text-stone-600 font-light">
                    <p className="flex items-start gap-2">
                        <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                        <span>
                            {order.deliveryAddressLine1}
                            {order.deliveryAddressLine2 && `, ${order.deliveryAddressLine2}`}
                        </span>
                    </p>
                    <p className="ml-5">
                      {order.deliveryPostalCode && `[${order.deliveryPostalCode}] `}
                      {order.deliveryCity}
                    </p>
                    <p className="ml-5 uppercase text-[10px] font-bold text-stone-400 tracking-widest">{order.deliveryRegionCode}</p>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/20">
                  Manzil ko'rsatilmagan
                </div>
              )}
            </CardContent>
          </Card>

          {/* Receipt Section */}
          <Card>
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Kvitansiya</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!receiptUrl ? (
                <div className="text-sm text-muted-foreground italic py-4 text-center border rounded-lg bg-muted/20">
                  Chek yuklanmagan
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative group">
                    <img
                      src={receiptUrl}
                      className="w-full max-w-[200px] mx-auto rounded-lg cursor-pointer border hover:opacity-80 transition"
                      onClick={() => window.open(receiptUrl, '_blank')}
                      alt="To'lov cheki"
                    />
                    <div className="text-[10px] text-center text-muted-foreground mt-2">
                      Kattalashtirish uchun bosing
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open(receiptUrl, '_blank')}
                  >
                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                    Chekni ochish
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Card */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="py-4">
              <CardTitle className="text-sm font-bold uppercase tracking-wider">Harakatlar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order.status === 'DRAFT' && (
                <Button className="w-full" onClick={() => statusMutation.mutate('PENDING_PAYMENT')}>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Buyurtmani tasdiqlash
                </Button>
              )}

              {order.status === 'PAID' && (
                <Button className="w-full bg-orange-600 hover:bg-orange-700" onClick={() => statusMutation.mutate('PACKING')}>
                  <PackageCheck className="mr-2 h-4 w-4" />
                  Tayyorlashni boshlash
                </Button>
              )}

              {order.status === 'PACKING' && (
                <>
                  <Button className="w-full h-12 text-lg" onClick={() => setIsScannerOpen(true)}>
                    <Scan className="mr-2 h-5 w-5" />
                    Skanerlashni davom etish
                  </Button>
                  
                  <Button 
                    variant="secondary"
                    className="w-full" 
                    disabled={!allScanned || completePackingMutation.isPending}
                    onClick={() => completePackingMutation.mutate()}
                  >
                    {completePackingMutation.isPending ? 'Yakunlanmoqda...' : 'Tayyorlashni yakunlash'}
                  </Button>
                </>
              )}

              {order.status === 'SHIPPED' && (
                <Button className="w-full" onClick={() => statusMutation.mutate('DELIVERED')}>
                  <Truck className="mr-2 h-4 w-4" />
                  Yetkazildi deb belgilash
                </Button>
              )}

              {['DRAFT', 'PENDING_PAYMENT', 'PAID', 'PACKING'].includes(order.status) && (
                <Button variant="ghost" className="w-full text-red-600 hover:bg-red-50 hover:text-red-700" onClick={() => statusMutation.mutate('CANCELED')}>
                  <XCircle className="mr-2 h-4 w-4" />
                  Bekor qilish
                </Button>
              )}

              {order.adminNote && (
                <div className="mt-4 p-3 bg-white rounded border text-sm">
                  <div className="flex items-center gap-1.5 font-bold mb-1">
                    <Info className="h-3.5 w-3.5 text-blue-500" />
                    Admin izohi:
                  </div>
                  {order.adminNote}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isScannerOpen && (
        <PackingScanner order={order} onClose={() => setIsScannerOpen(false)} />
      )}
    </div>
  );
}
