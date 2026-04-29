import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { korShippingTierSchema, type KorShippingTierInput } from '@nuraskin/shared-types';
import { settingsApi } from './api/settings.api';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Edit, Trash, Plus, X } from 'lucide-react';

export function ShippingTiersPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { data: tiers = [], isLoading } = useQuery({
    queryKey: ['shipping-tiers'],
    queryFn: settingsApi.listShippingTiers,
  });

  const form = useForm<KorShippingTierInput>({
    resolver: zodResolver(korShippingTierSchema as any) as any,
    defaultValues: {
      maxOrderKrw: 0,
      cargoFeeKrw: 0,
      sortOrder: 0,
      isActive: true,
    },
  });

  const createMutation = useMutation({
    mutationFn: settingsApi.createShippingTier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers'] });
      form.reset();
      toast.success("Yangi tarif qo'shildi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<KorShippingTierInput> }) =>
      settingsApi.updateShippingTier(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers'] });
      setEditingId(null);
      toast.success("Tarif yangilandi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: settingsApi.deleteShippingTier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping-tiers'] });
      toast.success("Tarif o'chirildi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const onSubmit = (data: KorShippingTierInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (tier: any) => {
    setEditingId(tier.id);
    form.reset({
      maxOrderKrw: tier.maxOrderKrw ? Number(BigInt(tier.maxOrderKrw)) : null,
      cargoFeeKrw: Number(BigInt(tier.cargoFeeKrw)),
      sortOrder: tier.sortOrder,
      isActive: tier.isActive,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset({
      maxOrderKrw: 0,
      cargoFeeKrw: 0,
      sortOrder: 0,
      isActive: true,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Koreya yetkazib berish tariflari</h1>
          <p className="text-muted-foreground">Savat summasiga qarab avtomatik hisoblanadigan kargo narxlari</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{editingId ? 'Tarifni tahrirlash' : 'Yangi tarif'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="maxOrderKrw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Maksimal summa (KRW)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Bo'sh qoldirilsa - cheksiz" 
                          {...field} 
                          value={field.value === null ? '' : field.value}
                          onChange={e => field.onChange(e.target.value === '' ? null : parseInt(e.target.value))} 
                        />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground">Buyurtma shu summadan kichik bo'lsa amal qiladi</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="cargoFeeKrw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Kargo narxi (KRW)</FormLabel>
                      <FormControl>
                        <Input type="number" min="0" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tartib (Sort Order)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 0)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" className="flex-1" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingId ? 'Yangilash' : "Qo'shish"}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={cancelEdit}>
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Tariflar ro'yxati</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tartib</TableHead>
                  <TableHead>Buyurtma summasi</TableHead>
                  <TableHead>Kargo narxi</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">Yuklanmoqda...</TableCell>
                  </TableRow>
                ) : tiers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">Tariflar mavjud emas.</TableCell>
                  </TableRow>
                ) : tiers.map((tier) => (
                  <TableRow key={tier.id} className={editingId === tier.id ? 'bg-muted/50' : ''}>
                    <TableCell className="font-mono">{tier.sortOrder}</TableCell>
                    <TableCell>
                      {tier.maxOrderKrw 
                        ? `${Number(BigInt(tier.maxOrderKrw)).toLocaleString()} ₩ dan kichik`
                        : <Badge variant="secondary">Cheksiz / Boshqa holatlar</Badge>}
                    </TableCell>
                    <TableCell className="font-bold">
                      {Number(BigInt(tier.cargoFeeKrw)) === 0 
                        ? <span className="text-emerald-600">BEPUL</span> 
                        : `${Number(BigInt(tier.cargoFeeKrw)).toLocaleString()} ₩`}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(tier)}>
                          <Edit className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => deleteMutation.mutate(tier.id)}>
                          <Trash className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <p className="text-[11px] text-muted-foreground mt-4 italic">
              * Tizim buyurtma summasiga mos keladigan eng birinchi tarifni oladi (Tartib bo'yicha). 
              Agar birorta ham tarifga tushmasa, kargo BEPUL hisoblanadi.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
