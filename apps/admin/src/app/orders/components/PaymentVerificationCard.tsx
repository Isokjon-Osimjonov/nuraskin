import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Check, X, CreditCard, ExternalLink } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { toast } from 'sonner';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface PaymentVerificationCardProps {
  order: any;
}

export function PaymentVerificationCard({ order }: PaymentVerificationCardProps) {
  const queryClient = useQueryClient();
  const [rejectNote, setRejectNote] = React.useState('');
  const [isRejectDialogOpen, setIsRejectDialogOpen] = React.useState(false);

  const confirmMutation = useMutation({
    mutationFn: () => ordersApi.updateStatus(order.id, { to: 'PAID' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("To'lov tasdiqlandi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => ordersApi.updateStatus(order.id, { to: 'PENDING_PAYMENT', paymentNote: rejectNote }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      setIsRejectDialogOpen(false);
      toast.warning("To'lov rad etildi");
      setRejectNote('');
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  if (order.status !== 'PENDING_PAYMENT') return null;

  const isRejected = !!(order.paymentRejectedAt && !order.paymentVerifiedAt);

  return (
    <Card className={isRejected ? "border-red-200 bg-red-50/30" : "border-yellow-200 bg-yellow-50/30"}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <CreditCard className={`h-5 w-5 ${isRejected ? 'text-red-600' : 'text-yellow-600'}`} />
          To'lov tasdiqlash
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Receipt Preview */}
          <div className="w-full md:w-1/3 aspect-square relative group">
            {isRejected && !order.paymentReceiptUrl ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-red-100 rounded-lg border-2 border-red-300 text-red-700 p-4 text-center">
                <X className="h-10 w-10 mb-2 opacity-60" />
                <span className="text-sm font-bold uppercase mb-2">To'lov rad etildi</span>
                <span className="text-xs mb-2 break-words line-clamp-3 font-medium">Sabab: {order.paymentNote}</span>
                <span className="text-[10px] opacity-70">
                  Rad etilgan vaqt: {new Date(order.paymentRejectedAt).toLocaleString()}
                </span>
              </div>
            ) : order.paymentReceiptUrl ? (
              <Dialog>
                <DialogTrigger asChild>
                  <div className="w-full h-full border-2 border-dashed border-yellow-300 rounded-lg overflow-hidden cursor-zoom-in">
                    <img 
                      src={order.paymentReceiptUrl} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                      alt="Payment Receipt"
                    />
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ExternalLink className="text-white h-8 w-8" />
                    </div>
                  </div>
                </DialogTrigger>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none">
                  <img src={order.paymentReceiptUrl} className="w-full h-auto" alt="Receipt Full" />
                </DialogContent>
              </Dialog>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-yellow-100 rounded-lg border-2 border-dashed border-yellow-300 text-yellow-600">
                <ReceiptText className="h-10 w-10 mb-2 opacity-40" />
                <span className="text-xs font-medium">Rasm yuklanmagan</span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Umumiy summa</p>
                <p className="text-2xl font-black text-yellow-700">
                  {order.currency === 'UZS'
                    ? (Number(BigInt(order.totalAmount)) / 100).toLocaleString()
                    : Number(BigInt(order.totalAmount)).toLocaleString()} 
                  {' '}{order.currency}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Yuborilgan vaqti</p>
                <p className="text-sm font-medium">
                  {order.paymentSubmittedAt 
                    ? new Date(order.paymentSubmittedAt).toLocaleString() 
                    : '—'}
                </p>
              </div>
            </div>
            
            <div className="p-3 bg-white/50 rounded-lg border border-yellow-100 text-sm">
              <p className="text-xs text-muted-foreground mb-1 uppercase font-bold">Karta ma'lumotlari (Mijozga ko'rsatilgan)</p>
              <p className="font-mono text-yellow-800">9860 **** **** 9012 (Kapital Bank)</p>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex gap-3 pt-2 bg-yellow-100/50 rounded-b-lg">
        <Button 
          className="flex-1 bg-green-600 hover:bg-green-700 text-white" 
          onClick={() => confirmMutation.mutate()}
          disabled={confirmMutation.isPending || !order.paymentReceiptUrl}
        >
          <Check className="mr-2 h-4 w-4" />
          Tasdiqlash
        </Button>
        
        <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" className="flex-1 border-red-200 text-red-600 hover:bg-red-50">
              <X className="mr-2 h-4 w-4" />
              Rad etish
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>To'lovni rad etish</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-sm text-muted-foreground mb-3">Mijozga ko'rsatiladigan rad etish sababini kiriting:</p>
              <Textarea 
                placeholder="Rasm tushunarli emas, summa kam..." 
                value={rejectNote}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectNote(e.target.value)}
                rows={4}
              />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Bekor qilish</Button>
              </DialogClose>
              <Button 
                variant="destructive" 
                onClick={() => rejectMutation.mutate()}
                disabled={rejectMutation.isPending || !rejectNote.trim()}
              >
                {rejectMutation.isPending ? 'Yuborilmoqda...' : 'Rad etishni tasdiqlash'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardFooter>
    </Card>
  );
}

function ReceiptText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z" />
      <path d="M16 8h-6" />
      <path d="M16 12h-6" />
      <path d="M16 16h-6" />
    </svg>
  )
}
