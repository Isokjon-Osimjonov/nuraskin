import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { CreditCard, Check, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { toast } from 'sonner';

interface ManualPaymentCardProps {
  order: any;
}

export function ManualPaymentCard({ order }: ManualPaymentCardProps) {
  const queryClient = useQueryClient();
  const [paymentAmount, setPaymentAmount] = React.useState(Number(order.totalAmount));
  const [paymentMethod, setPaymentMethod] = React.useState('CARD');
  const [paymentReference, setPaymentReference] = React.useState('');
  const [paymentNote, setPaymentNote] = React.useState('');

  const confirmMutation = useMutation({
    mutationFn: (data: any) => ordersApi.confirmPayment(order.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success("To'lov tasdiqlandi!");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  if (order.orderSource !== 'MANUAL') return null;
  if (!['PENDING_PAYMENT', 'PAYMENT_SUBMITTED'].includes(order.status)) return null;

  return (
    <Card className="border-indigo-200 bg-indigo-50/30">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2 text-indigo-700">
          <CreditCard className="h-5 w-5" />
          To'lovni tasdiqlash (admin)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>To'lov miqdori (₩)</Label>
            <Input 
              type="number" 
              value={paymentAmount} 
              onChange={e => setPaymentAmount(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label>To'lov usuli</Label>
            <Select onValueChange={setPaymentMethod} value={paymentMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Tanlang" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="TELEGRAM_TRANSFER">Telegram Transfer</SelectItem>
                <SelectItem value="CASH">Naqd pul</SelectItem>
                <SelectItem value="BANK_TRANSFER">Bank o'tkazmasi</SelectItem>
                <SelectItem value="CARD">Karta</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Ma'lumot</Label>
          <Input 
            placeholder="@username orqali yoki boshqa ma'lumot" 
            value={paymentReference}
            onChange={e => setPaymentReference(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label>Izoh</Label>
          <Textarea 
            placeholder="Qo'shimcha eslatma" 
            value={paymentNote}
            onChange={e => setPaymentNote(e.target.value)}
            rows={2}
          />
        </div>
      </CardContent>
      <CardFooter className="bg-indigo-100/50 rounded-b-lg pt-3">
        <Button 
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold"
          disabled={confirmMutation.isPending}
          onClick={() => confirmMutation.mutate({
            paymentAmount,
            paymentMethod,
            paymentReference,
            paymentNote
          })}
        >
          {confirmMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
          To'lovni tasdiqlash
        </Button>
      </CardFooter>
    </Card>
  );
}
