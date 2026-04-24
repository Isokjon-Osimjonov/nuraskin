import { useEffect, useRef, useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/stores/app.store';
import { getMyOrders, submitReceipt } from '@/api/orders';
import type { ApiOrder } from '@/api/orders';
import {
  ArrowLeft, Package, Truck, CheckCircle2, Clock, CreditCard,
  XCircle, AlertCircle, Send, Loader2, Camera,
} from 'lucide-react';

export const Route = createFileRoute('/_protected/orders')({
  component: Orders,
});

const statusConfig: Record<string, { label: string; color: string; icon: typeof Package }> = {
  pending_payment: { label: 'To\'lov kutilmoqda', color: 'text-amber-600 bg-amber-50', icon: CreditCard },
  payment_submitted: { label: 'Chek yuborildi', color: 'text-blue-600 bg-blue-50', icon: Send },
  payment_confirmed: { label: 'To\'lov tasdiqlandi', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  payment_rejected: { label: 'To\'lov rad etildi', color: 'text-red-600 bg-red-50', icon: XCircle },
  pending: { label: 'Kutilmoqda', color: 'text-amber-600 bg-amber-50', icon: Clock },
  confirmed: { label: 'Tasdiqlandi', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  processing: { label: 'Tayyorlanmoqda', color: 'text-blue-600 bg-blue-50', icon: Package },
  shipped: { label: 'Yo\'lda', color: 'text-purple-600 bg-purple-50', icon: Truck },
  delivered: { label: 'Yetkazilgan', color: 'text-emerald-600 bg-emerald-50', icon: CheckCircle2 },
  cancelled: { label: 'Bekor qilindi', color: 'text-stone-500 bg-stone-100', icon: XCircle },
};

const formatPrice = (price: number) => price.toLocaleString('uz-UZ') + ' so\'m';

function OrderCard({ order }: { order: ApiOrder }) {
  const cfg = statusConfig[order.orderStatus] || statusConfig.pending;
  const StatusIcon = cfg.icon;
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState('');

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const needsReceipt = order.orderStatus === 'pending_payment' || order.orderStatus === 'payment_rejected';

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
      await submitReceipt(order._id, selectedFile);
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
    } catch {
      setError('Chek yuborishda xatolik. Qayta urinib ko\'ring.');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="bg-[#f8f7f5] rounded-2xl p-6">
      {/* Order header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[14px] font-normal text-stone-800">{order.shortId || order.orderNumber}</p>
          <p className="text-[12px] font-light text-stone-400">
            {new Date(order.createdAt).toLocaleDateString('uz-UZ')}
          </p>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-normal ${cfg.color}`}>
          <StatusIcon className="w-3.5 h-3.5" strokeWidth={1.5} />
          {cfg.label}
        </span>
      </div>

      {/* Items */}
      <div className="space-y-2 mb-4">
        {order.items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-stone-200 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-stone-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-normal text-stone-700 truncate">{item.name}</p>
              <p className="text-[12px] font-light text-stone-400">
                {item.quantity} dona × {formatPrice(item.price)}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Receipt upload for pending_payment / payment_rejected */}
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
              {order.orderStatus === 'payment_rejected' ? 'Chekni qayta yuborish' : 'To\'lov chekini yuborish'}
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
      {order.orderStatus === 'payment_submitted' && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-blue-500 shrink-0" strokeWidth={1.5} />
          <p className="text-[12px] text-blue-700">Chekingiz tekshirilmoqda. Tez orada tasdiqlanadi.</p>
        </div>
      )}

      {/* Payment rejection */}
      {order.orderStatus === 'payment_rejected' && order.payment?.rejectionReason && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" strokeWidth={1.5} />
          <p className="text-[12px] text-red-600">{order.payment.rejectionReason}</p>
        </div>
      )}

      {/* Tracking */}
      {order.trackingNumber && (
        <div className="bg-purple-50 border border-purple-100 rounded-xl p-3 mb-4 flex items-center gap-2">
          <Truck className="w-4 h-4 text-purple-500 shrink-0" strokeWidth={1.5} />
          <p className="text-[12px] text-purple-700">
            Trek raqam: <span className="font-mono font-normal">{order.trackingNumber}</span>
          </p>
        </div>
      )}

      {/* Footer */}
      <div className="border-t border-stone-200 pt-3 flex items-center justify-between">
        <p className="text-[12px] font-light text-stone-400 truncate max-w-[55%]">
          {order.shippingAddress.city}, {order.shippingAddress.address}
        </p>
        <div className="text-right">
          {order.discountAmount > 0 && (
            <p className="text-[11px] text-stone-400 line-through">
              {formatPrice(order.totalAmount)}
            </p>
          )}
          <p className="text-[14px] font-normal text-[#4A1525]">
            {formatPrice(order.finalAmount || order.totalAmount)}
          </p>
        </div>
      </div>
    </div>
  );
}

function Orders() {
  const { isAuthenticated, token } = useAppStore();
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: ['my-orders'],
    queryFn: getMyOrders,
    enabled: !!token,
  });

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: '/login' });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  const orders = data?.data || [];

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
        ) : orders.length === 0 ? (
          <div className="bg-[#f8f7f5] rounded-2xl p-12 text-center">
            <Package className="w-12 h-12 text-stone-300 mx-auto mb-4" strokeWidth={1.2} />
            <p className="text-[14px] font-light text-stone-500">Hali buyurtmalar yo'q</p>
            <Link to="/products" className="inline-block mt-4 text-[13px] font-normal text-[#4A1525] hover:underline">
              Xarid qilish →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <OrderCard key={order._id} order={order} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}