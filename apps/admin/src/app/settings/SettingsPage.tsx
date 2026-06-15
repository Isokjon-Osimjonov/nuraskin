import { queryKeys, tiyinToSom } from '@nuraskin/shared-utils';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { type UpdateSettingsInput } from '@nuraskin/shared-types';
import { settingsApi } from './api/settings.api';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { UZ, translateServerError } from '@/lib/uz';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [formData, setFormData] = React.useState<Partial<UpdateSettingsInput>>({});
  const [formLoaded, setFormLoaded] = React.useState(false);
  const [isDirty, setIsDirty] = React.useState(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => settingsApi.get(),
  });

  React.useEffect(() => {
    if (settings && !formLoaded) {
      setFormData({
        debtLimitDefault: Number(BigInt(settings.debtLimitDefault)),
        lowStockThreshold: settings.lowStockThreshold,
        adminCardNumber: settings.adminCardNumber || '',
        adminCardHolder: settings.adminCardHolder || '',
        adminCardBank: settings.adminCardBank || '',
        minOrderUzbUzs: tiyinToSom(settings.minOrderUzbUzs as any),
        minOrderKorKrw: Number(BigInt(settings.minOrderKorKrw)),
        paymentTimeoutMinutes: settings.paymentTimeoutMinutes,
        korBankEnabled: settings.korBankEnabled ?? false,
        korBankName: settings.korBankName || '',
        korBankHolder: settings.korBankHolder || '',
        korBankNumber: settings.korBankNumber || '',
        korE9payEnabled: settings.korE9payEnabled ?? false,
        korE9payName: settings.korE9payName || '',
        korE9payAccount: settings.korE9payAccount || '',
        uzbBankEnabled: settings.uzbBankEnabled ?? false,
        uzbBankName: settings.uzbBankName || '',
        uzbBankHolder: settings.uzbBankHolder || '',
        uzbBankNumber: settings.uzbBankNumber || '',
        uzbE9payEnabled: settings.uzbE9payEnabled ?? false,
        uzbE9payName: settings.uzbE9payName || '',
        uzbE9payAccount: settings.uzbE9payAccount || '',
      });
      setFormLoaded(true);
    }
  }, [settings, formLoaded]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: queryKeys.settings.all() }).then(() => {
        setFormLoaded(false);
        setIsDirty(false);
        toast.success(UZ.settings.saved);
      });
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(translateServerError(msg));
    },
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData as UpdateSettingsInput);
  };

  const updateField = (key: keyof UpdateSettingsInput, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  if (isLoading) return <div className="p-6">{UZ.common.loading}</div>;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{UZ.settings.title}</h1>
        <p className="text-muted-foreground">Tizim sozlamalari va to'lov ma'lumotlari</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Qarz limiti (Debt Control)</CardTitle>
            <CardDescription>Mijozlar uchun standart qarz chegarasi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Standart Qarz Limiti (KRW)</Label>
              <NumberInput
                value={formData.debtLimitDefault ?? 0}
                onChange={val => updateField('debtLimitDefault', val)}
                allowDecimals={false}
                min={0}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Mijozning qarzi shu limitga nisbatan foizlarda o'lchanadi: <br />
                80% = ogohlantirish, 100% = bloklash, 120% = qattiq bloklash
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>⏱ Buyurtma sozlamalari</CardTitle>
            <CardDescription>Buyurtma va to'lov muddati sozlamalari</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>To'lov muddati (daqiqa)</Label>
              <NumberInput
                value={formData.paymentTimeoutMinutes ?? 0}
                onChange={val => updateField('paymentTimeoutMinutes', val)}
                allowDecimals={false}
                min={0}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Mijoz shu muddat ichida to'lov qilmasa, buyurtma bekor qilinadi
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Minimal buyurtma</CardTitle>
            <CardDescription>Mintaqalar bo'yicha minimal buyurtma summasi</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>O'zbekiston (UZS)</Label>
              <NumberInput
                value={formData.minOrderUzbUzs ?? 0}
                onChange={val => updateField('minOrderUzbUzs', val)}
                allowDecimals={false}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Koreya (KRW)</Label>
              <NumberInput
                value={formData.minOrderKorKrw ?? 0}
                onChange={val => updateField('minOrderKorKrw', val)}
                allowDecimals={false}
                min={0}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kam qoldiq (Low Stock)</CardTitle>
            <CardDescription>Ombordagi kam qoldiq chegarasi</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label>Kam Qoldiq Chegarasi</Label>
              <NumberInput
                value={formData.lowStockThreshold ?? 0}
                onChange={val => updateField('lowStockThreshold', val)}
                allowDecimals={false}
                min={0}
              />
              <p className="text-[0.8rem] text-muted-foreground">
                Bu miqdordan kam qolsa, qizil rangda ogohlantiriladi
              </p>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="KOR" className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-medium">To'lov usullari (mintaqalar bo'yicha)</h3>
              <p className="text-sm text-muted-foreground">
                Xaridorlarga ko'rsatiladigan to'lov usullarini sozlang
              </p>
            </div>
            <TabsList>
              <TabsTrigger value="KOR">🇰🇷 Koreya</TabsTrigger>
              <TabsTrigger value="UZB">🇺🇿 O'zbekiston</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="KOR" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Bank kartasi</CardTitle>
                    <CardDescription>Koreya bank kartasi orqali to'lov</CardDescription>
                  </div>
                  <Switch
                    checked={formData.korBankEnabled ?? false}
                    onCheckedChange={val => updateField('korBankEnabled', val)}
                  />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {formData.korBankEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Bank nomi</Label>
                        <Input
                          placeholder="Masalan: Kookmin Bank"
                          value={formData.korBankName || ''}
                          onChange={e => updateField('korBankName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Karta egasi</Label>
                        <Input
                          placeholder="Masalan: Kim Chulsoo"
                          value={formData.korBankHolder || ''}
                          onChange={e => updateField('korBankHolder', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Karta raqami</Label>
                        <Input
                          placeholder="Masalan: 123-456-789012"
                          value={formData.korBankNumber || ''}
                          onChange={e => updateField('korBankNumber', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>E9 Pay</CardTitle>
                    <CardDescription>E9 Pay orqali pul o'tkazish</CardDescription>
                  </div>
                  <Switch
                    checked={formData.korE9payEnabled ?? false}
                    onCheckedChange={val => updateField('korE9payEnabled', val)}
                  />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {formData.korE9payEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Ism va familiya</Label>
                        <Input
                          placeholder="Masalan: Kim Chulsoo"
                          value={formData.korE9payName || ''}
                          onChange={e => updateField('korE9payName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hisob raqami</Label>
                        <Input
                          placeholder="Masalan: 010-1234-5678"
                          value={formData.korE9payAccount || ''}
                          onChange={e => updateField('korE9payAccount', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="UZB" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>Bank kartasi</CardTitle>
                    <CardDescription>O'zbekiston bank kartasi orqali to'lov</CardDescription>
                  </div>
                  <Switch
                    checked={formData.uzbBankEnabled ?? false}
                    onCheckedChange={val => updateField('uzbBankEnabled', val)}
                  />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {formData.uzbBankEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Bank nomi</Label>
                        <Input
                          placeholder="Masalan: Kapitalbank"
                          value={formData.uzbBankName || ''}
                          onChange={e => updateField('uzbBankName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Karta egasi</Label>
                        <Input
                          placeholder="Masalan: Isokjon Osimjonov"
                          value={formData.uzbBankHolder || ''}
                          onChange={e => updateField('uzbBankHolder', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Karta raqami</Label>
                        <Input
                          placeholder="Masalan: 8600 1234 5678 9012"
                          value={formData.uzbBankNumber || ''}
                          onChange={e => updateField('uzbBankNumber', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <div className="space-y-1">
                    <CardTitle>E9 Pay</CardTitle>
                    <CardDescription>E9 Pay orqali pul o'tkazish</CardDescription>
                  </div>
                  <Switch
                    checked={formData.uzbE9payEnabled ?? false}
                    onCheckedChange={val => updateField('uzbE9payEnabled', val)}
                  />
                </CardHeader>
                <CardContent className="space-y-4 pt-4">
                  {formData.uzbE9payEnabled && (
                    <>
                      <div className="space-y-2">
                        <Label>Ism va familiya</Label>
                        <Input
                          placeholder=""
                          value={formData.uzbE9payName || ''}
                          onChange={e => updateField('uzbE9payName', e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Hisob raqami</Label>
                        <Input
                          placeholder=""
                          value={formData.uzbE9payAccount || ''}
                          onChange={e => updateField('uzbE9payAccount', e.target.value)}
                        />
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Button type="submit" className="w-full" disabled={!isDirty || updateMutation.isPending}>
          {updateMutation.isPending ? UZ.common.loading : UZ.common.save}
        </Button>
      </form>
    </div>
  );
}

