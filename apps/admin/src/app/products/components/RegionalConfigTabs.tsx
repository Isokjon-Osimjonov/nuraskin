import * as React from 'react';
import { FormLabel } from '@/components/ui/form';
import { NumberInput } from '@/components/ui/number-input';

export type RegionalConfig = {
  regionCode: 'UZB' | 'KOR';
  retailPrice?: number | undefined;
  wholesalePrice?: number | undefined;
  currency?: string | undefined;
  minWholesaleQty?: number | undefined;
  minOrderQty?: number | undefined;
};

interface RegionalConfigTabsProps {
  configs: RegionalConfig[];
  onChange: (configs: RegionalConfig[]) => void;
}

const REGIONS = [
  { code: 'UZB' as const, label: "O'zbekiston", flag: '🇺🇿' },
  { code: 'KOR' as const, label: 'Koreya', flag: '🇰🇷' },
];

export function RegionalConfigTabs({ configs, onChange }: RegionalConfigTabsProps) {
  const [activeTab, setActiveTab] = React.useState(0);

  const currentConfig = configs[activeTab]!;

  const handleChange = (field: keyof RegionalConfig, value: string | number | undefined) => {
    const updated = [...configs] as RegionalConfig[];
    (updated[activeTab] as Record<string, unknown>)[field as string] = value;

    // Always force currency to KRW in state
    updated[activeTab].currency = 'KRW';

    onChange(updated);
  };

  return (
    <div>
      <div className="flex border-b">
        {REGIONS.map((region, idx) => (
          <button
            key={region.code}
            type="button"
            onClick={() => setActiveTab(idx)}
            className={`flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === idx
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {region.flag} {region.label}
          </button>
        ))}
      </div>
      <div className="pt-4 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <FormLabel>Retail Price (KRW)</FormLabel>
            <NumberInput
              placeholder="0"
              value={currentConfig.retailPrice}
              onChange={val => handleChange('retailPrice', val)}
              allowDecimals={false}
            />
            <p className="text-[10px] text-muted-foreground mt-1">
              Ushbu narx asosida UZB uchun UZS hisoblanadi
            </p>
          </div>
          <div>
            <FormLabel>Wholesale Price (KRW)</FormLabel>
            <NumberInput
              placeholder="0"
              value={currentConfig.wholesalePrice}
              onChange={val => handleChange('wholesalePrice', val)}
              allowDecimals={false}
            />
          </div>
          <div>
            <FormLabel>Min. Wholesale Qty</FormLabel>
            <NumberInput
              min={1}
              placeholder="0"
              value={currentConfig.minWholesaleQty}
              onChange={val => handleChange('minWholesaleQty', val)}
              allowDecimals={false}
            />
          </div>
          <div>
            <FormLabel>Min. Order Qty</FormLabel>
            <NumberInput
              min={1}
              placeholder="0"
              value={currentConfig.minOrderQty}
              onChange={val => handleChange('minOrderQty', val)}
              allowDecimals={false}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
