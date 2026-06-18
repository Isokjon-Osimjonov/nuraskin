import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { formatPrice } from '@/lib/utils';
import { Info, Package, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/app.store';

interface BoxOption {
  boxId: string;
  name: string;
  label: string;
  maxWeightGrams: number;
  eligible: boolean;
  feeUzs: string;
  isRecommended: boolean;
}

interface BoxOptionsResponse {
  multiBoxRequired: boolean;
  boxId?: string;
  boxName?: string;
  boxLabel?: string;
  quantityNeeded?: number;
  feeUzs?: string;
  options?: BoxOption[];
}

interface BoxPickerProps {
  regionCode: string;
  onSelect: (boxId: string | null, fee: bigint) => void;
}

export function BoxPicker({ regionCode, onSelect }: BoxPickerProps) {
  const { isAuthenticated } = useAppStore();
  const [selectedBoxId, setSelectedBoxId] = useState<string | null>(null);

  const { data, isLoading } = useQuery<BoxOptionsResponse>({
    queryKey: ['box-options'],
    queryFn: () => api.auth.get('/storefront/cart/box-options'),
    enabled: isAuthenticated && regionCode === 'UZB',
  });

  const recommendedBox = data?.options?.find(o => o.isRecommended);
  const effectiveBoxId = selectedBoxId ?? recommendedBox?.boxId;

  useEffect(() => {
    if (!data) return;

    if (data.multiBoxRequired) {
      onSelect(null, BigInt(data.feeUzs || '0'));
    } else if (recommendedBox && !selectedBoxId) {
      // Only auto-select if user hasn't made a manual choice
      onSelect(recommendedBox.boxId, BigInt(recommendedBox.feeUzs));
    }
  }, [data, recommendedBox, selectedBoxId, onSelect]);

  if (regionCode !== 'UZB' || isLoading || !data) return null;

  if (data.multiBoxRequired) {
    return (
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mt-6">
        <h3 className="text-[14px] font-normal text-[#4A1525] mb-4 flex items-center gap-2">
          <Package className="w-4 h-4" />
          Qadoqlash (Quticha)
        </h3>
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex gap-3 items-start">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] text-amber-900 font-normal">
              Bu buyurtma uchun {data.quantityNeeded}x {data.boxName} quticha kerak
            </p>
            <p className="text-[12px] text-amber-700 mt-1">
              Jami vazn eng katta quti sig'imidan ko'p bo'lgani uchun avtomatik ravishda bir nechta
              quti tanlandi.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 mt-6">
      <h3 className="text-[14px] font-normal text-[#4A1525] mb-4 flex items-center gap-2">
        <Package className="w-4 h-4" />
        Quticha tanlash
      </h3>
      <div className="grid grid-cols-2 gap-3">
        {data.options?.map(box => (
          <button
            key={box.boxId}
            type="button"
            disabled={!box.eligible}
            onClick={() => {
              setSelectedBoxId(box.boxId);
              onSelect(box.boxId, BigInt(box.feeUzs));
            }}
            className={`text-left p-4 rounded-2xl border-2 transition-all flex flex-col justify-between min-h-[100px] ${
              effectiveBoxId === box.boxId
                ? 'border-[#4A1525] bg-[#4A1525]/5 shadow-sm'
                : box.eligible
                  ? 'border-stone-100 bg-stone-50/50 hover:border-stone-200'
                  : 'border-stone-50 bg-stone-50/30 opacity-50 cursor-not-allowed'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-normal text-[#4A1525]">{box.name}</span>
                {effectiveBoxId === box.boxId && (
                  <span className="text-[9px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-full font-normal uppercase">
                    Tavsiya
                  </span>
                )}
              </div>
              <p className="text-[11px] text-stone-500 font-light leading-tight">{box.label}</p>
            </div>
            <p className="text-[12px] font-normal text-[#4A1525] mt-2">
              {formatPrice(box.feeUzs, 'UZB')}
            </p>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-stone-400 font-light mt-4 flex items-start gap-1.5">
        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        Har bir quti uchun kargo og'irligi (tare weight) va quti narxi hisoblangan.
      </p>
    </section>
  );
}
