import * as React from 'react';
import { cn } from '@/lib/utils';
import { Inbox } from 'lucide-react';

export function DataTable({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full rounded-lg border border-stone-200 overflow-hidden bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className={cn('w-full text-left text-sm', className)} {...props}>
          {children}
        </table>
      </div>
    </div>
  );
}

export function DataTableHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn(
        'bg-white text-black text-xs font-bold uppercase tracking-wide border-b border-stone-200',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-stone-100 bg-white', className)}
      {...props}
    />
  );
}

export function DataTableRow({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn('hover:bg-stone-50 transition-colors', className)}
      {...props}
    />
  );
}

export function DataTableHead({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn(
        'px-4 py-3 align-middle font-medium whitespace-nowrap',
        className,
      )}
      {...props}
    />
  );
}

export function DataTableCell({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 align-middle text-stone-600', className)}
      {...props}
    />
  );
}

export function DataTableEmpty({
  colSpan,
  message = "Ma'lumot topilmadi",
}: {
  colSpan: number;
  message?: string;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-4 py-12 text-center text-stone-500">
        <div className="flex flex-col items-center justify-center gap-3">
          <div className="h-12 w-12 rounded-full bg-stone-100 flex items-center justify-center">
            <Inbox className="h-6 w-6 text-stone-400" />
          </div>
          <p className="text-sm font-medium">{message}</p>
        </div>
      </td>
    </tr>
  );
}
