import * as React from 'react';
import { useAppStore } from '@/stores/app.store';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function RegionSelectionModal() {
  const { regionCode, setRegion } = useAppStore();
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    if (!regionCode) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [regionCode]);

  const handleSelect = (region: 'UZB' | 'KOR') => {
    setRegion(region);
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {
      // Intentionally empty: modal cannot be closed manually
    }}>
      <DialogContent 
        className="max-w-[340px] w-[calc(100%-32px)] p-8 border-none bg-white shadow-2xl flex flex-col items-center text-center"
        // Prevent closing via overlay or Esc
        onPointerDownOutside={(e: any) => e.preventDefault()}
        onEscapeKeyDown={(e: any) => e.preventDefault()}
      >
        <DialogHeader className="mb-6 w-full">
          <div className="mx-auto w-16 h-16 bg-[#4A1525]/10 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#4A1525"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <DialogTitle className="text-2xl font-normal tracking-tight text-[#3A0311]">
            Mintaqangizni tanlang
          </DialogTitle>
          <p className="text-stone-500 text-sm mt-2">
            Xarid qilishni davom ettirish uchun hududingizni belgilang.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3 w-full">
          <Button
            variant="outline"
            className="h-20 text-lg flex items-center justify-start gap-4 border-stone-100 hover:bg-stone-50 hover:border-[#4A1525]/30 transition-all rounded-2xl px-6"
            onClick={() => handleSelect('UZB')}
          >
            <span className="text-2xl">🇺🇿</span>
            <span className="font-normal text-[#3A0311]">O'zbekiston</span>
          </Button>
          <Button
            variant="outline"
            className="h-20 text-lg flex items-center justify-start gap-4 border-stone-100 hover:bg-stone-50 hover:border-[#4A1525]/30 transition-all rounded-2xl px-6"
            onClick={() => handleSelect('KOR')}
          >
            <span className="text-2xl">🇰🇷</span>
            <span className="font-normal text-[#3A0311]">Koreya</span>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
