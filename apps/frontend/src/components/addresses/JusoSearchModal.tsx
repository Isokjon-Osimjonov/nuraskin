import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Loader2 } from 'lucide-react';
import { apiFetch } from '@/lib/apiFetch';

interface JusoResult {
  postal_code: string;
  road_address: string;
  building_name: string;
  jibun_address: string;
}

interface JusoSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: JusoResult) => void;
}

export function JusoSearchModal({ open, onOpenChange, onSelect }: JusoSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<JusoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);

  useEffect(() => {
    if (!open) {
      setQuery('');
      setResults([]);
      return;
    }
  }, [open]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await apiFetch<{ results: JusoResult[]; fallback: boolean }>(
          `/storefront/addresses/juso-search?q=${encodeURIComponent(query)}`
        );
        setResults(data.results);
        setFallback(data.fallback);
      } catch (error) {
        console.error('Juso search failed:', error);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-light text-[#4A1525]">
            주소 검색 / Manzil qidirish
          </DialogTitle>
        </DialogHeader>

        <div className="p-6">
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              placeholder="도로명, 건물명, 지번을 입력하세요"
              className="w-full h-12 pl-10 pr-4 rounded-xl bg-stone-50 border border-stone-100 text-[14px] outline-none focus:border-[#4A1525] transition-all"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center text-stone-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <p className="text-[13px]">Qidirilmoqda...</p>
              </div>
            ) : results.length > 0 ? (
              <div className="space-y-2">
                {results.map((item, idx) => (
                  <button
                    key={idx}
                    className="w-full text-left p-4 rounded-xl hover:bg-stone-50 border border-transparent hover:border-stone-100 transition-all group"
                    onClick={() => onSelect(item)}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-medium bg-[#4A1525]/5 text-[#4A1525] px-2 py-0.5 rounded">
                        {item.postal_code}
                      </span>
                      <p className="text-[13px] text-[#4A1525] font-medium group-hover:text-[#6B2540]">
                        {item.road_address}
                      </p>
                    </div>
                    {item.building_name && (
                      <p className="text-[11px] text-stone-500 mt-1 ml-14">
                        {item.building_name}
                      </p>
                    )}
                    <p className="text-[11px] text-stone-400 mt-1 ml-14 line-clamp-1 italic">
                      {item.jibun_address}
                    </p>
                  </button>
                ))}
              </div>
            ) : query.length >= 2 ? (
              <div className="py-12 text-center text-stone-400">
                <p className="text-[13px]">Natija topilmadi</p>
              </div>
            ) : (
              <div className="py-12 text-center text-stone-300">
                <p className="text-[12px] italic">Manzil qidirishni boshlang</p>
              </div>
            )}
          </div>

          {fallback && (
            <p className="mt-4 text-[11px] text-amber-600 text-center bg-amber-50 py-2 rounded-lg">
              Qidiruv xizmati vaqtincha ishlamayapti. Manzilni qo'lda kiriting.
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
