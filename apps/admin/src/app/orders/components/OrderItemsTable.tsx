import * as React from 'react';
import { Table, TableBody, TableCell, TableHeader, TableRow } from '@/components/ui/table';
import { type OrderItemResponse } from '@nuraskin/shared-types';
import { CheckCircle2, Circle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface OrderItemsTableProps {
  items: OrderItemResponse[];
  currency: string;
  krwToUzsRate?: string;
}

export function OrderItemsTable({ items, currency, krwToUzsRate }: OrderItemsTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <th className="w-[80px] px-4 py-3 text-left font-medium text-muted-foreground">Rasm</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Mahsulot</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Miqdor</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Chakana</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Ulgurji</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">To'langan</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">COGS</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Foyda</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Jami</th>
            <th className="w-[80px] px-4 py-3 text-center font-medium text-muted-foreground">
              Status
            </th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => {
            const region = currency === 'UZS' ? 'UZB' : 'KOR';
            const paid = BigInt(item.unitPriceSnapshot);

            // Fix: Convert COGS to UZS if region is UZB
            let cogs = 0n;
            if (item.costAtSaleKrw) {
              const cogsKrw = BigInt(item.costAtSaleKrw);
              if (region === 'UZB' && krwToUzsRate) {
                // Convert KRW to UZS using the stored rate
                // krwToUzsRate is e.g. 14.5. Math.round(14.5 * 100) = 1450.
                const rate = BigInt(Math.round(Number(krwToUzsRate) * 100));
                // cogsKrw * rate = whole_krw * (uzs_per_krw * 100) = whole_uzs * 100 = minor units
                const cogsMinor = cogsKrw * rate;
                // Round to nearest 1,000 UZS (100,000 minor units) per backend convention
                cogs =
                  (cogsMinor / 100000n) * 100000n + (cogsMinor % 100000n >= 50000n ? 100000n : 0n);
              } else {
                cogs = cogsKrw;
              }
            }

            const profit = paid - cogs;
            const margin = paid > 0n ? Number((profit * 10000n) / paid) / 100 : 0;

            const fullPaidPrice = BigInt(item.subtotalSnapshot) / BigInt(item.quantity);
            const isWholesale =
              item.wholesalePriceSnapshot &&
              fullPaidPrice.toString() === item.wholesalePriceSnapshot;

            return (
              <TableRow key={item.id}>
                <TableCell className="p-4">
                  <img
                    src={item.imageUrls[0] || '/placeholder.png'}
                    className="h-12 w-12 rounded object-cover border"
                    alt={item.productName}
                  />
                </TableCell>
                <TableCell className="p-4">
                  <div className="font-medium leading-tight">{item.productName}</div>
                  <div className="text-[10px] text-muted-foreground font-mono mt-1">
                    {item.barcode}
                  </div>
                </TableCell>
                <TableCell className="p-4 text-center font-bold">{item.quantity}</TableCell>
                <TableCell className="p-4 text-right text-xs text-muted-foreground">
                  {item.retailPriceSnapshot ? formatPrice(item.retailPriceSnapshot, region) : '—'}
                </TableCell>
                <TableCell className="p-4 text-right text-xs text-muted-foreground">
                  {item.wholesalePriceSnapshot
                    ? formatPrice(item.wholesalePriceSnapshot, region)
                    : '—'}
                </TableCell>
                <TableCell className="p-4 text-right whitespace-nowrap">
                  <div className="flex flex-col items-end">
                    <span>{formatPrice(fullPaidPrice.toString(), region)}</span>
                    {isWholesale && (
                      <span className="text-[9px] font-bold text-emerald-600 uppercase tracking-tighter">
                        Ulgurji
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="p-4 text-right text-xs text-muted-foreground">
                  {item.costAtSaleKrw ? formatPrice(item.costAtSaleKrw, 'KOR') : '—'}
                </TableCell>
                <TableCell className="p-4 text-right">
                  <div
                    className={`text-xs font-medium ${margin >= 25 ? 'text-emerald-600' : margin >= 10 ? 'text-amber-600' : 'text-red-600'}`}
                  >
                    {margin.toFixed(1)}%
                  </div>
                </TableCell>
                <TableCell className="p-4 text-right font-bold whitespace-nowrap">
                  {formatPrice(item.subtotalSnapshot, region)}
                </TableCell>
                <TableCell className="p-4 text-center">
                  {item.isScanned ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600 mx-auto" />
                  ) : (
                    <Circle className="h-5 w-5 text-muted-foreground/40 mx-auto" />
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
