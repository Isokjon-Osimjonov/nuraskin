import { queryKeys } from '@nuraskin/shared-utils';
import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { shippingBoxSchema, type ShippingBoxInput } from '@nuraskin/shared-types';
import { settingsApi } from './api/settings.api';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { NumberInput } from '@/components/ui/number-input';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { Edit, Trash, X, Package } from 'lucide-react';

export function ShippingBoxesPage() {
  const queryClient = useQueryClient();
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const { data: boxes = [], isLoading } = useQuery({
    queryKey: queryKeys.shippingBoxes.all(),
    queryFn: settingsApi.listShippingBoxes,
  });

  const form = useForm<ShippingBoxInput>({
    resolver: zodResolver(shippingBoxSchema as any) as any,
    defaultValues: {
      name: '',
      label: '',
      maxWeightGrams: 0,
      tareWeightGrams: 0,
      costPriceKrw: 0,
      isActive: true,
      sortOrder: 0,
    },
  });

  const createMutation = useMutation({
    mutationFn: settingsApi.createShippingBox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shippingBoxes.all() });
      form.reset();
      toast.success("Yangi quti qo'shildi");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ShippingBoxInput> }) =>
      settingsApi.updateShippingBox(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shippingBoxes.all() });
      setEditingId(null);
      form.reset();
      toast.success('Quti yangilandi');
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: settingsApi.deleteShippingBox,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.shippingBoxes.all() });
      toast.success("Quti o'chirildi");
    },
    onError: (err: unknown) => {
      const msg = err instanceof Error ? err.message : 'Xatolik yuz berdi';
      toast.error(msg);
    },
  });

  const onSubmit = (data: ShippingBoxInput) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (box: any) => {
    setEditingId(box.id);
    form.reset({
      name: box.name,
      label: box.label,
      maxWeightGrams: box.maxWeightGrams,
      tareWeightGrams: box.tareWeightGrams,
      costPriceKrw: Number(BigInt(box.costPriceKrw)),
      isActive: box.isActive,
      sortOrder: box.sortOrder,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    form.reset({
      name: '',
      label: '',
      maxWeightGrams: 0,
      tareWeightGrams: 0,
      costPriceKrw: 0,
      isActive: true,
      sortOrder: 0,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Kargo qutilari</h1>
          <p className="text-muted-foreground">
            O'zbekistonga yuboriladigan posilkalar uchun qutilar sozlamalari
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 h-fit">
          <CardHeader>
            <CardTitle>{editingId ? 'Qutini tahrirlash' : 'Yangi quti'}</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomi</FormLabel>
                      <FormControl>
                        <Input placeholder="Masalan: S, M, L, XL" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="label"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Yorlig'i</FormLabel>
                      <FormControl>
                        <Input placeholder="Masalan: Kichik (1kg gacha)" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxWeightGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max og'irlik (g)</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value}
                          onChange={field.onChange}
                          allowDecimals={false}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="tareWeightGrams"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quticha og'irligi (g)</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value}
                          onChange={field.onChange}
                          allowDecimals={false}
                          min={1}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="costPriceKrw"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Narxi (₩)</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value}
                          onChange={field.onChange}
                          allowDecimals={false}
                          min={0}
                        />
                      </FormControl>
                      <p className="text-[10px] text-muted-foreground italic">
                        Odatda bepul, agar sotib olingan bo'lsa kiriting
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sortOrder"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tartib</FormLabel>
                      <FormControl>
                        <NumberInput
                          value={field.value}
                          onChange={field.onChange}
                          allowDecimals={false}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="isActive"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-3 shadow-sm">
                      <FormLabel>Faol</FormLabel>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
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

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Mavjud qutilar</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">Tartib</TableHead>
                  <TableHead>Nomi / Yorlig'i</TableHead>
                  <TableHead>Max og'irlik</TableHead>
                  <TableHead>Tare (Quti v.)</TableHead>
                  <TableHead>Narxi (₩)</TableHead>
                  <TableHead>Holati</TableHead>
                  <TableHead className="text-right">Amallar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Yuklanmoqda...
                    </TableCell>
                  </TableRow>
                ) : boxes.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Qutilar mavjud emas.
                    </TableCell>
                  </TableRow>
                ) : (
                  boxes.map(box => (
                    <TableRow key={box.id} className={editingId === box.id ? 'bg-muted/50' : ''}>
                      <TableCell className="font-mono text-muted-foreground">
                        {box.sortOrder}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <div className="font-bold">{box.name}</div>
                            <div className="text-xs text-muted-foreground">{box.label}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{(box.maxWeightGrams / 1000).toFixed(1)} kg</TableCell>
                      <TableCell>{box.tareWeightGrams} g</TableCell>
                      <TableCell>
                        {Number(BigInt(box.costPriceKrw)) > 0 ? (
                          `${Number(BigInt(box.costPriceKrw)).toLocaleString()} ₩`
                        ) : (
                          <span className="text-emerald-600 font-medium">BEPUL</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {box.isActive ? (
                          <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            Faol
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                            Nofaol
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => handleEdit(box)}
                          >
                            <Edit className="h-4 w-4 text-blue-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => deleteMutation.mutate(box.id)}
                          >
                            <Trash className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
