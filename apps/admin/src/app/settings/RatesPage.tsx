import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExchangeRateSchema, type CreateExchangeRateInput } from '@nuraskin/shared-types';
import { exchangeRatesApi } from '../exchange-rates/api/exchange-rates.api';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function RatesPage() {
  const queryClient = useQueryClient();

  const { data: latestRate, isLoading: isLatestLoading } = useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: () => exchangeRatesApi.getLatest(),
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: ['exchange-rates'],
    queryFn: () => exchangeRatesApi.list(),
  });

  const form = useForm<CreateExchangeRateInput>({
    resolver: zodResolver(createExchangeRateSchema as any) as any,
    defaultValues: {
      krwToUzs: 0,
      cargoRateKrwPerKg: 0,
      note: '',
    },
  });

  const createMutation = useMutation({
    mutationFn: exchangeRatesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exchange-rates'] });
      form.reset();
      toast.success("Yangi kurs o'rnatildi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const onSubmit = (data: CreateExchangeRateInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Valyuta kurslari</h1>
        <p className="text-muted-foreground">Tizim uchun joriy valyuta (KRW → UZS) va kargo kurslari</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle>Joriy faol kurs</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLatestLoading ? (
              <p>Yuklanmoqda...</p>
            ) : latestRate ? (
              <>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">1 KRW =</span>
                  <span className="font-bold text-lg">{latestRate.krwToUzs.toLocaleString()} UZS</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Kargo (1 kg) =</span>
                  <span className="font-bold text-lg">{latestRate.cargoRateKrwPerKg.toLocaleString()} KRW</span>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  O'rnatildi: {format(new Date(latestRate.createdAt), 'dd.MM.yyyy HH:mm')}
                </div>
              </>
            ) : (
              <p>Faol kurs topilmadi.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Yangi kurs kiritish</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <FormField
                    control={form.control}
                    name="krwToUzs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>1 KRW = ? UZS</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="cargoRateKrwPerKg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kargo (KRW / kg)</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="note"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Izoh (ixtiyoriy)</FormLabel>
                      <FormControl>
                        <Input {...field} value={field.value || ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                  {createMutation.isPending ? 'Saqlanmoqda...' : 'Kursni o\'rnatish'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Kurslar tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Sana</TableHead>
                <TableHead>KRW → UZS</TableHead>
                <TableHead>Kargo (KRW/kg)</TableHead>
                <TableHead>Izoh</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isHistoryLoading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">Yuklanmoqda...</TableCell>
                </TableRow>
              ) : history?.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell>{format(new Date(rate.createdAt), 'dd.MM.yyyy HH:mm')}</TableCell>
                  <TableCell>{rate.krwToUzs.toLocaleString()}</TableCell>
                  <TableCell>{rate.cargoRateKrwPerKg.toLocaleString()} ₩</TableCell>
                  <TableCell className="text-muted-foreground">{rate.note || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
