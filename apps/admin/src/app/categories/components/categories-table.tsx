import * as React from 'react';
import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  ColumnDef,
} from '@tanstack/react-table';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Edit, Trash } from 'lucide-react';
import type { CategoryResponse } from '@nuraskin/shared-types';

interface CategoriesTableProps {
  data: CategoryResponse[];
  onEdit: (category: CategoryResponse) => void;
  onDelete: (category: CategoryResponse) => void;
}

export function CategoriesTable({ data, onEdit, onDelete }: CategoriesTableProps) {
  const columns: ColumnDef<CategoryResponse>[] = React.useMemo(() => [
    {
      accessorKey: 'imageUrl',
      header: 'Rasm',
      cell: ({ row }) => {
        const url = row.getValue('imageUrl') as string;
        return url ? (
          <div className="h-10 w-10 rounded overflow-hidden">
            <img src={url} alt="Category" className="object-cover h-full w-full" />
          </div>
        ) : (
          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center text-xs">Rasm yo'q</div>
        );
      },
    },
    {
      accessorKey: 'name',
      header: 'Nomi',
    },
    {
      accessorKey: 'slug',
      header: 'Slug',
    },
    {
      accessorKey: 'productCount',
      header: 'Mahsulotlar',
      cell: ({ row }) => {
        return <div className="font-medium">{row.getValue('productCount')}</div>;
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Holat',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'success' : 'secondary'}>
            {isActive ? 'Faol' : 'Nofaol'}
          </Badge>
        );
      },
    },
    {
      id: 'actions',
      cell: ({ row }) => {
        const category = row.original;
        return (
          <div className="flex items-center justify-end gap-2">
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => onEdit(category)}
              className="h-8 w-8 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700 border-none shadow-none"
            >
              <Edit className="h-4 w-4" />
              <span className="sr-only">Tahrirlash</span>
            </Button>
            <Button 
              variant="secondary" 
              size="icon" 
              onClick={() => onDelete(category)} 
              className="h-8 w-8 rounded-md bg-red-50 text-red-500 hover:bg-red-100 hover:text-red-600 border-none shadow-none"
            >
              <Trash className="h-4 w-4" />
              <span className="sr-only">O'chirish</span>
            </Button>
          </div>
        );
      },
    },
  ], [onEdit, onDelete]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="rounded-md border bg-card">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(header.column.columnDef.header, header.getContext())}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                Kategoriyalar topilmadi.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
