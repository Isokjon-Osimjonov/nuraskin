import { queryKeys } from '@nuraskin/shared-utils';
import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createManualOrderSchema, type CreateManualOrderInput } from '@nuraskin/shared-types';
import { ordersApi } from './api/orders.api';
import { productsApi } from '../products/api/products.api';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';

import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Search,
  Plus,
  Trash,
  Info,
  User,
  Package,
  MapPin,
  CreditCard,
  AlertTriangle,
  Loader2,
  X,
} from 'lucide-react';
import { useDebounce } from '@/hooks/useDebounce';

interface ManualOrderItem {
  productId: string;
  name: string;
  image: string;
  quantity: number;
  negotiatedPriceKrw: number;
  availableStock: number;
}

export function ManualOrderPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [customerSearch, setCustomerSearch] = React.useState('');
  const debouncedCustomerSearch = useDebounce(customerSearch, 300);
  const [selectedCustomer, setSelectedCustomer] = React.useState<any | null>(null);

  const [productSearch, setProductSearch] = React.useState('');
  const [items, setItems] = React.useState<ManualOrderItem[]>([]);
  const [isForceCreate, setIsForceCreate] = React.useState(false);
  const [isProductListVisible, setIsProductListVisible] = React.useState(false);

  // 1. Data Fetching
  const { data: customerResults = [], isLoading: isLoadingCustomers } = useQuery({
    queryKey: ['customers', 'search', debouncedCustomerSearch],
    queryFn: () => ordersApi.searchCustomers(debouncedCustomerSearch),
    enabled: debouncedCustomerSearch.length >= 2,
  });

  const { data: allProducts = [], isLoading: isLoadingProducts } = useQuery({
    queryKey: ['products', 'all'],
    queryFn: () => productsApi.getAll({ isActive: true }),
  });

  const filteredProducts = React.useMemo(() => {
    if (!productSearch) return allProducts;
    const term = productSearch.toLowerCase();
    return allProducts.filter(
      p =>
        p.name.toLowerCase().includes(term) ||
        p.barcode.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term)
    );
  }, [allProducts, productSearch]);

  const form = useForm<CreateManualOrderInput>({
    resolver: zodResolver(createManualOrderSchema as any) as any,
    defaultValues: {
      customerId: '',
      items: [],
      deliveryAddress: '',
      deliveryFeeCoveredBy: 'CUSTOMER',
      deliveryFeeCharged: 0,
      deliveryFeeActual: 0,
      adminNotes: '',
      region: 'KOR',
      forceCreate: false,
    },
  });

  const region = form.watch('region');
  const deliveryFeeCoveredBy = form.watch('deliveryFeeCoveredBy');

  // 2. Handlers
  const handleSelectCustomer = (customer: any) => {
    setSelectedCustomer(customer);
    form.setValue('customerId', customer.id);
    form.setValue('region', 'KOR'); // Manual orders are KRW/KOR centric for this fix
    setCustomerSearch('');
  };

  const handleAddProduct = (p: any) => {
    if (items.some(i => i.productId === p.id)) return;

    const price = Number(p.korRetail || 0);

    const newItems = [
      ...items,
      {
        productId: p.id,
        name: p.name,
        image: p.imageUrls[0] || '',
        quantity: 1,
        negotiatedPriceKrw: price,
        availableStock: p.totalStock,
      },
    ];
    setItems(newItems);
    form.setValue('items', newItems as any, { shouldValidate: true });
    setProductSearch('');
    setIsProductListVisible(false);
  };

  const updateItemQty = (id: string, qty: number) => {
    const newItems = items.map(i => (i.productId === id ? { ...i, quantity: Math.max(1, qty) } : i));
    setItems(newItems);
    form.setValue('items', newItems as any, { shouldValidate: true });
  };

  const updateItemPrice = (id: string, price: number) => {
    const newItems = items.map(i => (i.productId === id ? { ...i, negotiatedPriceKrw: Math.max(0, price) } : i));
    setItems(newItems);
    form.setValue('items', newItems as any, { shouldValidate: true });
  };

  const removeItem = (id: string) => {
    const newItems = items.filter(i => i.productId !== id);
    setItems(newItems);
    form.setValue('items', newItems as any, { shouldValidate: true });
  };

  const createMutation = useMutation({
    mutationFn: ordersApi.createManual,
    onSuccess: order => {
      queryClient.invalidateQueries({ queryKey: queryKeys.orders.all() });
      toast.success('Buyurtma yaratildi! Mijozga xabar yuborildi.');
      navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
    },
    onError: (err: unknown) => {
      try {
        const errMsg = err instanceof Error ? err.message : '';
        const data = JSON.parse(errMsg);
        if (data.code === 'INSUFFICIENT_STOCK') {
          if (confirm(`${data.message}. Baribir davom etasizmi?`)) {
            form.setValue('forceCreate', true);
            createMutation.mutate({
              ...form.getValues(),
              items: items.map(i => ({
                productId: i.productId,
                quantity: i.quantity,
                negotiatedPriceKrw: i.negotiatedPriceKrw,
              })),
            } as any);
          }
        } else {
          toast.error(data.message || 'Xatolik yuz berdi');
        }
      } catch (e) {
        toast.error('Xatolik yuz berdi');
      }
    },
  });

  const onSubmit = (data: CreateManualOrderInput) => {
    if (!selectedCustomer) {
      toast.error('Mijozni tanlang');
      return;
    }
    if (items.length === 0) {
      toast.error("Kamida bitta mahsulot qo'shing");
      return;
    }

    const formattedData = {
      ...data,
      items: items.map(i => ({
        productId: i.productId,
        quantity: i.quantity,
        negotiatedPriceKrw: i.negotiatedPriceKrw,
      })),
      forceCreate: isForceCreate,
      region: 'KOR' as const,
    };

    createMutation.mutate(formattedData as any);
  };

  // 3. Calculations
  const subtotal = items.reduce(
    (acc, i) => acc + (i.negotiatedPriceKrw || 0) * (i.quantity || 0),
    0
  );
  const deliveryFeeCharged = form.watch('deliveryFeeCharged') || 0;
  const deliveryFeeActual = form.watch('deliveryFeeActual') || 0;
  const total = subtotal + deliveryFeeCharged;

  const stockWarnings = items.filter(i => i.quantity > i.availableStock);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto w-full min-w-0">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/orders' })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Manual buyurtma yaratish</h1>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* SECTION 1: Customer Search */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" /> Mijozni tanlash
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedCustomer ? (
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/20 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg">
                      {selectedCustomer.fullName.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-stone-900">{selectedCustomer.fullName}</p>
                      <p className="text-xs text-muted-foreground">
                        {selectedCustomer.phone} • {selectedCustomer.totalOrders} ta buyurtma
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedCustomer(null)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Ism, telefon yoki telegram..."
                    className="pl-10 h-12"
                    value={customerSearch}
                    onChange={e => setCustomerSearch(e.target.value)}
                  />
                  {customerSearch.length >= 2 && (
                    <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-xl overflow-hidden">
                      {isLoadingCustomers ? (
                        <div className="p-4 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Qidirilmoqda...
                        </div>
                      ) : customerResults.length === 0 ? (
                        <div className="p-8 text-center">
                          <p className="text-sm font-medium text-stone-600">Mijoz topilmadi</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            Avval ro'yxatdan o'tishini so'rang.
                          </p>
                        </div>
                      ) : (
                        customerResults.map((c: any) => (
                          <button
                            key={c.id}
                            type="button"
                            className="w-full p-4 text-left hover:bg-stone-50 transition-colors border-b last:border-0 flex justify-between items-center"
                            onClick={() => handleSelectCustomer(c)}
                          >
                            <div>
                              <p className="font-bold text-stone-900">{c.fullName}</p>
                              <p className="text-xs text-muted-foreground">
                                {c.phone} • {c.totalOrders} ta buyurtma
                              </p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-stone-100 uppercase">
                              {c.region}
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 2: Products */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="w-5 h-5" /> Mahsulotlar
              </CardTitle>
              <div className="relative w-full sm:w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                <Input
                  placeholder="Qidirish va qo'shish..."
                  className="pl-8 h-10"
                  value={productSearch}
                  onChange={e => setProductSearch(e.target.value)}
                  onFocus={() => setIsProductListVisible(true)}
                />
                {isProductListVisible && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setIsProductListVisible(false)}
                    ></div>
                    <div className="absolute z-50 w-[400px] right-0 mt-2 bg-white border rounded-xl shadow-2xl overflow-hidden">
                      <div className="p-2 border-b bg-stone-50 text-[10px] font-bold text-stone-400 uppercase tracking-wider">
                        Mahsulotlar ({filteredProducts.length})
                      </div>
                      <div className="max-h-[400px] overflow-auto">
                        {isLoadingProducts ? (
                          <div className="p-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" /> Yuklanmoqda...
                          </div>
                        ) : filteredProducts.length === 0 ? (
                          <div className="p-8 text-center text-sm text-muted-foreground italic">
                            Mahsulot topilmadi
                          </div>
                        ) : (
                          filteredProducts.map((p: any) => {
                            const isAdded = items.some(i => i.productId === p.id);
                            return (
                              <button
                                key={p.id}
                                type="button"
                                disabled={isAdded}
                                className={`w-full p-3 text-left hover:bg-stone-50 transition-colors border-b last:border-0 flex items-center gap-3 ${isAdded ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={() => handleAddProduct(p)}
                              >
                                <img
                                  src={p.imageUrls[0]}
                                  className="w-10 h-10 rounded object-cover border"
                                />
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-medium text-stone-900 truncate">
                                    {p.name}{' '}
                                    {isAdded && (
                                      <span className="text-[10px] text-primary ml-1">
                                        (Qo'shilgan)
                                      </span>
                                    )}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground flex items-center gap-2">
                                    <span>{p.barcode}</span>
                                    <span>•</span>
                                    <span>Stock: {p.totalStock} ta</span>
                                    <span>•</span>
                                    <span className="font-bold text-stone-700">
                                      {Number(p.korRetail || 0).toLocaleString()} ₩
                                    </span>
                                  </p>
                                </div>
                              </button>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {form.formState.errors.items && (
                <p className="text-sm text-red-600 mb-4 font-medium">
                  Kamida bitta mahsulot qo'shilishi shart
                </p>
              )}
              {items.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground bg-stone-50/50">
                  <div className="flex flex-col items-center gap-2">
                    <Plus className="w-8 h-8 opacity-20" />
                    <p className="text-sm">Hali mahsulot tanlanmagan. Tepadan qidirib qo'shing.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="overflow-x-auto">
                    <Table className="min-w-[600px]">
                      <TableHeader>
                        <TableRow>
                          <TableHead>Mahsulot</TableHead>
                          <TableHead className="w-24 text-center">Soni</TableHead>
                          <TableHead className="w-40 text-right">Kelishilgan narx</TableHead>
                          <TableHead className="w-40 text-right">Jami</TableHead>
                          <TableHead className="w-10"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map(item => (
                          <TableRow key={item.productId} className="group">
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <img
                                  src={item.image}
                                  className="w-10 h-10 rounded object-cover border"
                                />
                                <div className="min-w-0">
                                  <p className="font-medium text-sm truncate max-w-[200px]">
                                    {item.name}
                                  </p>
                                  {item.quantity > item.availableStock ? (
                                    <p className="text-[10px] text-orange-600 font-bold flex items-center gap-1 mt-0.5">
                                      <AlertTriangle className="w-3 h-3" /> Faqat{' '}
                                      {item.availableStock} ta bor
                                    </p>
                                  ) : (
                                    <p className="text-[10px] text-muted-foreground mt-0.5">
                                      Zaxirada: {item.availableStock} ta
                                    </p>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <NumberInput
                                className="h-9 text-center bg-white"
                                value={item.quantity}
                                onChange={v => updateItemQty(item.productId, v ?? 0)}
                                allowDecimals={false}
                              />
                            </TableCell>
                            <TableCell>
                              <div className="relative">
                                <NumberInput
                                  className="h-9 text-right pr-7 bg-white font-mono"
                                  value={item.negotiatedPriceKrw}
                                  onChange={v => updateItemPrice(item.productId, v ?? 0)}
                                  allowDecimals={false}
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                                  ₩
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-bold text-stone-900 font-mono">
                              {(
                                (item.negotiatedPriceKrw || 0) * (item.quantity || 0)
                              ).toLocaleString()}{' '}
                              ₩
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-stone-300 hover:text-destructive transition-colors"
                                onClick={() => removeItem(item.productId)}
                              >
                                <Trash className="w-4 h-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  <div className="flex justify-between items-center p-5 bg-stone-900 rounded-xl text-white">
                    <span className="text-sm font-medium uppercase tracking-widest opacity-60">
                      Subtotal:
                    </span>
                    <span className="text-2xl font-bold font-mono">
                      {(subtotal || 0).toLocaleString()} ₩
                    </span>
                  </div>

                  {stockWarnings.length > 0 && (
                    <div className="flex items-center space-x-3 px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                      <Checkbox
                        id="forceCreate"
                        checked={isForceCreate}
                        onCheckedChange={checked => setIsForceCreate(checked as boolean)}
                      />
                      <label
                        htmlFor="forceCreate"
                        className="text-sm font-medium leading-none cursor-pointer text-amber-900"
                      >
                        Zaxira yetishmasligiga qaramay davom etish
                      </label>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* SECTION 3: Delivery */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="w-5 h-5" /> Yetkazib berish
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="deliveryAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Yetkazib berish manzili</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="To'liq manzil..."
                        className="min-h-[100px] bg-stone-50/50"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t">
                <FormField
                  control={form.control}
                  name="deliveryFeeCoveredBy"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel className="text-base">Xarajatni kim qoplaydi?</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={val => {
                            field.onChange(val);
                            if (val === 'BUSINESS') {
                              form.setValue('deliveryFeeCharged', 0);
                            } else {
                              form.setValue('deliveryFeeCharged', 0);
                              form.setValue('deliveryFeeActual', 0);
                            }
                          }}
                          defaultValue={field.value}
                          className="flex flex-col space-y-2"
                        >
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-xl hover:bg-stone-50 transition-colors cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="CUSTOMER" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1">
                              Mijoz to'laydi
                            </FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-3 space-y-0 p-3 border rounded-xl hover:bg-orange-50/50 border-orange-100 transition-colors cursor-pointer">
                            <FormControl>
                              <RadioGroupItem value="BUSINESS" />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer flex-1 text-orange-700 font-medium">
                              Biz to'laymiz (Biznes qoplaydi)
                            </FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  {deliveryFeeCoveredBy === 'CUSTOMER' ? (
                    <FormField
                      control={form.control}
                      name="deliveryFeeCharged"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Yetkazib berish narxi (Mijoz to'laydi)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <NumberInput
                                className="h-12 text-lg font-mono"
                                value={field.value as number}
                                onChange={v => {
                                  const val = v ?? 0;
                                  field.onChange(val);
                                  form.setValue('deliveryFeeActual', val);
                                }}
                                allowDecimals={false}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">
                                ₩
                              </span>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ) : (
                    <FormField
                      control={form.control}
                      name="deliveryFeeActual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Haqiqiy yetkazib berish narxi (Biznes qoplaydi)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <NumberInput
                                className="h-12 text-lg font-mono"
                                value={field.value as number}
                                onChange={v => field.onChange(v ?? 0)}
                                allowDecimals={false}
                              />
                              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xl font-bold text-stone-400">
                                ₩
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription className="text-orange-600 font-bold italic text-xs">
                            💡 Bu xarajat hisobot qilishda chiqim sifatida ko'rinadi
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SECTION 4: Summary + Notes */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="w-5 h-5" /> Qo'shimcha
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FormField
                  control={form.control}
                  name="adminNotes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Admin izohi (faqat ichki foydalanish uchun)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Masalan: Telegram @username orqali kelishildi..."
                          className="min-h-[120px] bg-stone-50/50"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2 text-primary">
                  <CreditCard className="w-5 h-5" /> Xulosa
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Mahsulotlar:</span>
                    <span className="font-medium font-mono">
                      {(subtotal || 0).toLocaleString()} ₩
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Yetkazib berish:</span>
                    <span className="font-medium font-mono">
                      +{(deliveryFeeCharged || 0).toLocaleString()} ₩
                    </span>
                  </div>
                  {deliveryFeeCoveredBy === 'BUSINESS' && (
                    <div className="flex justify-between italic text-stone-500 text-[11px] pt-1 border-t">
                      <span>Biznes xarajati:</span>
                      <span className="font-mono">
                        {(deliveryFeeActual || 0).toLocaleString()} ₩
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t-2 border-primary/20 flex justify-between items-center">
                  <span className="font-black text-stone-900 uppercase text-xs tracking-widest">
                    JAMI:
                  </span>
                  <span className="text-3xl font-black text-primary font-mono tracking-tighter">
                    {(total || 0).toLocaleString()} ₩
                  </span>
                </div>
              </CardContent>
              <CardFooter className="pt-2">
                <Button
                  type="submit"
                  className="w-full h-14 text-xl font-black shadow-xl"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Yaratilmoqda...
                    </>
                  ) : (
                    'BUYURTMA YARATISH'
                  )}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </form>
      </Form>
    </div>
  );
}
