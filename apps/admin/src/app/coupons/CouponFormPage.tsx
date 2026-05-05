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
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
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
    startsAt: '',
    expiresAt: '',
    maxUsesTotal: '',
    maxUsesPerCustomer: 1,
    autoApply: false,
    isStackable: false,
    status: 'DRAFT',
  });

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
      });
    }
  }, [existingCoupon]);

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
        };
        return isEdit ? couponsApi.update(id!, payload) : couponsApi.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupons'] });
      toast.success(isEdit ? "Kupon yangilandi" : "Kupon yaratildi");
      navigate({ to: '/coupons' } as any);
    },
    onError: (err: any) => toast.error(err.message),
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
                  <Select value={form.type} onValueChange={v => setForm({...form, type: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Foiz (%)</SelectItem>
                      <SelectItem value="FIXED">Fiksirlangan summa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {form.regionCode === 'ALL' && form.type === 'FIXED' ? (
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

          {/* Section 3: Conditions */}
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
