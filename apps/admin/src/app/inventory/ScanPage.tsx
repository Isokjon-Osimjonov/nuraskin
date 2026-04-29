import * as React from 'react';
import { BarcodeScanner } from '@nuraskin/ui';
import { AddBatchSheet } from './components/AddBatchSheet';
import { inventoryApi, type ScannedProduct } from './api/inventory.api';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@tanstack/react-router';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

export function ScanPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [scannedProduct, setScannedProduct] = React.useState<ScannedProduct | null>(null);
  const [sheetOpen, setSheetOpen] = React.useState(false);
  const [scannerActive, setScannerActive] = React.useState(true);
  const [scanCount, setScanCount] = React.useState(0);

  const handleScan = async (barcode: string) => {
    setScannerActive(false);
    try {
      const product = await inventoryApi.scan(barcode);
      setScannedProduct(product);
      setSheetOpen(true);
      toast.success('Mahsulot topildi');
    } catch (error: any) {
      console.error('handleScan failed:', error);
      if (error.message.includes('404') || error.message.includes('not found')) {
        toast.info(`Yangi mahsulot — ro'yxatga o'tkazildi`);
        navigate({ 
          to: '/products/new', 
          search: { barcode } 
        });
      } else {
        toast.error(error.message || 'Xatolik yuz berdi');
        setScannerActive(true);
      }
    }
  };

  const handleSuccess = () => {
    setScanCount(prev => prev + 1);
    setScannedProduct(null);
    setScannerActive(true);
    queryClient.invalidateQueries({ queryKey: ['inventory'] });
    queryClient.invalidateQueries({ queryKey: ['products'] });
  };

  const handleOpenChange = (open: boolean) => {
    setSheetOpen(open);
    if (!open) {
      setScannerActive(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-black/50 backdrop-blur-md text-white z-10">
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/10"
          onClick={() => navigate({ to: '/inventory' })}
        >
          <ArrowLeft />
        </Button>
        <div className="flex flex-col items-center">
          <span className="text-sm font-medium">Scanning Mode</span>
          <span className="text-xs text-white/60">{scanCount} items added this session</span>
        </div>
        <Button
          variant="ghost"
          className="text-primary hover:text-primary/80 font-semibold"
          onClick={() => navigate({ to: '/inventory' })}
        >
          Done
        </Button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 relative">
        <BarcodeScanner
          isActive={scannerActive}
          onScan={handleScan}
          onError={(err) => toast.error(err.message || "Xatolik yuz berdi")}
        />
        
        {!scannerActive && !sheetOpen && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-medium">Processing...</p>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Hint */}
      <div className="absolute bottom-10 left-0 right-0 flex justify-center pointer-events-none">
        <p className="px-4 py-2 bg-black/60 backdrop-blur-md rounded-full text-white/80 text-sm border border-white/10">
          Scan product barcode to add stock
        </p>
      </div>

      <AddBatchSheet
        product={scannedProduct}
        open={sheetOpen}
        onOpenChange={handleOpenChange}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
