import { useAuthStore } from '../../stores/auth.store';
import { api } from '@/lib/api';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { couponsApi } from './api/coupons.api';
import { useNavigate, useParams } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, Save, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import { tiyinToSom, somToTiyin } from '@/lib/currency';

export function CouponFormPage() {
  const { id } = useParams({ strict: false }) as { id?: string };
  const isEdit = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: existingCoupon, isLoading: isFetching } = useQuery({
    queryKey: ['coupons', id],
    queryFn: () => couponsApi.getById(id!),
    enabled: isEdit,
  });

  const [form, setForm] = React.useState<any>({
    code: '',
    name: '',
    description: '',
    type: 'PERCENTAGE',
    value: '0',
    value_uzs: '',
    value_krw: '',
    maxDiscountCap: '',
    max_discount_uzs: '',
    max_discount_krw: '',
    scope: 'ENTIRE_ORDER',
    applicableResourceIds: [],
    applicableBrands: [],
    minOrderAmount: '0',
    min_order_uzs: '',
    min_order_krw: '',
    minOrderQty: 1,
    regionCode: 'ALL',
    firstOrderOnly: false,
    onePerCustomer: true,
    excludeWholesale: false,
    targetCustomerIds: [],
    startsAt: '',
    expiresAt: '',
    maxUsesTotal: '',
    maxUsesPerCustomer: 1,
    autoApply: false,
    isStackable: false,
    isPromotional: false,
    isFirstPurchaseOnly: false,
    promoDisplayText: '',
    status: 'DRAFT',
  });

  const [allProducts, setAllProducts] = React.useState<any[]>([]);
  const [productSearch, setProductSearch] = React.useState('');
  const [showProductDropdown, setShowProductDropdown] = React.useState(false);
  const [selectedProducts, setSelectedProducts] = React.useState<{id: string, name: string, barcode: string}[]>([]);
  
  const [allCategories, setAllCategories] = React.useState<any[]>([]);
  const [selectedCategories, setSelectedCategories] = React.useState<{id: string, name: string}[]>([]);
  
  const [allBrands, setAllBrands] = React.useState<string[]>([]);
  
  const [customerSearch, setCustomerSearch] = React.useState('');
  const [customerResults, setCustomerResults] = React.useState<any[]>([]);
  const [selectedCustomers, setSelectedCustomers] = React.useState<{id: string, name: string, telegramUsername?: string}[]>([]);
  const [loadingCustomers, setLoadingCustomers] = React.useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = React.useState(false);

  const token = useAuthStore((s: any) => s.token);
  
  const customerScope = (form.targetCustomerIds && form.targetCustomerIds.length > 0) ? 'SPECIFIC' : 'ALL';

  // Fetch Data on Scope Change
  React.useEffect(() => {
    if (form.scope === 'BRANDS') {
      fetch(`/products/brands`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()).then(data => setAllBrands(data || []));
    }
    if (form.scope === 'PRODUCTS' && allProducts.length === 0) {
      fetch(`/products?limit=200`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()).then(data => setAllProducts(Array.isArray(data) ? data : data.items || data.products || []));
    }
    if (form.scope === 'CATEGORIES' && allCategories.length === 0) {
      fetch(`/categories`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(res => res.json()).then(data => setAllCategories(data.data || data || []));
    }
  }, [form.scope, token, allProducts.length, allCategories.length]);

  const filteredProducts = React.useMemo(() => {
    if (!productSearch) return [];
    const q = productSearch.toLowerCase();
    return allProducts
      .filter(p => 
        (p.name?.toLowerCase().includes(q) || 
         p.barcode?.toLowerCase().includes(q) || 
         p.sku?.toLowerCase().includes(q)) &&
        !selectedProducts.find(s => s.id === p.id)
      )
      .slice(0, 10);
  }, [allProducts, productSearch, selectedProducts]);

  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (customerScope === 'SPECIFIC') {
        setLoadingCustomers(true);
        fetch(`/orders/customers/search?q=${customerSearch}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
          setCustomerResults(Array.isArray(data) ? data : data.items || []);
          setLoadingCustomers(false);
        })
        .catch(() => setLoadingCustomers(false));
      } else {
        setCustomerResults([]);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch, customerScope, token]);

  React.useEffect(() => {
    if (existingCoupon) {
      const region = existingCoupon.regionCode || 'ALL';
      const toUIValue = (dbVal: any, forceRegion?: 'UZB' | 'KOR') => {
          if (!dbVal && dbVal !== 0n && dbVal !== 0) return '';
          const targetRegion = forceRegion || region;
          return targetRegion === 'UZB' ? tiyinToSom(dbVal).toString() : dbVal.toString();
      };
      
      setForm({
        ...existingCoupon,
        regionCode: region,
        value: existingCoupon.type === 'PERCENTAGE' ? existingCoupon.value?.toString() : toUIValue(existingCoupon.value),
        value_uzs: toUIValue(existingCoupon.valueUzs, 'UZB'),
        value_krw: toUIValue(existingCoupon.valueKrw, 'KOR'),
        maxDiscountCap: existingCoupon.type === 'PERCENTAGE' ? toUIValue(existingCoupon.maxDiscountCap) : '',
        max_discount_uzs: toUIValue(existingCoupon.maxDiscountUzs, 'UZB'),
        max_discount_krw: toUIValue(existingCoupon.maxDiscountKrw, 'KOR'),
        minOrderAmount: toUIValue(existingCoupon.minOrderAmount),
        min_order_uzs: toUIValue(existingCoupon.minOrderUzs, 'UZB'),
        min_order_krw: toUIValue(existingCoupon.minOrderKrw, 'KOR'),
        startsAt: existingCoupon.startsAt ? new Date(existingCoupon.startsAt).toISOString().split('T')[0] : '',
        expiresAt: existingCoupon.expiresAt ? new Date(existingCoupon.expiresAt).toISOString().split('T')[0] : '',
        maxUsesTotal: existingCoupon.maxUsesTotal || '',
        isPromotional: existingCoupon.isPromotional ?? false,
        isFirstPurchaseOnly: existingCoupon.isFirstPurchaseOnly ?? false,
        promoDisplayText: existingCoupon.promoDisplayText || '',
      });

      // Load names for resources
      if (existingCoupon.applicableResourceIds?.length) {
        if (existingCoupon.scope === 'PRODUCTS') {
          Promise.all(existingCoupon.applicableResourceIds.map((id: string) => 
            api.get(`/products/${id}`)
          )).then(res => setSelectedProducts(res.map((p: any) => ({ id: p.id, name: p.name, barcode: p.barcode }))));
        } else if (existingCoupon.scope === 'CATEGORIES') {
           Promise.all(existingCoupon.applicableResourceIds.map((id: string) => 
            api.get<any>(`/categories/${id}`)
          )).then(res => setSelectedCategories(res.map((c: any) => ({ id: c.id, name: c.name }))));
        }
      }

      if (existingCoupon.targetCustomerIds?.length) {
        Promise.all(existingCoupon.targetCustomerIds.map((id: string) => 
          api.get(`/customers/${id}`)
        )).then(res => setSelectedCustomers(res.map((c: any) => ({ 
          id: c.id, 
          name: c.fullName || 'Nomsiz',
          telegramUsername: c.telegramUsername 
        }))));
      }
    }
  }, [existingCoupon, token]);

  const mutation = useMutation({
    mutationFn: (data: any) => {
        const region = data.regionCode;

        // Validation: ensure value is specified and positive
        if (region === 'ALL') {
          if (data.type === 'PERCENTAGE') {
            if (!data.value || Number(data.value) <= 0) {
              throw new Error("Chegirma foizi kiritilishi shart");
            }
          } else {
            if ((!data.value_uzs || Number(data.value_uzs) <= 0) && (!data.value_krw || Number(data.value_krw) <= 0)) {
              throw new Error("Kamida bitta mintaqa uchun chegirma summasi kiritilishi shart");
            }
          }
        } else {
          if (!data.value || Number(data.value) <= 0) {
            throw new Error("Chegirma qiymati kiritilishi shart");
          }
        }

        const toDbValue = (uiVal: string, forceRegion?: 'UZB' | 'KOR') => {
            if (!uiVal) return null;
            const targetRegion = forceRegion || region;
            return targetRegion === 'UZB' ? somToTiyin(parseFloat(uiVal)).toString() : uiVal;
        };

        const payload = {
            ...data,
            value: data.type === 'PERCENTAGE' ? data.value.toString() : (region === 'ALL' ? '0' : toDbValue(data.value)),
            valueUzs: region === 'ALL' && data.type !== 'PERCENTAGE' ? toDbValue(data.value_uzs, 'UZB') : null,
            valueKrw: region === 'ALL' && data.type !== 'PERCENTAGE' ? toDbValue(data.value_krw, 'KOR') : null,
            maxDiscountCap: region === 'ALL' ? null : (data.type === 'PERCENTAGE' ? toDbValue(data.maxDiscountCap) : null),
            maxDiscountUzs: region === 'ALL' && data.type === 'PERCENTAGE' ? toDbValue(data.max_discount_uzs, 'UZB') : null,
            maxDiscountKrw: region === 'ALL' && data.type === 'PERCENTAGE' ? toDbValue(data.max_discount_krw, 'KOR') : null,
            minOrderAmount: region === 'ALL' ? '0' : (toDbValue(data.minOrderAmount) || '0'),
            minOrderUzs: region === 'ALL' ? (toDbValue(data.min_order_uzs, 'UZB') || '0') : null,
            minOrderKrw: region === 'ALL' ? (toDbValue(data.min_order_krw, 'KOR') || '0') : null,
            regionCode: region === 'ALL' ? null : region,
            startsAt: data.startsAt ? new Date(data.startsAt).toISOString() : null,
            expiresAt: data.expiresAt ? new Date(data.expiresAt).toISOString() : null,
            maxUsesTotal: data.maxUsesTotal ? parseInt(data.maxUsesTotal) : null,
            excludeWholesale: data.excludeWholesale || false,
            isPromotional: data.isPromotional ?? false,
            isFirstPurchaseOnly: data.isFirstPurchaseOnly ?? false,
            promoDisplayText: data.isPromotional ? (data.promoDisplayText || null) : null,
            applicableResourceIds: 
              data.scope === 'PRODUCTS' ? selectedProducts.map(p => p.id) : 
              data.scope === 'CATEGORIES' ? selectedCategories.map(c => c.id) : 
              null,
            applicableBrands: data.scope === 'BRANDS' ? data.applicableBrands : null,
            targetCustomerIds: selectedCustomers.length > 0 ? selectedCustomers.map(c => c.id) : null,
        };
        return isEdit ? couponsApi.update(id!, payload) : couponsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success(isEdit ? "Kupon yangilandi" : "Kupon yaratildi");
      navigate({ to: '/coupons' } as any);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  if (isFetching) return <div className="p-6">Yuklanmoqda...</div>;

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/coupons' } as any)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">
            {isEdit ? `Tahrirlash: ${form.code}` : 'Yangi kupon'}
        </h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {/* Section 1: Basic Info */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Asosiy ma'lumotlar</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Promo-kod</Label>
                  <Input 
                    placeholder="MASALAN: YANGI2024" 
                    value={form.code}
                    onChange={e => setForm({...form, code: e.target.value.toUpperCase()})}
                    disabled={isEdit}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nomi</Label>
                  <Input 
                    placeholder="Kupon nomi" 
                    value={form.name}
                    onChange={e => setForm({...form, name: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Tavsif</Label>
                <Input 
                  placeholder="Mijozlarga ko'rinadigan tavsif" 
                  value={form.description}
                  onChange={e => setForm({...form, description: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Discount Settings */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Chegirma sozlamalari</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Turi</Label>
                  <Select value={form.type} onValueChange={v => setForm({...form, type: v, value: v === 'FREE_SHIPPING' ? '0' : form.value})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Foiz (%)</SelectItem>
                      <SelectItem value="FIXED">Fiksirlangan summa</SelectItem>
                      <SelectItem value="FREE_SHIPPING">Bepul yetkazib berish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {form.type !== 'FREE_SHIPPING' && (
                  form.regionCode === 'ALL' && form.type === 'FIXED' ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Chegirma summasi (so'm) — O'zbekiston</Label>
                        <Input
                          type="number"
                          value={form.value_uzs || ''}
                          onChange={e => setForm({...form, value_uzs: e.target.value})}
                          placeholder="Masalan: 50000"
                        />
                        <p className="text-xs text-stone-400">
                          Mijoz so'mda ko'radi.
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Chegirma summasi (₩) — Koreya</Label>
                        <Input
                          type="number"
                          value={form.value_krw || ''}
                          onChange={e => setForm({...form, value_krw: e.target.value})}
                          placeholder="Masalan: 5000"
                        />
                        <p className="text-xs text-stone-400">
                          Mijoz vonda ko'radi.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label>
                        {form.type === 'PERCENTAGE' 
                          ? 'Foiz (%)' 
                          : `Chegirma summasi (${form.regionCode === 'UZB' ? "so'm" : form.regionCode === 'KOR' ? '₩' : 'KRW'})`}
                      </Label>
                      <Input 
                        type="number"
                        value={form.value}
                        onChange={e => setForm({...form, value: e.target.value})}
                      />
                    </div>
                  )
                )}
              </div>
              {form.type === 'PERCENTAGE' && (
                form.regionCode === 'ALL' ? (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Maks. chegirma limiti (so'm) — UZB</Label>
                      <Input 
                        type="number"
                        placeholder="Limitsiz"
                        value={form.max_discount_uzs || ''}
                        onChange={e => setForm({...form, max_discount_uzs: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Maks. chegirma limiti (₩) — KOR</Label>
                      <Input 
                        type="number"
                        placeholder="Limitsiz"
                        value={form.max_discount_krw || ''}
                        onChange={e => setForm({...form, max_discount_krw: e.target.value})}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>
                      Maksimal chegirma limiti ({form.regionCode === 'UZB' ? "so'm" : form.regionCode === 'KOR' ? '₩' : 'KRW'})
                    </Label>
                    <Input 
                      type="number"
                      placeholder="Limitsiz"
                      value={form.maxDiscountCap}
                      onChange={e => setForm({...form, maxDiscountCap: e.target.value})}
                    />
                  </div>
                )
              )}
            </CardContent>
          </Card>

          {/* Section 4: Scope */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Qo'llanish doirasi</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <RadioGroup 
                    value={form.scope} 
                    onValueChange={(v: string) => {
                      setForm({...form, scope: v, applicableResourceIds: [], applicableBrands: []});
                      setSelectedProducts([]);
                      setSelectedCategories([]);
                      setProductSearch('');
                    }}
                    className="flex flex-col gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ENTIRE_ORDER" id="s1" />
                    <Label htmlFor="s1">Butun buyurtma (Odatiy)</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="PRODUCTS" id="s2" />
                    <Label htmlFor="s2">Maxsus mahsulotlar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="CATEGORIES" id="s3" />
                    <Label htmlFor="s3">Kategoriyalar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="BRANDS" id="s4" />
                    <Label htmlFor="s4">Brendlar</Label>
                  </div>
                </RadioGroup>
              </div>

              {form.scope === 'PRODUCTS' && (
                <div className="space-y-3 pt-2">
                  <Label>Mahsulotlarni qidirish</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Nomi, barkodi yoki SKU bo'yicha qidiring..." 
                      value={productSearch}
                      onChange={e => setProductSearch(e.target.value)}
                      onFocus={() => setShowProductDropdown(true)}
                      onBlur={() => setTimeout(() => setShowProductDropdown(false), 200)}
                    />
                    
                    {showProductDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-100 rounded-xl shadow-lg overflow-hidden z-10 max-h-64 overflow-y-auto">
                        {allProducts.length === 0 && (
                          <div className="px-4 py-3 text-sm text-stone-400">Mahsulotlar yuklanmoqda...</div>
                        )}
                        
                        {allProducts.length > 0 && filteredProducts.length === 0 && (
                          <div className="px-4 py-3 text-sm text-stone-400 italic">
                            {productSearch ? 'Mahsulot topilmadi' : 'Qidirish uchun yozing...'}
                          </div>
                        )}

                        {filteredProducts.map(p => (
                          <div 
                            key={p.id}
                            className="px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50 cursor-pointer transition-colors"
                            onClick={() => {
                              setSelectedProducts([...selectedProducts, { id: p.id, name: p.name, barcode: p.barcode }]);
                              setProductSearch('');
                            }}
                          >
                            <div className="text-sm font-medium text-[#3A0311]">{p.name}</div>
                            <div className="text-[10px] text-stone-400 mt-0.5 uppercase flex gap-3">
                              <span>BARKOD: {p.barcode}</span>
                              <span>OMBORDA: {p.totalStock} ta</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-2 bg-pink-50 text-pink-800 px-3 py-1.5 rounded-full text-xs border border-pink-100">
                        <span className="font-semibold">{p.name}</span>
                        <span className="text-pink-400 opacity-80">{p.barcode}</span>
                        <button 
                          type="button"
                          onClick={() => setSelectedProducts(selectedProducts.filter(sp => sp.id !== p.id))} 
                          className="hover:text-pink-600 transition-colors ml-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedProducts.length === 0 && (
                    <p className="text-[11px] text-stone-400 italic">Hech narsa tanlanmagan</p>
                  )}
                </div>
              )}

              {form.scope === 'CATEGORIES' && (
                <div className="space-y-3 pt-2">
                  <Label>Kategoriyalarni tanlang</Label>
                  <div className="flex flex-wrap gap-2">
                    {allCategories.map(cat => {
                      const isSelected = selectedCategories.find(s => s.id === cat.id);
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setSelectedCategories(selectedCategories.filter(s => s.id !== cat.id));
                            } else {
                              setSelectedCategories([...selectedCategories, { id: cat.id, name: cat.name }]);
                            }
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            isSelected 
                              ? 'bg-[#E30B5C] text-white border-[#E30B5C] shadow-sm' 
                              : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {cat.name} {isSelected && '✓'}
                        </button>
                      );
                    })}
                  </div>
                  {selectedCategories.length === 0 && (
                    <p className="text-[11px] text-stone-400 italic">Hech narsa tanlanmagan</p>
                  )}
                  {selectedCategories.length > 0 && (
                    <p className="text-[11px] text-[#E30B5C] font-medium">{selectedCategories.length} ta kategoriya tanlandi</p>
                  )}
                </div>
              )}

              {form.scope === 'BRANDS' && (
                <div className="space-y-3 pt-2">
                  <Label>Brendlarni tanlang</Label>
                  <div className="flex flex-wrap gap-2">
                    {allBrands.map(brand => {
                      const isSelected = form.applicableBrands?.includes(brand);
                      return (
                        <button
                          key={brand}
                          type="button"
                          onClick={() => {
                            const current = form.applicableBrands || [];
                            const next = isSelected ? current.filter((b: string) => b !== brand) : [...current, brand];
                            setForm({...form, applicableBrands: next});
                          }}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all border ${
                            isSelected 
                              ? 'bg-[#E30B5C] text-white border-[#E30B5C] shadow-sm' 
                              : 'bg-stone-50 text-stone-600 border-stone-200 hover:border-stone-300'
                          }`}
                        >
                          {brand} {isSelected && '✓'}
                        </button>
                      );
                    })}
                    {allBrands.length === 0 && (
                       <span className="text-sm text-stone-400 italic">Brendlar topilmadi</span>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 5: Target Customers */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Mijozlar</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <RadioGroup 
                    value={customerScope} 
                    onValueChange={(v: string) => {
                      if (v === 'ALL') {
                        setForm({...form, targetCustomerIds: []});
                        setSelectedCustomers([]);
                      } else {
                        // Switch to SPECIFIC
                        setForm({...form, targetCustomerIds: ['TEMP_PENDING']}); 
                      }
                    }}
                    className="flex flex-col gap-3"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALL" id="c1" />
                    <Label htmlFor="c1">Barcha mijozlar</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="SPECIFIC" id="c2" />
                    <Label htmlFor="c2">Maxsus mijozlar</Label>
                  </div>
                </RadioGroup>
              </div>

              {customerScope === 'SPECIFIC' && (
                <div className="space-y-3 pt-2">
                  <Label>Mijoz qidirish</Label>
                  <div className="relative">
                    <Input 
                      placeholder="Ism, telefon yoki @username..." 
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      onFocus={() => setShowCustomerDropdown(true)}
                      onBlur={() => setTimeout(() => setShowCustomerDropdown(false), 200)}
                    />
                    
                    {showCustomerDropdown && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-100 rounded-xl shadow-lg overflow-hidden z-10 max-h-48 overflow-y-auto">
                        {loadingCustomers && (
                          <div className="px-4 py-3 text-sm text-stone-400 flex items-center gap-2">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Qidirilmoqda...
                          </div>
                        )}
                        
                        {!loadingCustomers && customerResults.length === 0 && (
                          <div className="px-4 py-3 text-sm text-stone-400 italic">
                            {customerSearch ? 'Mijoz topilmadi' : 'Qidirish uchun yozing...'}
                          </div>
                        )}

                        {!loadingCustomers && customerResults.map(c => {
                          const isSelected = selectedCustomers.some(sc => sc.id === c.id);
                          return (
                            <div 
                              key={c.id}
                              className={`px-4 py-3 border-b border-stone-50 last:border-0 flex justify-between items-center transition-colors ${
                                isSelected ? 'bg-stone-50 opacity-60 cursor-default' : 'hover:bg-stone-50 cursor-pointer'
                              }`}
                              onClick={() => {
                                if (!isSelected) {
                                  setSelectedCustomers([...selectedCustomers, { 
                                    id: c.id, 
                                    name: c.fullName || 'Nomsiz',
                                    telegramUsername: c.telegramUsername
                                  }]);
                                  setCustomerSearch('');
                                }
                              }}
                            >
                              <div>
                                <div className="text-sm font-medium text-[#3A0311]">{c.fullName || 'Nomsiz'}</div>
                                <div className="text-[11px] text-stone-400 mt-0.5">
                                  {c.phone || 'Telefon yo\'q'} {c.telegramUsername && ` • @${c.telegramUsername}`}
                                </div>
                              </div>
                              {isSelected && <span className="text-[10px] font-bold text-stone-400 uppercase">Tanlangan</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    {selectedCustomers.map(c => (
                      <div key={c.id} className="flex items-center gap-2 bg-pink-50 text-pink-800 px-3 py-1.5 rounded-full text-xs border border-pink-100">
                        <span className="font-semibold">{c.name}</span>
                        {c.telegramUsername && <span className="text-pink-400 opacity-80">@{c.telegramUsername}</span>}
                        <button 
                          type="button"
                          onClick={() => setSelectedCustomers(selectedCustomers.filter(sc => sc.id !== c.id))} 
                          className="hover:text-pink-600 transition-colors ml-1"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>

                  {selectedCustomers.length === 0 && (
                    <p className="text-[11px] text-stone-400 italic">Hech kim tanlanmagan — barcha mijozlarga qo'llanadi</p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Section 6: Conditions */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Shartlar</CardTitle></CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                {form.regionCode === 'ALL' ? (
                  <div className="space-y-4 col-span-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Minimal buyurtma summasi (so'm) — O'zbekiston</Label>
                        <Input 
                          type="number"
                          value={form.min_order_uzs || ''}
                          onChange={e => setForm({...form, min_order_uzs: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Minimal buyurtma summasi (₩) — Koreya</Label>
                        <Input 
                          type="number"
                          value={form.min_order_krw || ''}
                          onChange={e => setForm({...form, min_order_krw: e.target.value})}
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label>
                      Minimal buyurtma summasi ({form.regionCode === 'UZB' ? "so'm" : form.regionCode === 'KOR' ? '₩' : 'KRW'})
                    </Label>
                    <Input 
                      type="number"
                      value={form.minOrderAmount}
                      onChange={e => setForm({...form, minOrderAmount: e.target.value})}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Minimal mahsulot miqdori</Label>
                  <Input 
                    type="number"
                    value={form.minOrderQty}
                    onChange={e => setForm({...form, minOrderQty: parseInt(e.target.value) || 1})}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="firstOrder" 
                    checked={form.firstOrderOnly}
                    onCheckedChange={(v: boolean) => setForm({...form, firstOrderOnly: !!v})}
                  />
                  <Label htmlFor="firstOrder">Faqat birinchi xarid uchun</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="onePerUser" 
                    checked={form.onePerCustomer}
                    onCheckedChange={(v: boolean) => setForm({...form, onePerCustomer: !!v})}
                  />
                  <Label htmlFor="onePerUser">Har bir mijozga 1 marta</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="excludeWholesale" 
                    checked={form.excludeWholesale}
                    onCheckedChange={(v: boolean) => setForm({...form, excludeWholesale: !!v})}
                  />
                  <Label htmlFor="excludeWholesale">Ulgurji narxlarga qo'llanmaydi</Label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Mintaqa</Label>
                <RadioGroup 
                    value={form.regionCode} 
                    onValueChange={(v: string) => setForm({...form, regionCode: v})}
                    className="flex gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="ALL" id="r1" />
                    <Label htmlFor="r1">Barchasi</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="UZB" id="r2" />
                    <Label htmlFor="r2">O'zbekiston</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="KOR" id="r3" />
                    <Label htmlFor="r3">Koreya</Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Section: Promotional Banner */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Storefront banneri</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bannerda ko'rsatish</Label>
                  <p className="text-xs text-muted-foreground">Bu kuponni storefront sahifasida reklama sifatida ko'rsatish</p>
                </div>
                <Switch 
                  checked={form.isPromotional}
                  onCheckedChange={(v) => setForm({...form, isPromotional: v})}
                />
              </div>

              {form.isPromotional && (
                <>
                  <Separator className="my-2" />
                  
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>Faqat birinchi buyurtma uchun</Label>
                      <p className="text-xs text-muted-foreground">Faqat hech qachon buyurtma bermagan mijozlarga amal qiladi</p>
                    </div>
                    <Switch 
                      checked={form.isFirstPurchaseOnly}
                      onCheckedChange={(v) => setForm({...form, isFirstPurchaseOnly: v})}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Banner matni</Label>
                    <Input 
                      placeholder="Masalan: Birinchi buyurtmangizga 15% chegirma!"
                      value={form.promoDisplayText}
                      onChange={(e) => setForm({...form, promoDisplayText: e.target.value})}
                    />
                    <p className="text-[10px] text-muted-foreground italic">Bo'sh qoldirilsa kupon nomi ishlatiladi</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {/* Section 6: Schedule */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Vaqt va Limit</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Boshlanish sanasi</Label>
                <Input 
                  type="date" 
                  value={form.startsAt}
                  onChange={e => setForm({...form, startsAt: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Tugash sanasi</Label>
                <Input 
                  type="date" 
                  value={form.expiresAt}
                  onChange={e => setForm({...form, expiresAt: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Umumiy foydalanish limiti</Label>
                <Input 
                  type="number"
                  placeholder="Limitsiz"
                  value={form.maxUsesTotal}
                  onChange={e => setForm({...form, maxUsesTotal: e.target.value})}
                />
              </div>
            </CardContent>
          </Card>

          {/* Section 7: Options */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Holat</CardTitle></CardHeader>
            <CardContent className="space-y-4">
               <div className="space-y-2">
                  <Label>Status</Label>
                  <Select value={form.status} onValueChange={v => setForm({...form, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DRAFT">Qoralama (Draft)</SelectItem>
                      <SelectItem value="ACTIVE">Faol (Active)</SelectItem>
                      <SelectItem value="PAUSED">To'xtatilgan (Paused)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="autoApply" 
                    checked={form.autoApply}
                    onCheckedChange={(v: boolean) => setForm({...form, autoApply: !!v})}
                  />
                  <Label htmlFor="autoApply">Avtomatik qo'llash</Label>
                </div>
            </CardContent>
            <CardFooter className="pt-6">
              <Button 
                className="w-full" 
                onClick={() => mutation.mutate(form)}
                disabled={mutation.isPending}
              >
                {mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                {isEdit ? 'Yangilash' : 'Saqlash'}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
