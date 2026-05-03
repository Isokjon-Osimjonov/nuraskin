import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { type OrderItemResponse } from '@nuraskin/shared-types';
import { CheckCircle2, Circle } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface OrderItemsTableProps {
  items: OrderItemResponse[];
  currency: string;
}

export function OrderItemsTable({ items, currency }: OrderItemsTableProps) {
  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <th className="w-[80px] px-4 py-3 text-left font-medium text-muted-foreground">Image</th>
            <th className="px-4 py-3 text-left font-medium text-muted-foreground">Product</th>
            <th className="px-4 py-3 text-center font-medium text-muted-foreground">Qty</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Price</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Subtotal</th>
            <th className="w-[100px] px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.id}>
              <TableCell className="p-4">
                <img 
                  src={item.imageUrls[0] || '/placeholder.png'} 
                  className="h-12 w-12 rounded object-cover border" 
                  alt={item.productName} 
                />
              </TableCell>
              <TableCell className="p-4">
                <div className="font-medium">{item.productName}</div>
                <div className="text-xs text-muted-foreground font-mono">{item.barcode}</div>
              </TableCell>
              <TableCell className="p-4 text-center font-bold">
                {item.quantity}
              </TableCell>
              <TableCell className="p-4 text-right whitespace-nowrap">
                {formatPrice(item.unitPriceSnapshot, currency === 'UZS' ? 'UZB' : 'KOR')}
              </TableCell>
              <TableCell className="p-4 text-right font-bold whitespace-nowrap">
                {formatPrice(item.subtotalSnapshot, currency === 'UZS' ? 'UZB' : 'KOR')}
              </TableCell>
              <TableCell className="p-4 text-center">
                {item.isScanned ? (
                  <div className="flex flex-col items-center gap-1 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Scanned</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1 text-muted-foreground/40">
                    <Circle className="h-5 w-5" />
                    <span className="text-[10px] font-bold uppercase">Pending</span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
