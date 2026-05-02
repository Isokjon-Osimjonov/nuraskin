import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { updateSettingsSchema, type UpdateSettingsInput } from '@nuraskin/shared-types';
import { settingsApi } from './api/settings.api';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { UZ, translateServerError } from '@/lib/uz';

export function SettingsPage() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
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
      freeShippingThresholdKrw: 200000,
      standardShippingFeeKrw: 3000,
    },
  });

  React.useEffect(() => {
    if (settings) {
      form.reset({
        debtLimitDefault: Number(BigInt(settings.debtLimitDefault)), 
        lowStockThreshold: settings.lowStockThreshold,
        adminCardNumber: settings.adminCardNumber || '',
        adminCardHolder: settings.adminCardHolder || '',
        adminCardBank: settings.adminCardBank || '',
        minOrderUzbUzs: Number(BigInt(settings.minOrderUzbUzs)) / 100,
        minOrderKorKrw: Number(BigInt(settings.minOrderKorKrw)),
        paymentTimeoutMinutes: settings.paymentTimeoutMinutes,
        freeShippingThresholdKrw: Number(BigInt(settings.freeShippingThresholdKrw || '200000')),
        standardShippingFeeKrw: Number(BigInt(settings.standardShippingFeeKrw || '3000')),
      });
    }
  }, [settings, form]);

  const updateMutation = useMutation({
    mutationFn: settingsApi.update,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast.success(UZ.settings.saved);
    },
    onError: (err: any) => toast.error(translateServerError(err.message)),
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
                      <Input type="number" min="0" step="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>
                      Mijozning qarzi shu limitga nisbatan foizlarda o'lchanadi: <br/>
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
                      <Input type="number" min="5" max="1440" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 30)} />
                    </FormControl>
                    <FormDescription>Mijoz shu muddat ichida to'lov qilmasa, buyurtma bekor qilinadi</FormDescription>
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
                      <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
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
                      <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
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
                      <Input type="number" min="0" step="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>Bu miqdordan kam qolsa, qizil rangda ogohlantiriladi</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>To'lov karta (Admin Payment Card)</CardTitle>
              <CardDescription>Mijozlarga to'lov qilish uchun ko'rsatiladigan karta</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="adminCardNumber"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karta raqami</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan: 8600 1234 5678 9012" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adminCardHolder"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Karta egasi</FormLabel>
                    <FormControl>
                      <Input placeholder={UZ.common.placeholderName} {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="adminCardBank"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bank</FormLabel>
                    <FormControl>
                      <Input placeholder="Masalan: Kapital Bank" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{UZ.settings.deliverySettings}</CardTitle>
              <CardDescription>Koreya ichida yetkazib berish (Delivery Settings)</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="freeShippingThresholdKrw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{UZ.settings.freeShippingThreshold} (KOR)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>
                      Bu summadan yuqori KOR buyurtmalar uchun yetkazib berish bepul
                      <br/>
                      <span className="font-semibold mt-1 block">
                        Joriy: ₩{Number(field.value || 0).toLocaleString()}
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="standardShippingFeeKrw"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{UZ.settings.standardShippingFee} (KOR)</FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                    </FormControl>
                    <FormDescription>
                      Bepul chegaraga yetmagan buyurtmalar uchun narx
                      <br/>
                      <span className="font-semibold mt-1 block">
                        Joriy: ₩{Number(field.value || 0).toLocaleString()}
                      </span>
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Button type="submit" className="w-full" disabled={updateMutation.isPending}>
            {updateMutation.isPending ? UZ.common.loading : UZ.common.save}
          </Button>
        </form>
      </Form>
    </div>
  );
}
