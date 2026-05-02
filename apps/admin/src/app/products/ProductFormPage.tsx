import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createProductSchema } from '@nuraskin/shared-types';
import type { CreateProductInput, CategoryResponse } from '@nuraskin/shared-types';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { ImageUpload } from './components/ImageUpload';
import { AiFillButton } from './components/AiFillButton';
import { TagInput } from './components/TagInput';
import { RegionalConfigTabs, type RegionalConfig } from './components/RegionalConfigTabs';
import { productsApi } from './api/products.api';
import { toast } from 'sonner';
import { Lock, AlertTriangle } from 'lucide-react';

interface ProductFormPageProps {
  initialData?: {
    id: string;
    name: string;
    brandName: string;
    barcode: string;
    sku: string;
    categoryId: string;
    descriptionUz: string | null;
    howToUseUz: string | null;
    ingredients: string[];
    skinTypes: string[];
    benefits: string[];
    weightGrams: number;
    imageUrls: string[];
    isActive: boolean;
    showStockCount: boolean;
    uzbRetail?: string | null;
    uzbWholesale?: string | null;
    korRetail?: string | null;
    korWholesale?: string | null;
    regionalConfigs?: any[];
  };
  prefilledBarcode?: string;
  categories: CategoryResponse[];
  onSubmit: (data: CreateProductInput) => void;
  isSubmitting: boolean;
}

function bigintToNumber(val: string | number | null | undefined): number | undefined {
  if (val === null || val === undefined || val === '') return undefined;
  return Number(BigInt(val));
}

function highlightFields(fields: string[]) {
  fields.forEach((f) => {
    const el = document.querySelector(`[name="${f}"]`) as HTMLElement | null;
    if (el) {
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-blue-400'), 3000);
    }
  });
}

export function ProductFormPage({
  initialData,
  prefilledBarcode,
  categories,
  onSubmit,
  isSubmitting,
}: ProductFormPageProps) {
  const [analyzing, setAnalyzing] = React.useState(false);
  const isEdit = !!initialData;

  const form = useForm<CreateProductInput>({
    resolver: zodResolver(createProductSchema as any) as any,
    defaultValues: {
      barcode: initialData?.barcode ?? prefilledBarcode ?? '',
      sku: initialData?.sku ?? '',
      name: initialData?.name ?? '',
      brandName: initialData?.brandName ?? '',
      categoryId: initialData?.categoryId ?? '',
      descriptionUz: initialData?.descriptionUz ?? '',
      howToUseUz: initialData?.howToUseUz ?? '',
      ingredients: initialData?.ingredients ?? [],
      skinTypes: initialData?.skinTypes ?? [],
      benefits: initialData?.benefits ?? [],
      weightGrams: initialData?.weightGrams ?? undefined,
      imageUrls: initialData?.imageUrls ?? [],
      showStockCount: initialData?.showStockCount ?? false,
      regionalConfigs: (initialData?.regionalConfigs?.length ? initialData.regionalConfigs : null)?.map(rc => ({
        regionCode: rc.regionCode,
        retailPrice: bigintToNumber(rc.retailPrice),
        wholesalePrice: bigintToNumber(rc.wholesalePrice),
        currency: 'KRW',
        minWholesaleQty: rc.minWholesaleQty,
        minOrderQty: rc.minOrderQty,
      })) ?? [
        {
          regionCode: 'UZB' as const,
          retailPrice: bigintToNumber(initialData?.uzbRetail),
          wholesalePrice: bigintToNumber(initialData?.uzbWholesale),
          currency: 'KRW',
          minWholesaleQty: 5,
          minOrderQty: 1,
        },
        {
          regionCode: 'KOR' as const,
          retailPrice: bigintToNumber(initialData?.korRetail),
          wholesalePrice: bigintToNumber(initialData?.korWholesale),
          currency: 'KRW',
          minWholesaleQty: 3,
          minOrderQty: 1,
        },
      ],
    },
  });

  // CRITICAL: Reset form when initialData changes to ensure correct values populate the edit dialog
  React.useEffect(() => {
    if (initialData) {
      form.reset({
        barcode: initialData.barcode,
        sku: initialData.sku,
        name: initialData.name,
        brandName: initialData.brandName,
        categoryId: initialData.categoryId,
        descriptionUz: initialData.descriptionUz ?? '',
        howToUseUz: initialData.howToUseUz ?? '',
        ingredients: initialData.ingredients,
        skinTypes: initialData.skinTypes,
        benefits: initialData.benefits,
        weightGrams: initialData.weightGrams,
        imageUrls: initialData.imageUrls,
        showStockCount: initialData.showStockCount,
        regionalConfigs: (initialData.regionalConfigs?.length ? initialData.regionalConfigs : null)?.map(rc => ({
          regionCode: rc.regionCode as 'UZB' | 'KOR',
          retailPrice: bigintToNumber(rc.retailPrice),
          wholesalePrice: bigintToNumber(rc.wholesalePrice),
          currency: 'KRW',
          minWholesaleQty: rc.minWholesaleQty,
          minOrderQty: rc.minOrderQty,
        })) ?? [
          {
            regionCode: 'UZB' as const,
            retailPrice: bigintToNumber(initialData.uzbRetail),
            wholesalePrice: bigintToNumber(initialData.uzbWholesale),
            currency: 'KRW',
            minWholesaleQty: 5,
            minOrderQty: 1,
          },
          {
            regionCode: 'KOR' as const,
            retailPrice: bigintToNumber(initialData.korRetail),
            wholesalePrice: bigintToNumber(initialData.korWholesale),
            currency: 'KRW',
            minWholesaleQty: 3,
            minOrderQty: 1,
          },
        ],
      });
    } else {
      // Add Mode
      form.reset({
        barcode: prefilledBarcode ?? '',
        sku: '',
        name: '',
        brandName: '',
        categoryId: '',
        descriptionUz: '',
        howToUseUz: '',
        ingredients: [],
        skinTypes: [],
        benefits: [],
        weightGrams: undefined,
        imageUrls: [],
        showStockCount: false,
        regionalConfigs: [
          {
            regionCode: 'UZB',
            retailPrice: undefined,
            wholesalePrice: undefined,
            currency: 'KRW',
            minWholesaleQty: 5,
            minOrderQty: 1,
          },
          {
            regionCode: 'KOR',
            retailPrice: undefined,
            wholesalePrice: undefined,
            currency: 'KRW',
            minWholesaleQty: 3,
            minOrderQty: 1,
          },
        ],
      });
    }
  }, [initialData, prefilledBarcode, form]);

  const imageUrls = form.watch('imageUrls');
  const hasImage = imageUrls.length > 0;

  const handleAiFill = async () => {
    const url = imageUrls[0];
    if (!url) return;

    setAnalyzing(true);
    try {
      const result = await productsApi.analyzeImage(url);
      form.setValue('name', result.name, { shouldValidate: true });
      form.setValue('brandName', result.brandName, { shouldValidate: true });
      form.setValue('descriptionUz', result.descriptionUz, { shouldValidate: true });
      form.setValue('howToUseUz', result.howToUseUz, { shouldValidate: true });
      form.setValue('ingredients', result.ingredients, { shouldValidate: true });
      form.setValue('skinTypes', result.skinTypes, { shouldValidate: true });
      form.setValue('benefits', result.benefits, { shouldValidate: true });
      toast.success("AI ma'lumotlarni to'ldirdi");
      highlightFields(['name', 'brandName', 'descriptionUz', 'howToUseUz', 'ingredients', 'skinTypes', 'benefits']);
    } catch {
      toast.error('AI tahlil qila olmadi. Qo\'lda to\'ldiring.');
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <TooltipProvider>
      <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2 space-y-5">
            <FormField
              name="imageUrls"
              render={() => (
                <FormItem>
                  <FormLabel>Product Images</FormLabel>
                  <FormControl>
                    <ImageUpload
                      urls={form.watch('imageUrls')}
                      onChange={(urls) => form.setValue('imageUrls', urls, { shouldValidate: true })}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {hasImage && (
              <div>
                <AiFillButton
                  onClick={handleAiFill}
                  isLoading={analyzing}
                  disabled={!hasImage}
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name</FormLabel>
                    <FormControl><Input placeholder="Lacto-Fit Collagen 50 Sticks" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="brandName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Brand</FormLabel>
                    <FormControl><Input placeholder="Lacto-Fit" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              name="descriptionUz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Uzbek)</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-24 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Mahsulot haqida qisqacha ta'rif..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Right column */}
          <div className="space-y-5">
            <FormField
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    Barcode (EAN-13)
                    {isEdit && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                        </TooltipTrigger>
                        <TooltipContent>
                          Barcode cannot be changed after creation
                        </TooltipContent>
                      </Tooltip>
                    )}
                  </FormLabel>
                  <FormControl>
                    {isEdit ? (
                      <div className="flex h-10 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                        {field.value}
                      </div>
                    ) : (
                      <Input placeholder="8801234567890" {...field} />
                    )}
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="sku"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    SKU
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <AlertTriangle className="h-3.5 w-3.5 text-orange-500 cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        Changing SKU may affect pick & pack scanning fallback
                      </TooltipContent>
                    </Tooltip>
                  </FormLabel>
                  <FormControl><Input placeholder="LF-COL-50" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="categoryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="weightGrams"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weight (g)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" placeholder="0" {...field} onChange={(e) => field.onChange(e.target.value === '' ? undefined : parseInt(e.target.value))} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              name="showStockCount"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                  <div className="space-y-0.5">
                    <FormLabel>Zaxira miqdorini ko'rsatish</FormLabel>
                    <div className="text-[10px] text-muted-foreground">
                      Mijozlarga dona sonini ko'rsatish
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-5">
            <FormField
              name="ingredients"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tarkibi (Ingredients)</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add ingredient..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="skinTypes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Teri turi (Skin Types)</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add skin type..."
                      suggestions={["Quruq", "Yog'li", "Kombinatsiyalashgan", "Sezgir", "Normal"]}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="space-y-5">
            <FormField
              name="benefits"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Foydalari (Benefits)</FormLabel>
                  <FormControl>
                    <TagInput
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="Add benefit..."
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              name="howToUseUz"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Qanday ishlatish kerak</FormLabel>
                  <FormControl>
                    <textarea
                      className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="Qo'llash bo'yicha ko'rsatmalar..."
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        {/* Regional config tabs */}
        <FormField
          name="regionalConfigs"
          render={() => (
            <FormItem>
              <FormLabel className="text-base font-medium">Regional Pricing</FormLabel>
              <FormControl>
                <div className="mt-3">
                  <RegionalConfigTabs
                    configs={form.watch('regionalConfigs')}
                    onChange={(configs) => form.setValue('regionalConfigs', configs as any)}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {initialData ? "Saqlash" : "Yaratish"}
        </Button>
      </form>
    </Form>
    </TooltipProvider>
  );
}
