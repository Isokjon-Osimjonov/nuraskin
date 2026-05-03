import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app.store';
import { getMyOrders, uploadReceipt, getUploadUrl } from '@/api/orders';
import { formatUzs, formatKrw } from '@/lib/utils';
import type { StorefrontOrderResponse } from '@nuraskin/shared-types';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, CreditCard,
  XCircle, AlertCircle, Send, Loader2, Camera, ExternalLink,
  MapPin, Phone
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/orders')({
  component: Orders,
});

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  PENDING_PAYMENT: { label: 'To\'lov kutilmoqda', color: 'text-amber-600 bg-amber-50', icon: CreditCard },
  PAID: { label: 'To\'lov tasdiqlandi', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  PACKING: { label: 'Tayyorlanmoqda', color: 'text-blue-600 bg-blue-50', icon: Package },
  SHIPPED: { label: 'Yo\'lda', color: 'text-purple-600 bg-purple-50', icon: Truck },
  DELIVERED: { label: 'Yetkazilgan', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  CANCELED: { label: 'Bekor qilindi', color: 'text-stone-500 bg-stone-100', icon: XCircle },
};

const formatPrice = (price: number | string, currency: string) => {
  if (currency === 'KRW') return formatKrw(price);
  return formatUzs(price);
};

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

      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const secs = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${mins} daqiqa ${secs.toString().padStart(2, '0')} soniya`);
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  if (!timeLeft) return null;

  return (
    <span className={`text-[11px] font-medium flex items-center gap-1 ${isExpired ? 'text-red-500' : 'text-amber-600'}`}>
      <Clock className="w-3 h-3" />
      {timeLeft}
    </span>
  );
}

function OrderCard({ order }: { order: StorefrontOrderResponse }) {
  const cfg = statusConfig[order.status] || statusConfig.PENDING_PAYMENT;
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

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
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
      // 1. Get signed upload URL
      const { url, timestamp, signature, apiKey } = await getUploadUrl();

      // 2. Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('api_key', apiKey);
      formData.append('timestamp', String(timestamp));
      formData.append('signature', signature);

      const res = await fetch(url, { method: 'POST', body: formData });
      if (!res.ok) throw new Error('Cloudinary upload failed');
      const data = await res.json();
      const imageUrl = data.secure_url || data.url;

      // 3. Update order with receipt URL
      await uploadReceipt(order.id, imageUrl);
      
      toast.success("Chek muvaffaqiyatli yuborildi");
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      handleRemoveFile();
    } catch (err) {
      console.error(err);
      setError('Chek yuborishda xatolik. Qayta urinib ko\'ring.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-[#f8f7f5] rounded-2xl p-6 shadow-sm border border-stone-100">
      {/* Order header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[14px] font-medium text-stone-800">{order.orderNumber}</p>
          <p className="text-[12px] font-light text-stone-400">
            {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal ${cfg.color}`}>
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
                <img src={item.imageUrls[0]} alt={item.productName} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-normal text-stone-700 truncate">{item.productName}</p>
              <p className="text-[12px] font-light text-stone-400">
                {item.quantity} dona × {formatPrice(item.unitPriceSnapshot || item.unitPrice, order.currency)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Delivery Address */}
      {order.deliveryFullName && (
        <div className="mb-4 pt-4 border-t border-stone-100">
          <h4 className="text-[11px] font-medium text-stone-400 uppercase tracking-wider mb-2">Yetkazib berish manzili:</h4>
          <div className="bg-white/50 rounded-xl p-3 space-y-0.5 border border-stone-50">
            <p className="text-[13px] font-medium text-[#4A1525]">{order.deliveryFullName}</p>
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

      {/* Receipt upload for pending_payment */}
      {needsReceipt && (
        <div className="mb-4">
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
      <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
        <p className="text-[14px] font-medium text-[#4A1525]">
          {formatPrice(order.totalAmount, order.currency)}
        </p>
        {order.cargoFee && Number(order.cargoFee) > 0 && (
           <p className="text-[10px] text-stone-400">Yetkazib berish bilan</p>
        )}
      </div>
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
            <Link to="/products" className="inline-block mt-4 text-[13px] font-normal text-[#4A1525] hover:underline">
              Xarid qilish →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {ordersList.map((order) => (
              <OrderCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
