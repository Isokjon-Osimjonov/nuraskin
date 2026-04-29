import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createOrderSchema, type CreateOrderInput } from '@nuraskin/shared-types';
import { ordersApi } from './api/orders.api';
import { customersApi } from '../customers/api/customers.api';
import { productsApi, type ProductDetail, type ProductRegionalConfig } from '../products/api/products.api';
import { exchangeRatesApi } from '../exchange-rates/api/exchange-rates.api';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { ArrowLeft, Search, Plus, Trash, Package, Info } from 'lucide-react';

interface LocalOrderItem {
  productId: string;
  name: string;
  quantity: number;
  weightGrams: number;
  retailPrice: number;
  wholesalePrice: number;
  minWholesaleQty: number;
  estimatedUnitPrice: number;
  regionalConfigs?: ProductRegionalConfig[];
}

export function OrderCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [productSearch, setProductSearch] = React.useState('');
  const [selectedProductId, setSelectedProductId] = React.useState<string | null>(null);
  const [addQty, setAddQty] = React.useState(1);
  const [items, setItems] = React.useState<LocalOrderItem[]>([]);

  // 1. Data Fetching
  const { data: customersResponse } = useQuery({
    queryKey: ['customers'],
    queryFn: () => customersApi.getAll({ page: 1, limit: 100, region: 'ALL', status: 'all', debtStatus: 'ALL' }),
  });
  const customers = customersResponse?.data ?? [];

  const { data: searchResults = [] } = useQuery({
    queryKey: ['products', 'search', productSearch],
    queryFn: () => productsApi.getAll({ search: productSearch || undefined, isActive: true }),
    enabled: productSearch.length > 2,
  });

  const { data: latestRate } = useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: () => exchangeRatesApi.getLatest(),
  });

  const form = useForm<CreateOrderInput>({
    resolver: zodResolver(createOrderSchema as any) as any,
    defaultValues: {
      customerId: '',
      regionCode: 'UZB',
      currency: 'UZS',
      adminNote: '',
      items: [],
    },
  });

  const regionCode = form.watch('regionCode');
  const currency = form.watch('currency');

  // 2. Price Calculation Logic Overhaul
  const calculateEstimate = React.useCallback((p: ProductDetail | LocalOrderItem, qty: number) => {
    const configs = (p as any).regionalConfigs || [];
    const config = configs.find((c: ProductRegionalConfig) => c.regionCode === regionCode);
    if (!config) return 0;

    const baseKrw = qty >= (config.minWholesaleQty || 5)
      ? Number(BigInt(config.wholesalePrice))
      : Number(BigInt(config.retailPrice));

    if (regionCode === 'UZB') {
      if (!latestRate) return 0;
      const krwToUzs = latestRate.krwToUzs;
      const cargoRateKrw = latestRate.cargoRateKrwPerKg;
      const weightKg = (p.weightGrams || 0) / 1000;

      const productUzs = baseKrw * krwToUzs;
      const cargoUzs = weightKg * cargoRateKrw * krwToUzs;

      const roundedProduct = Math.round(productUzs / 1000) * 1000;
      const roundedCargo = Math.round(cargoUzs / 1000) * 1000;

      return roundedProduct + roundedCargo;
    }
    
    // KOR region direct KRW (rounded to 100)
    return Math.round(baseKrw / 100) * 100;
  }, [latestRate, regionCode]);

  // Recalculate all items when region changes
  React.useEffect(() => {
    if (items.length > 0) {
      const updated = items.map(item => ({
        ...item,
        estimatedUnitPrice: calculateEstimate(item, item.quantity)
      }));
      setItems(updated);
      
      // Update form currency when region changes
      form.setValue('currency', regionCode === 'UZB' ? 'UZS' : 'KRW');
    }
  }, [regionCode, latestRate, calculateEstimate, form]);

  // 3. Handlers
  const handleAddProduct = async () => {
    if (!selectedProductId) return;
    
    try {
      const p = await productsApi.getById(selectedProductId);
      const config = p.regionalConfigs.find(c => c.regionCode === regionCode);
      
      if (!config) {
        toast.error(`Mahsulot ushbu regionda mavjud emas: ${regionCode}`);
        return;
      }

      const existingIdx = items.findIndex(i => i.productId === p.id);
      let newItems = [];
      if (existingIdx > -1) {
        newItems = [...items];
        newItems[existingIdx].quantity += addQty;
        newItems[existingIdx].estimatedUnitPrice = calculateEstimate(p, newItems[existingIdx].quantity);
      } else {
        newItems = [...items, {
          productId: p.id,
          name: p.name,
          quantity: addQty,
          weightGrams: p.weightGrams,
          retailPrice: Number(BigInt(config.retailPrice)),
          wholesalePrice: Number(BigInt(config.wholesalePrice)),
          minWholesaleQty: config.minWholesaleQty || 5,
          estimatedUnitPrice: calculateEstimate(p, addQty),
          regionalConfigs: p.regionalConfigs
        }];
      }
      
      setItems(newItems);
      form.setValue('items', newItems.map(i => ({ productId: i.productId, quantity: i.quantity })), { shouldValidate: true });
      
      setProductSearch('');
      setSelectedProductId(null);
      setAddQty(1);
      toast.success('Mahsulot qo\'shildi');
    } catch (err) {
      toast.error('Mahsulot ma\'lumotlarini yuklashda xatolik');
    }
  };

  const removeProduct = (id: string) => {
    const newItems = items.filter(i => i.productId !== id);
    setItems(newItems);
    form.setValue('items', newItems.map(i => ({ productId: i.productId, quantity: i.quantity })), { shouldValidate: true });
  };

  const createMutation = useMutation({
    mutationFn: ordersApi.create,
    onSuccess: (order) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      toast.success('Buyurtma yaratildi');
      navigate({ to: '/orders/$orderId', params: { orderId: order.id } });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Xatolik yuz berdi');
    },
  });

  const onSubmit = (data: CreateOrderInput) => {
    if (items.length === 0) {
      toast.error('Kamida bitta mahsulot qo\'shing');
      return;
    }
    createMutation.mutate(data);
  };

  // 4. Summary Calculations
  const grandTotal = items.reduce((acc, i) => acc + (i.estimatedUnitPrice * i.quantity), 0);
  const totalWeightGrams = items.reduce((acc, i) => acc + (i.weightGrams * i.quantity), 0);

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/orders' })}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Yangi buyurtma</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Buyurtma ma'lumotlari</CardTitle></CardHeader>
            <CardContent>
              <Form {...form}>
                <form className="space-y-4">
                  <FormField
                    control={form.control}
                    name="customerId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Mijoz</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger><SelectValue placeholder="Mijozni tanlang" /></SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {customers.map((c) => (
                              <SelectItem key={c.id} value={c.id}>
                                {c.fullName} {c.phone ? `(${c.phone})` : ''}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="regionCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Region</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Region" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UZB">O'zbekiston</SelectItem>
                              <SelectItem value="KOR">Koreya</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="currency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valyuta</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger><SelectValue placeholder="Valyuta" /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="UZS">UZS</SelectItem>
                              <SelectItem value="KRW">KRW</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>

          {/* Product Selection Section */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Mahsulotlar qo'shish</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4 items-end">
                <div className="flex-1 space-y-2 relative">
                  <Label>Mahsulot qidirish</Label>
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Nomi yoki barkod..."
                      className="pl-8"
                      value={productSearch}
                      onChange={(e) => {
                          setProductSearch(e.target.value);
                          if (selectedProductId) setSelectedProductId(null);
                      }}
                    />
                  </div>
                  {searchResults.length > 0 && productSearch && !selectedProductId && (
                    <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between text-sm"
                          onClick={() => {
                            setSelectedProductId(p.id);
                            setProductSearch(p.name);
                          }}
                        >
                          <span className="truncate mr-2 font-medium">{p.name}</span>
                          <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full whitespace-nowrap">
                            Stock: {p.totalStock}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="w-24 space-y-2">
                  <Label>Miqdor</Label>
                  <Input 
                    type="number" 
                    min="1" 
                    value={addQty} 
                    onChange={e => setAddQty(parseInt(e.target.value) || 1)} 
                  />
                </div>
                <Button onClick={handleAddProduct} disabled={!selectedProductId}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Items Table */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Mahsulot</TableHead>
                      <TableHead className="text-center">Soni</TableHead>
                      <TableHead className="text-right">Birlik narx (est)</TableHead>
                      <TableHead className="text-right">Jami</TableHead>
                      <TableHead className="w-10"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                          Hali mahsulot qo'shilmadi
                        </TableCell>
                      </TableRow>
                    ) : (
                      items.map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell className="font-medium">{item.name}</TableCell>
                          <TableCell className="text-center">{item.quantity}</TableCell>
                          <TableCell className="text-right whitespace-nowrap">
                            {item.estimatedUnitPrice.toLocaleString()} {currency}
                          </TableCell>
                          <TableCell className="text-right font-bold whitespace-nowrap">
                            {(item.estimatedUnitPrice * item.quantity).toLocaleString()} {currency}
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8 text-destructive"
                              onClick={() => removeProduct(item.productId)}
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Order Summary Side Card */}
        <div className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader><CardTitle className="text-lg">Xulosa</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="pt-2 border-t flex justify-between items-center">
                <span className="font-bold uppercase tracking-wider text-xs text-muted-foreground">Umumiy summa:</span>
                <span className="text-2xl font-black text-primary">
                  {grandTotal.toLocaleString()} {currency}
                </span>
              </div>
              
              <div className="flex items-start gap-2 p-3 bg-blue-50 text-blue-700 rounded-xl text-[11px] leading-relaxed">
                <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <b>Diqqat:</b> Narxlar {latestRate ? `1 KRW = ${latestRate.krwToUzs} UZS` : 'joriy'} kurs 
                  va mahsulot og'irligi asosida avtomatik hisoblandi. 
                  {regionCode === 'UZB' && " UZB uchun kargo narxi mahsulot ichiga kiritilgan."}
                </div>
              </div>

              <div className="pt-2">
                <Label>Admin izohi</Label>
                <Textarea 
                  placeholder="Ixtiyoriy izoh..." 
                  className="mt-1 bg-white"
                  {...form.register('adminNote')}
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                className="w-full h-12 text-lg font-bold" 
                onClick={form.handleSubmit(onSubmit)}
                disabled={createMutation.isPending || items.length === 0}
              >
                {createMutation.isPending ? 'Yaratilmoqda...' : 'Buyurtma yaratish'}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader className="py-3"><CardTitle className="text-sm flex items-center gap-2"><Package className="h-4 w-4" /> Logistika</CardTitle></CardHeader>
            <CardContent className="text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Region:</span>
                <span className="font-bold">{regionCode === 'UZB' ? "O'zbekiston 🇺🇿" : "Koreya 🇰🇷"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Umumiy og'irlik:</span>
                <span className="font-bold">{(totalWeightGrams / 1000).toFixed(2)} kg</span>
              </div>
              {latestRate && regionCode === 'UZB' && (
                <div className="flex justify-between text-muted-foreground pt-2 border-t mt-2 pt-2">
                  <span>Kurs (1 KRW):</span>
                  <span>{latestRate.krwToUzs} UZS</span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
