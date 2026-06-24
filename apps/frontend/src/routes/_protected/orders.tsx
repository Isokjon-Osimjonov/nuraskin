import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app.store';
import { getMyOrders, uploadReceipt, getUploadUrl, cancelOrder } from '@/api/orders';
import { getPaymentInfo } from '@/api/settings';
import { formatUzs, formatKrw, formatPrice, ORDER_STATUS_LABELS_UZ, DELIVERY_ESTIMATE } from '@nuraskin/shared-utils';
import type { StorefrontOrderResponse } from '@nuraskin/shared-types';
import {
  ArrowLeft,
  Package,
  Truck,
  CheckCircle2,
  Clock,
  CreditCard,
  XCircle,
  AlertCircle,
  Send,
  Loader2,
  Camera,
  ExternalLink,
  MapPin,
  Phone,
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/orders')({
  component: Orders,
});

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  DRAFT: {
    label: ORDER_STATUS_LABELS_UZ.DRAFT,
    color: 'text-stone-500 bg-stone-100',
    icon: Package,
  },
  PENDING_PAYMENT: {
    label: ORDER_STATUS_LABELS_UZ.PENDING_PAYMENT,
    color: 'text-amber-600 bg-amber-50',
    icon: CreditCard,
  },
  PAYMENT_SUBMITTED: {
    label: ORDER_STATUS_LABELS_UZ.PAYMENT_SUBMITTED,
    color: 'text-blue-600 bg-blue-50',
    icon: Clock,
  },
  PAYMENT_CONFIRMED: {
    label: ORDER_STATUS_LABELS_UZ.PAYMENT_CONFIRMED,
    color: 'text-emerald-600 bg-emerald-50',
    icon: CheckCircle2,
  },
  PAYMENT_REJECTED: {
    label: ORDER_STATUS_LABELS_UZ.PAYMENT_REJECTED,
    color: 'text-red-600 bg-red-50',
    icon: XCircle,
  },
  PACKING: {
    label: ORDER_STATUS_LABELS_UZ.PACKING,
    color: 'text-blue-600 bg-blue-50',
    icon: Package,
  },
  SHIPPED: {
    label: ORDER_STATUS_LABELS_UZ.SHIPPED,
    color: 'text-purple-600 bg-purple-50',
    icon: Truck,
  },
  DELIVERED: {
    label: ORDER_STATUS_LABELS_UZ.DELIVERED,
    color: 'text-emerald-600 bg-emerald-50',
    icon: CheckCircle2,
  },
  CANCELED: {
    label: ORDER_STATUS_LABELS_UZ.CANCELED,
    color: 'text-stone-500 bg-stone-100',
    icon: XCircle,
  },
  REFUNDED: {
    label: ORDER_STATUS_LABELS_UZ.REFUNDED,
    color: 'text-stone-500 bg-stone-100',
    icon: CheckCircle2,
  },
};

const displayPrice = (price: number | string, currency: string) =>
  formatPrice(price, currency === 'KRW' ? 'KOR' : 'UZB');

function PaymentCountdown({ expiresAt }: { expiresAt: string }) {
  const [timeLeft, setTimeLeft] = useState<string | null>(null);
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const expiry = new Date(expiresAt).getTime();
      const now = new Date().getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeft('Muddat tugadi');
        setIsExpired(true);
        clearInterval(interval);
        return;
      }

      const totalMins = Math.floor(diff / (1000 * 60));
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      const formatted = hours > 0
        ? `${hours} soat ${mins} daqiqa ${secs.toString().padStart(2, '0')} soniya`
        : `${mins} daqiqa ${secs.toString().padStart(2, '0')} soniya`;
      setTimeLeft(formatted);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;

  return (
    <span
      className={`text-[11px] font-normal flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-amber-600'}`}
    >
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}

function OrderCard({ order }: { order: StorefrontOrderResponse }) {
  const cfg = statusConfig[order.status] || {
    label: order.status,
    color: 'text-stone-500 bg-stone-100',
    icon: AlertCircle,
  };
  const StatusIcon = cfg.icon;
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const isExpired = order.paymentExpiresAt ? new Date(order.paymentExpiresAt) < new Date() : false;
  const hasReceipt = !!(order.paymentReceiptUrl || order.paymentSubmittedAt);
  const needsReceipt = order.status === 'PENDING_PAYMENT' && !hasReceipt && !isExpired;

  const { data: paymentInfo } = useQuery({
    queryKey: ['payment-info', order.deliveryRegionCode],
    queryFn: () => getPaymentInfo(order.deliveryRegionCode || 'UZB'),
    enabled: needsReceipt,
  });

  const cancelMutation = useMutation({
    mutationFn: () => cancelOrder(order.id),
    onSuccess: () => {
      toast.success('Buyurtma bekor qilindi');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    },
    onError: () => {
      toast.error("Buyurtmani bekor qilib bo'lmaydi");
    },
  });

  const canCancel = order.status === 'PENDING_PAYMENT' || order.status === 'PAYMENT_SUBMITTED';

  function handleCancelOrder() {
    if (confirm("Buyurtmani bekor qilmoqchimisiz? Bu amalni qaytarib bo'lmaydi.")) {
      cancelMutation.mutate();
    }
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = ev => setPreview(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setPreview(null);
    setError('');
    if (fileRef.current) fileRef.current.value = '';
  }

  async function handleSubmit() {
    if (!selectedFile) return;
    setUploading(true);
    try {
      const { url, timestamp, signature, apiKey } = await getUploadUrl();

      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      const res = await fetch(url, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Cloudinary upload failed');
      const data = await res.json();
      const imageUrl = data.secure_url || data.url;

      await uploadReceipt(order.id, imageUrl);

      toast.success('Chek muvaffaqiyatli yuborildi');
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      handleRemoveFile();
    } catch (err) {
      console.error(err);
      setError("Chek yuborishda xatolik. Qayta urinib ko'ring.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-[#f8f7f5] rounded-2xl p-6 shadow-sm border border-stone-100">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[14px] font-normal text-stone-800">{order.orderNumber}</p>
          <p className="text-[12px] font-light text-stone-400">
            {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal ${cfg.color}`}
          >
            <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
            {cfg.label}
          </span>
          {order.status === 'PENDING_PAYMENT' && order.paymentExpiresAt && (
            <PaymentCountdown expiresAt={order.paymentExpiresAt} />
          )}
        </div>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items?.map((item: any, idx: number) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center shrink-0 overflow-hidden border border-stone-100">
              {item.imageUrls?.[0] ? (
                <img
                  src={item.imageUrls[0]}
                  alt={item.productName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Package className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-normal text-stone-700 truncate">{item.productName}</p>
              <p className="text-[12px] font-light text-stone-400">
                {item.quantity} dona ×{' '}
                {displayPrice(item.unitPriceSnapshot || item.unitPrice, order.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      {order.deliveryFullName && (
        <div className="mb-4 pt-4 border-t border-stone-100">
          <h4 className="text-[11px] font-normal text-stone-400 uppercase tracking-wider mb-2">
            Yetkazib berish manzili:
          </h4>
          <div className="bg-white/50 rounded-xl p-3 space-y-0.5 border border-stone-50">
            <p className="text-[13px] font-normal text-[#4A1525]">{order.deliveryFullName}</p>
            <p className="text-[12px] text-stone-500 flex items-center gap-1.5">
              <Phone className="w-3 h-3" strokeWidth={1.5} />
              {order.deliveryPhone}
            </p>
            <div className="text-[12px] text-stone-600 mt-1 flex items-start gap-1.5">
              <MapPin className="w-3 h-3 mt-1 shrink-0 text-stone-300" strokeWidth={1.5} />
              <div>
                <p>
                  {order.deliveryAddressLine1}
                  {order.deliveryAddressLine2 && `, ${order.deliveryAddressLine2}`}
                </p>
                <p>
                  {order.deliveryPostalCode && `[${order.deliveryPostalCode}] `}
                  {order.deliveryCity}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {order.regionCode === 'UZB' && (
        <div className="text-[13px] text-stone-500 bg-stone-50 rounded-xl p-3 mb-4 border border-stone-100">
          <span className="font-medium text-stone-600">
            Taxminiy yetkazib berish muddati:
          </span>{' '}
          {DELIVERY_ESTIMATE.UZB}
        </div>
      )}

      {/* Receipt upload for pending_payment */}
      {needsReceipt && (
        <div className="mb-4">
          {/* Payment Info */}
          {paymentInfo && (paymentInfo.bank?.enabled || paymentInfo.e9pay?.enabled) && (
            <div className="bg-stone-50 border border-stone-200 rounded-xl p-4 mb-4 space-y-3">
              <h4 className="text-[12px] font-normal text-[#4A1525] mb-2">To'lov ma'lumotlari:</h4>

              {paymentInfo.bank?.enabled && (
                <div className="space-y-1">
                  <p className="text-[11px] font-normal text-stone-700 flex items-center gap-1.5">
                    <CreditCard className="w-3.5 h-3.5" /> Bank kartasi
                  </p>
                  <p className="text-[11px] text-stone-600 pl-5">
                    <span className="text-stone-400">Bank:</span> {paymentInfo.bank.bankName}
                  </p>
                  <p className="text-[11px] text-stone-600 pl-5">
                    <span className="text-stone-400">Karta egasi:</span>{' '}
                    {paymentInfo.bank.holderName}
                  </p>
                  <p className="text-[11px] text-stone-600 pl-5">
                    <span className="text-stone-400">Karta raqami:</span>{' '}
                    <span className="font-mono select-all font-normal">
                      {paymentInfo.bank.accountNumber}
                    </span>
                  </p>
                </div>
              )}

              {paymentInfo.bank?.enabled && paymentInfo.e9pay?.enabled && (
                <div className="border-t border-stone-100 my-2"></div>
              )}

              {paymentInfo.e9pay?.enabled && (
                <div className="space-y-1">
                  <p className="text-[11px] font-normal text-stone-700 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5" /> E9 Pay
                  </p>
                  <p className="text-[11px] text-stone-600 pl-5">
                    <span className="text-stone-400">Ism:</span> {paymentInfo.e9pay.name}
                  </p>
                  <p className="text-[11px] text-stone-600 pl-5">
                    <span className="text-stone-400">Hisob:</span>{' '}
                    <span className="font-mono select-all font-normal">
                      {paymentInfo.e9pay.account}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {preview ? (
            <div className="bg-white border border-stone-200 rounded-xl p-3">
              <div className="flex items-center gap-3">
                <img src={preview} alt="Chek" className="w-12 h-12 rounded-lg object-cover" />
                {uploading ? (
                  <div className="flex items-center gap-2 text-[12px] text-stone-500">
                    <Loader2 className="w-4 h-4 animate-spin" strokeWidth={1.5} />
                    Yuborilmoqda...
                  </div>
                ) : (
                  <p className="text-[12px] text-stone-600 font-normal flex-1">Chek tanlandi</p>
                )}
              </div>
              {!uploading && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSubmit}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#4A1525] text-white text-[12px] font-normal py-2.5 rounded-xl hover:bg-[#3a1020] transition-colors"
                  >
                    <Send className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Yuborish
                  </button>
                  <button
                    onClick={handleRemoveFile}
                    className="flex items-center justify-center gap-1.5 px-4 py-2.5 border border-stone-200 text-stone-500 text-[12px] font-normal rounded-xl hover:bg-stone-50 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                    Bekor qilish
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-[#4A1525] text-white text-[12px] font-normal py-3 rounded-xl hover:bg-[#3a1020] transition-colors disabled:opacity-40"
            >
              <Camera className="w-4 h-4" strokeWidth={1.5} />
              To'lov chekini yuborish
            </button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileSelect}
          />
          {error && (
            <p className="text-[11px] text-red-500 mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" strokeWidth={1.5} />
              {error}
            </p>
          )}
        </div>
      )}

      {/* Payment submitted — waiting for review */}
      {hasReceipt && order.status === 'PENDING_PAYMENT' && (
        <div className="mb-4">
          <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" strokeWidth={1.5} />
              <p className="text-[12px] text-emerald-700">Chek yuborildi. Tasdiqlash kutilmoqda.</p>
            </div>
            {order.paymentReceiptUrl && (
              <button
                onClick={() => window.open(order.paymentReceiptUrl!, '_blank')}
                className="text-[11px] text-emerald-600 underline flex items-center gap-1"
              >
                Ko'rish <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="text-[11px] text-stone-400 underline mt-2 ml-1"
          >
            Chekni almashtirish
          </button>
        </div>
      )}

      {/* Payment rejection info */}
      {order.paymentNote && order.status === 'PENDING_PAYMENT' && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" strokeWidth={1.5} />
          <p className="text-[12px] text-red-600">{order.paymentNote}</p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-stone-200 pt-3 flex items-center justify-between mb-4">
        <p className="text-[14px] font-normal text-[#4A1525]">
          {order.currency === 'KRW' ? formatKrw(order.totalAmount) : formatUzs(order.totalAmount)}
        </p>
        {order.cargoFee && Number(order.cargoFee) > 0 && (
          <p className="text-[10px] text-stone-400">Yetkazib berish bilan</p>
        )}
      </div>

      {canCancel && (
        <div className="pt-2 border-t border-stone-100">
          <button
            onClick={handleCancelOrder}
            disabled={cancelMutation.isPending}
            className="w-full flex items-center justify-center gap-2 bg-white border border-red-200 text-red-500 text-[12px] font-normal py-2.5 rounded-xl hover:bg-red-50 transition-colors disabled:opacity-40"
          >
            {cancelMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <XCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
            )}
            Buyurtmani bekor qilish
          </button>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const { isAuthenticated, token } = useAppStore();
  const navigate = useNavigate();

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyOrders,
    enabled: !!token,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const ordersList = Array.isArray(orders) ? orders : [];

  return (
    <div className="min-h-[80vh] py-12 px-6 bg-white">
      <div className="max-w-[720px] mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile" className="text-stone-400 hover:text-stone-700 transition-colors">
            <ArrowLeft className="w-5 h-5" strokeWidth={1.5} />
          </Link>
          <h1 className="text-xl font-normal text-[#4A1525]">Buyurtmalarim</h1>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[#4A1525] animate-spin" strokeWidth={1.5} />
          </div>
        ) : ordersList.length === 0 ? (
          <div className="bg-[#f8f7f5] rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" strokeWidth={1.2} />
            <p className="text-[14px] font-light text-stone-500">Hali buyurtmalar yo'q</p>
            <Link
              to="/products"
              className="inline-block mt-4 text-[13px] font-normal text-[#4A1525] hover:underline"
            >
              Xarid qilish →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersList.map(order => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
