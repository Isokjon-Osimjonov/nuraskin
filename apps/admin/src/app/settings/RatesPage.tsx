import { queryKeys, formatDateTime, formatKrw } from '@nuraskin/shared-utils';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createExchangeRateSchema, type CreateExchangeRateInput } from '@nuraskin/shared-types';
import { exchangeRatesApi } from '../exchange-rates/api/exchange-rates.api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { NumberInput } from '@/components/ui/number-input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';

export function RatesPage() {
  const queryClient = useQueryClient();

  const { data: latestRate, isLoading: isLatestLoading } = useQuery({
    queryKey: queryKeys.exchangeRates.latest(),
    queryFn: () => exchangeRatesApi.getLatest(),
  });

  const { data: history, isLoading: isHistoryLoading } = useQuery({
    queryKey: queryKeys.exchangeRates.all(),
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
      queryClient.invalidateQueries({ queryKey: queryKeys.exchangeRates.all() });
      form.reset();
      toast.success("Yangi kurs o'rnatildi");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const onSubmit = (data: CreateExchangeRateInput) => {
    createMutation.mutate(data);
  };

  return (
    <div className="flex flex-col gap-6 p-3 sm:p-4 md:p-6 max-w-4xl mx-auto w-full overflow-x-hidden">
      <div className="w-full min-w-0">
        <h1 className="text-xl sm:text-3xl font-bold tracking-tight">Valyuta kurslari</h1>
        <p className="text-sm text-muted-foreground">
          Tizim uchun joriy valyuta (KRW → UZS) va kargo kurslari
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full min-w-0">
        <Card className="border-primary/20 bg-primary/5 min-w-0">
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
                  <span className="font-bold text-lg">
                    {Number(latestRate.krwToUzs).toFixed(2)} UZS
                  </span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-muted-foreground">Kargo (1 kg) =</span>
                  <span className="font-bold text-lg">
                    {formatKrw(latestRate.cargoRateKrwPerKg)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground pt-2">
                  O'rnatildi: {formatDateTime(latestRate.createdAt)}
                </div>
              </>
            ) : (
              <p>Faol kurs topilmadi.</p>
            )}
          </CardContent>
        </Card>

        <Card className="min-w-0">
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
                          <NumberInput
                            placeholder="14.5"
                            allowDecimals={true}
                            value={field.value as number}
                            onChange={field.onChange}
                          />
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
                          <NumberInput
                            placeholder="10000"
                            allowDecimals={false}
                            value={field.value as number}
                            onChange={field.onChange}
                          />
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
                  {createMutation.isPending ? 'Saqlanmoqda...' : "Kursni o'rnatish"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>

      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Kurslar tarixi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto w-full min-w-0">
            <Table className="min-w-[520px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="whitespace-nowrap">Sana</TableHead>
                  <TableHead className="whitespace-nowrap">KRW → UZS</TableHead>
                  <TableHead className="whitespace-nowrap">Kargo (KRW/kg)</TableHead>
                  <TableHead className="whitespace-nowrap">Izoh</TableHead>
                  <TableHead className="whitespace-nowrap">Yaratdi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isHistoryLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : (
                  history?.map((rate: any) => (
                    <TableRow key={rate.id}>
                      <TableCell className="whitespace-nowrap">
                        {formatDateTime(rate.createdAt)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {Number(rate.krwToUzs).toFixed(2)}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {formatKrw(rate.cargoRateKrwPerKg)}
                      </TableCell>
                      <TableCell className="text-muted-foreground min-w-[150px]">
                        {rate.note || '—'}
                      </TableCell>
                      <TableCell className="whitespace-nowrap">
                        {rate.createdByName || '—'}
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
  );
}
