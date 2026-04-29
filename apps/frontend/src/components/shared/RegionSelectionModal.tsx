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
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent 
        className="sm:max-w-md p-8 border-none bg-background shadow-2xl flex flex-col items-center text-center"
        // Prevent closing via overlay or Esc
        onPointerDownOutside={(e: any) => e.preventDefault()}
        onEscapeKeyDown={(e: any) => e.preventDefault()}
      >
        <DialogHeader className="mb-6">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-primary"
            >
              <path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <DialogTitle className="text-3xl font-black tracking-tight">
            Mintaqangizni tanlang
          </DialogTitle>
          <p className="text-muted-foreground mt-2">
            Xarid qilishni davom ettirish uchun hududingizni belgilang.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
          <Button
            variant="outline"
            size="lg"
            className="h-24 text-xl flex flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => handleSelect('UZB')}
          >
            <span className="text-3xl">🇺🇿</span>
            O'zbekiston
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-24 text-xl flex flex-col gap-2 hover:bg-primary/5 hover:border-primary transition-all"
            onClick={() => handleSelect('KOR')}
          >
            <span className="text-3xl">🇰🇷</span>
            Koreya
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
