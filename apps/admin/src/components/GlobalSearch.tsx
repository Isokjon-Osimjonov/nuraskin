import { useState, useEffect, useRef } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Search, Loader2, Package, Users, ShoppingCart } from 'lucide-react';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import type { GlobalSearchResponse, GlobalSearchProduct, GlobalSearchCustomer, GlobalSearchOrder } from '@nuraskin/shared-types';

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { data, isLoading } = useQuery({
    queryKey: ['globalSearch', debouncedQuery],
    queryFn: async () => {
      const res = await api.get<any>(`/admin/search?q=${debouncedQuery}`);
      return res.data?.data as GlobalSearchResponse;
    },
    enabled: debouncedQuery.length >= 2,
  });

  const handleNavigate = (path: string, params: any) => {
    navigate({ to: path, params } as any);
    setOpen(false);
    setQuery('');
    setDebouncedQuery('');
    inputRef.current?.blur();
  };

  return (
    <div className="relative flex-1 max-w-sm ml-auto">
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="search"
          placeholder="Qidirish..."
          className="w-full bg-muted/50 pl-9 pr-12 focus-visible:ring-1 h-9"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            if (query.length >= 2) setOpen(true);
          }}
        />
        <Badge variant="secondary" className="absolute right-1.5 top-1.5 px-1.5 text-[10px] font-mono pointer-events-none text-muted-foreground h-6 flex items-center justify-center">
          ⌘K
        </Badge>
      </div>

      {open && query.length >= 2 && (
        <div 
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 rounded-md border bg-popover shadow-md z-50 max-h-[80vh] overflow-y-auto"
        >
          {isLoading ? (
            <div className="p-4 flex items-center justify-center text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : data ? (
            <div className="p-2 space-y-4">
              {data.products.length === 0 && data.customers.length === 0 && data.orders.length === 0 && (
                <div className="p-4 text-sm text-center text-muted-foreground">
                  Natija topilmadi
                </div>
              )}

              {data.products.length > 0 && (
                <div>
                  <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Package className="h-3 w-3" /> Mahsulotlar
                  </h3>
                  <div className="space-y-1 mt-1">
                    {data.products.map((p: GlobalSearchProduct) => (
                      <button
                        key={p.id}
                        onClick={() => handleNavigate('/products/$productId', { productId: p.id })}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent focus:bg-accent outline-none flex items-center gap-2"
                      >
                        {p.imageUrl ? (
                          <img src={p.imageUrl} alt={p.name} className="h-6 w-6 object-cover rounded" />
                        ) : (
                          <div className="h-6 w-6 bg-muted rounded shrink-0" />
                        )}
                        <div className="flex flex-col overflow-hidden min-w-0">
                          <span className="truncate">{p.name}</span>
                          <span className="text-xs text-muted-foreground truncate">{p.barcode} • {p.sku}</span>
                        </div>
                      </button>
                    ))}
                    {data.totalCounts.products > 5 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                        +{data.totalCounts.products - 5} ko'proq natija mavjud
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.customers.length > 0 && (
                <div>
                  <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <Users className="h-3 w-3" /> Mijozlar
                  </h3>
                  <div className="space-y-1 mt-1">
                    {data.customers.map((c: GlobalSearchCustomer) => (
                      <button
                        key={c.id}
                        onClick={() => handleNavigate('/customers/$id', { id: c.id })}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent focus:bg-accent outline-none flex flex-col"
                      >
                        <span className="truncate font-medium">{c.fullName}</span>
                        <span className="text-xs text-muted-foreground truncate">
                          {c.phone || 'Tel yo\'q'} • {c.telegramId || 'TG yo\'q'}
                        </span>
                      </button>
                    ))}
                    {data.totalCounts.customers > 5 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                        +{data.totalCounts.customers - 5} ko'proq natija mavjud
                      </div>
                    )}
                  </div>
                </div>
              )}

              {data.orders.length > 0 && (
                <div>
                  <h3 className="px-2 py-1 text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                    <ShoppingCart className="h-3 w-3" /> Buyurtmalar
                  </h3>
                  <div className="space-y-1 mt-1">
                    {data.orders.map((o: GlobalSearchOrder) => (
                      <button
                        key={o.id}
                        onClick={() => handleNavigate('/orders/$orderId', { orderId: o.id })}
                        className="w-full text-left px-2 py-1.5 text-sm rounded hover:bg-accent focus:bg-accent outline-none flex justify-between items-center"
                      >
                        <span className="truncate font-medium">{o.orderNumber}</span>
                        <Badge variant="outline" className="text-[10px] ml-2 shrink-0">{o.status}</Badge>
                      </button>
                    ))}
                    {data.totalCounts.orders > 5 && (
                      <div className="px-2 py-1 text-xs text-muted-foreground text-center">
                        +{data.totalCounts.orders - 5} ko'proq natija mavjud
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
