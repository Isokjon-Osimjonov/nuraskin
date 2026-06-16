import { api } from '@/lib/api';
import * as React from 'react';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Search, Loader2 } from 'lucide-react';

interface JusoResult {
  postal_code: string;
  road_address: string;
  building_name: string;
  jibun_address: string;
  roadAddr: string;
  zipNo: string;
  sggNm: string;
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
        const data = await api.get<any>(`/storefront/juso-search?q=${encodeURIComponent(query)}`);
        
        if (data && data.results && data.results.length > 0) {
          const mappedResults = data.results.map((r: any) => ({
            postal_code: r.zipNo,
            road_address: r.roadAddr,
            building_name: r.bdNm,
            jibun_address: r.jibunAddr,
            roadAddr: r.roadAddr,
            zipNo: r.zipNo,
            sggNm: r.sggNm
          }));
          setResults(mappedResults);
        } else {
          setResults([]);
        }
        setFallback(data?.fallback || false);
      } catch (error) {
        console.error('Juso search failed:', error);
        setResults([]);
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
              onChange={e => setQuery(e.target.value)}
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
              <div className="space-y-0">
                {results.map((addr, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => onSelect(addr)}
                    className="w-full text-left px-4 py-3 hover:bg-stone-50 border-b border-stone-100 last:border-0"
                  >
                    <p className="text-sm font-medium">
                      {addr.roadAddr}
                    </p>
                    <p className="text-xs text-stone-400">
                      {addr.zipNo} · {addr.sggNm}
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
