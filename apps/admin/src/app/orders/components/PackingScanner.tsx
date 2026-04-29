import * as React from 'react';
import { BarcodeScanner } from '@nuraskin/ui';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ordersApi } from '../api/orders.api';
import { toast } from 'sonner';
import { X, CheckCircle2, AlertCircle, Scan, Keyboard } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

interface PackingScannerProps {
  order: any;
  onClose: () => void;
}

export function PackingScanner({ order, onClose }: PackingScannerProps) {
  const queryClient = useQueryClient();
  const [manualSku, setManualSku] = React.useState('');
  const [isManualOpen, setIsManualOpen] = React.useState(false);

  const scanMutation = useMutation({
    mutationFn: (input: { barcode?: string; skuSuffix?: string }) => 
      ordersApi.scanItem(order.id, input),
    onSuccess: (res) => {
      if (res.match) {
        toast.success("Mahsulot skanerlandi", {
          icon: <CheckCircle2 className="text-green-500" />,
        });
        queryClient.invalidateQueries({ queryKey: ['orders', order.id] });
        if ('vibrate' in navigator) navigator.vibrate(200);
      } else {
        toast.error("Noto'g'ri mahsulot!", {
          icon: <AlertCircle className="text-red-500" />,
        });
        if ('vibrate' in navigator) navigator.vibrate([100, 50, 100]);
      }
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const handleScan = (barcode: string) => {
    if (scanMutation.isPending) return;
    scanMutation.mutate({ barcode });
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualSku.trim()) return;
    scanMutation.mutate({ skuSuffix: manualSku });
    setManualSku('');
    setIsManualOpen(false);
  };

  const scannedCount = order.items.filter((i: any) => i.isScanned).length;
  const totalCount = order.items.length;
  const allScanned = scannedCount === totalCount;

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md text-white z-10">
        <div className="flex flex-col">
          <span className="text-xs text-white/60 font-mono">{order.orderNumber}</span>
          <span className="text-sm font-bold">Pick & Pack Rejimi</span>
        </div>
        
        <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
          <div className={allScanned ? "text-green-400" : "text-primary"}>
            <span className="text-lg font-black">{scannedCount}</span>
            <span className="text-xs opacity-60 mx-1">/</span>
            <span className="text-sm opacity-80">{totalCount}</span>
          </div>
        </div>

        <Button variant="ghost" size="icon" onClick={onClose} className="text-white">
          <X />
        </Button>
      </div>

      {/* Scanner Area */}
      <div className="flex-1 relative">
        <BarcodeScanner 
          isActive={!allScanned && !isManualOpen} 
          onScan={handleScan}
          onError={(err) => toast.error(err.message || "Xatolik yuz berdi")}
        />

        {allScanned && (
          <div className="absolute inset-0 bg-green-600/90 backdrop-blur-md flex flex-col items-center justify-center text-white p-6 text-center animate-in fade-in zoom-in">
            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-6 shadow-xl">
              <CheckCircle2 className="text-green-600 w-12 h-12" />
            </div>
            <h3 className="text-3xl font-black mb-2">TAYYOR!</h3>
            <p className="text-white/80 mb-8 max-w-xs">Hamma mahsulotlar muvaffaqiyatli skanerlandi.</p>
            <Button 
              size="lg" 
              className="w-full max-w-xs bg-white text-green-700 hover:bg-white/90 font-bold h-14 text-lg rounded-xl shadow-lg"
              onClick={onClose}
            >
              Yakunlash
            </Button>
          </div>
        )}
      </div>

      {/* Footer Controls */}
      <div className="p-6 pb-10 bg-gradient-to-t from-black via-black/80 to-transparent flex justify-center gap-4">
        {!allScanned && (
          <Dialog open={isManualOpen} onOpenChange={setIsManualOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="h-14 px-6 rounded-2xl bg-white/10 border-white/20 text-white backdrop-blur-md hover:bg-white/20">
                <Keyboard className="mr-2 h-5 w-5" />
                SKU kiritish
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle>Manual Skanerlash (SKU)</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleManualSubmit} className="space-y-4 py-4">
                <p className="text-sm text-muted-foreground">
                  Shtrix-kod o'qimasa, mahsulot SKU'sining oxirgi 6 ta belgisini kiriting:
                </p>
                <Input 
                  placeholder="Masalan: 123456" 
                  value={manualSku}
                  onChange={e => setManualSku(e.target.value)}
                  autoFocus
                  className="text-lg font-mono tracking-widest text-center h-12"
                />
                <Button type="submit" className="w-full h-12 text-lg font-bold" disabled={!manualSku}>
                  Tasdiqlash
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
}
