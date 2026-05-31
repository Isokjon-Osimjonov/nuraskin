import { queryKeys, tiyinToSom } from '@nuraskin/shared-utils';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSettingsSchema, type UpdateSettingsInput } from '@nuraskin/shared-types';
import { settingsApi } from './api/settings.api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { UZ, translateServerError } from '@/lib/uz';

export function SettingsPage() {
  const queryClient = useQueryClient();
  const hasInitialized = React.useRef(false);

  const { data: settings, isLoading } = useQuery({
    queryKey: queryKeys.settings.all(),
    queryFn: () => settingsApi.get(),
  });

  const form = useForm<UpdateSettingsInput>({
    resolver: zodResolver(updateSettingsSchema as any) as any,
    defaultValues: {
      debtLimitDefault: 0,
      lowStockThreshold: 10,
      adminCardNumber: '',
      adminCardHolder: '',
      adminCardBank: '',
      minOrderUzbUzs: 0,
      minOrderKorKrw: 0,
      paymentTimeoutMinutes: 30,
      korBankEnabled: false,
      korBankName: '',
      korBankHolder: '',
      korBankNumber: '',
      korE9payEnabled: false,
      korE9payName: '',
      korE9payAccount: '',
      uzbBankEnabled: false,
      uzbBankName: '',
      uzbBankHolder: '',
      uzbBankNumber: '',
      uzbE9payEnabled: false,
      uzbE9payName: '',
      uzbE9payAccount: '',
    },
  });

  const {
    formState: { isDirty },
  } = form;

  React.useEffect(() => {
    if (settings && !hasInitialized.current) {
      form.reset({
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
      hasInitialized.current = true;
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      hasInitialized.current = false;
      queryClient.invalidateQueries({ queryKey: queryKeys.settings.all() });
      toast.success(UZ.settings.saved);
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(translateServerError(msg));
    },
  });

  const onSubmit = (data: UpdateSettingsInput) => {
    updateMutation.mutate(data);
  };

  if (isLoading) return <div className="p-6">{UZ.common.loading}</div>;

  return (
    <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{UZ.settings.title}</h1>
        <p className="text-muted-foreground">Tizim sozlamalari va to'lov ma'lumotlari</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Qarz limiti (Debt Control)</CardTitle>
              <CardDescription>Mijozlar uchun standart qarz chegarasi</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="debtLimitDefault"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Standart Qarz Limiti (KRW)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Mijozning qarzi shu limitga nisbatan foizlarda o'lchanadi: <br />
                      80% = ogohlantirish, 100% = bloklash, 120% = qattiq bloklash
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>⏱ Buyurtma sozlamalari</CardTitle>
              <CardDescription>Buyurtma va to'lov muddati sozlamalari</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="paymentTimeoutMinutes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>To'lov muddati (daqiqa)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="5"
                        max="1440"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 30)}
                      />
                    </FormControl>
                    <FormDescription>
                      Mijoz shu muddat ichida to'lov qilmasa, buyurtma bekor qilinadi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Minimal buyurtma</CardTitle>
              <CardDescription>Mintaqalar bo'yicha minimal buyurtma summasi</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minOrderUzbUzs"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>O'zbekiston (UZS)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="minOrderKorKrw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Koreya (KRW)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kam qoldiq (Low Stock)</CardTitle>
              <CardDescription>Ombordagi kam qoldiq chegarasi</CardDescription>
            </CardHeader>
            <CardContent>
              <FormField
                control={form.control}
                name="lowStockThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kam Qoldiq Chegarasi</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Bu miqdordan kam qolsa, qizil rangda ogohlantiriladi
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                    <FormField
                      control={form.control}
                      name="korBankEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {form.watch('korBankEnabled') && (
                      <>
                        <FormField
                          control={form.control}
                          name="korBankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank nomi</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: Kookmin Bank"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="korBankHolder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Karta egasi</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: Kim Chulsoo"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="korBankNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Karta raqami</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: 123-456-789012"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                    <FormField
                      control={form.control}
                      name="korE9payEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {form.watch('korE9payEnabled') && (
                      <>
                        <FormField
                          control={form.control}
                          name="korE9payName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ism va familiya</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: Kim Chulsoo"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="korE9payAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hisob raqami</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: 010-1234-5678"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                    <FormField
                      control={form.control}
                      name="uzbBankEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {form.watch('uzbBankEnabled') && (
                      <>
                        <FormField
                          control={form.control}
                          name="uzbBankName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Bank nomi</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: Kapitalbank"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="uzbBankHolder"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Karta egasi</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: Isokjon Osimjonov"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="uzbBankNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Karta raqami</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Masalan: 8600 1234 5678 9012"
                                  {...field}
                                  value={field.value || ''}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
                    <FormField
                      control={form.control}
                      name="uzbE9payEnabled"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    {form.watch('uzbE9payEnabled') && (
                      <>
                        <FormField
                          control={form.control}
                          name="uzbE9payName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ism va familiya</FormLabel>
                              <FormControl>
                                <Input placeholder="" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="uzbE9payAccount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Hisob raqami</FormLabel>
                              <FormControl>
                                <Input placeholder="" {...field} value={field.value || ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
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
      </Form>
    </div>
  );
}
