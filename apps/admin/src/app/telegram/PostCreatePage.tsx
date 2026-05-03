import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { formatUzs } from '@/lib/utils';
import { telegramApi } from './api/telegram.api';
import { productsApi } from '../products/api/products.api';
import { settingsApi } from '../settings/api/settings.api';
import { useNavigate } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, ArrowRight, Save, Send, Sparkles, Loader2, Camera, Check, X } from 'lucide-react';
import { toast } from 'sonner';
import { buildCaptionPreview } from './utils/caption-builder';
import { exchangeRatesApi } from '../exchange-rates/api/exchange-rates.api';

export function PostCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [step, setStep] = React.useState(1);
  const [productSearch, setProductSearch] = React.useState('');
  
  const { data: products = [] } = useQuery({
    queryKey: ['products', { search: productSearch }],
    queryFn: () => productsApi.getAll({ search: productSearch || undefined, isActive: true }),
    enabled: productSearch.length > 2 || step === 1,
  });

  const { data: latestRate } = useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: () => exchangeRatesApi.getLatest(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  const { data: channels = [] } = useQuery({
    queryKey: ['tg-channels'],
    queryFn: () => telegramApi.listChannels(),
  });

  const [form, setForm] = React.useState<any>({
    productId: '',
    postType: 'PRODUCT_SHOWCASE',
    language: 'UZB',
    captionText: '',
    imageUrls: [],
    hashtags: [],
    showCta: false,
    ctaText: '',
    ctaUrl: '',
    showKrwRetail: false,
    showKrwWholesale: false,
    showUzsRetail: false,
    showUzsWholesale: false,
    showAdminPhone: false,
    adminPhone: '',
    link1Show: false,
    link1Text: '',
    link1Url: '',
    link2Show: false,
    link2Text: '',
    link2Url: '',
    link3Show: false,
    link3Text: '',
    link3Url: '',
    channelIds: [],
    scheduledAt: '',
  });

  const selectedProduct = React.useMemo(() => 
    products.find((p: any) => p.id === form.productId), 
  [products, form.productId]);

  // Fetch full product details for pricing
  const { data: fullProduct } = useQuery({
    queryKey: ['products', form.productId],
    queryFn: () => productsApi.getById(form.productId),
    enabled: !!form.productId,
  });

  const aiMutation = useMutation({
    mutationFn: () => telegramApi.generateCaption(form.productId, form.postType, form.language),
    onSuccess: (res) => {
        setForm({ ...form, captionText: res.caption });
        toast.success("AI matn tayyor!");
    },
    onError: () => toast.error("AI ishlamadi, iltimos qo'lda to'ldiring")
  });

  React.useEffect(() => {
    if (settings) {
        setForm((prev: any) => {
            const next = { ...prev };
            if (!next.adminPhone) next.adminPhone = settings.adminPhone || '';
            if (!next.link1Url) {
                next.link1Url = settings.telegramUrl || '';
                next.link1Text = 'Telegram';
                if (settings.telegramUrl) next.link1Show = true;
            }
            if (!next.link2Url) {
                next.link2Url = settings.instagramUrl || '';
                next.link2Text = 'Instagram';
                if (settings.instagramUrl) next.link2Show = true;
            }
            if (!next.link3Url) {
                next.link3Url = settings.websiteUrl || '';
                next.link3Text = 'Website';
                if (settings.websiteUrl) next.link3Show = true;
            }
            return next;
        });
    }
  }, [settings]);

  const updateSettingsMutation = useMutation({
    mutationFn: (data: any) => settingsApi.update(data),
    onSuccess: () => {
       toast.success("Saqlandi", { duration: 2000, position: 'bottom-right' });
       queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  // Debounced auto-save for links/phone
  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (!settings) return;
      
      const payload: any = {};
      let changed = false;

      if (form.adminPhone !== settings.adminPhone && form.adminPhone !== '') {
          payload.adminPhone = form.adminPhone;
          changed = true;
      }
      if (form.link1Url !== settings.telegramUrl && form.link1Url !== '') {
          payload.telegramUrl = form.link1Url;
          changed = true;
      }
      if (form.link2Url !== settings.instagramUrl && form.link2Url !== '') {
          payload.instagramUrl = form.link2Url;
          changed = true;
      }
      if (form.link3Url !== settings.websiteUrl && form.link3Url !== '') {
          payload.websiteUrl = form.link3Url;
          changed = true;
      }

      if (changed) {
          updateSettingsMutation.mutate(payload);
      }

    }, 1000);

    return () => clearTimeout(handler);
  }, [form.adminPhone, form.link1Url, form.link2Url, form.link3Url]);

  const createMutation = useMutation({
    mutationFn: async (action: 'DRAFT' | 'SENT' | 'SCHEDULED') => {
        const { status, scheduledAt, ...rest } = form;
        const payload = {
            ...rest,
        };
        
        const post = await telegramApi.createPost(payload);
        
        if (action === 'SENT') {
            await telegramApi.sendPost(post.id);
        } else if (action === 'SCHEDULED' && form.scheduledAt) {
            await telegramApi.schedulePost(post.id, new Date(form.scheduledAt).toISOString());
        }
        
        return post;
    },
    onSuccess: (post) => {
        queryClient.invalidateQueries({ queryKey: ['tg-posts'] });
        toast.success("Post saqlandi");
        navigate({ to: `/telegram/posts/${post.id}` as any });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const nextStep = () => {
      if (step === 1 && !form.productId) {
          toast.error("Iltimos, mahsulotni tanlang");
          return;
      }
      setStep(s => s + 1);
  };

  const prevStep = () => setStep(s => s - 1);

  const toggleImage = (url: string) => {
      setForm((prev: any) => ({
          ...prev,
          imageUrls: prev.imageUrls.includes(url) 
            ? prev.imageUrls.filter((u: string) => u !== url)
            : [...prev.imageUrls, url]
      }));
  };

  const captionPreview = React.useMemo(() => {
    return buildCaptionPreview(form, fullProduct, latestRate);
  }, [form, fullProduct, latestRate, settings]);

  return (
    <div className="p-6 max-w-[1400px] mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/telegram' } as any)}>
          <ArrowLeft />
        </Button>
        <h1 className="text-2xl font-bold tracking-tight">Yangi Telegram Post</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 items-start">
        {/* Left: Form (60%) */}
        <div className="lg:col-span-6 space-y-6">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
            {[1, 2, 3, 4, 5, 6, 7].map(i => (
              <div 
                key={i} 
                className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>

          {step === 1 && (
            <Card>
              <CardHeader>
                <CardTitle>Mahsulot tanlash</CardTitle>
                <CardDescription>Post qaysi mahsulot haqida?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input 
                    placeholder="Mahsulot nomini qidiring..." 
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                />
                <div className="grid grid-cols-1 gap-2 max-h-[400px] overflow-y-auto">
                    {products.map((p: any) => (
                        <div 
                            key={p.id}
                            onClick={() => {
                                setForm({ ...form, productId: p.id, imageUrls: [p.imageUrls[0]] });
                            }}
                            className={`flex items-center gap-4 p-3 rounded-xl border cursor-pointer transition-all ${form.productId === p.id ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'hover:bg-muted/50'}`}
                        >
                            <img src={p.imageUrls[0]} className="w-12 h-12 rounded-lg object-cover bg-stone-100" />
                            <div className="flex-1">
                                <p className="font-medium text-sm">{p.name}</p>
                                <p className="text-xs text-muted-foreground">{p.brandName}</p>
                            </div>
                            {form.productId === p.id && <Check className="w-4 h-4 text-primary" />}
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader>
                <CardTitle>Rasmlar</CardTitle>
                <CardDescription>Postga biriktiriladigan rasmlarni tanlang</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                    {selectedProduct?.imageUrls.map((url: string, i: number) => (
                        <div 
                            key={i} 
                            onClick={() => toggleImage(url)}
                            className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${form.imageUrls.includes(url) ? 'border-primary' : 'border-transparent'}`}
                        >
                            <img src={url} className="w-full h-full object-cover" />
                            {form.imageUrls.includes(url) && (
                                <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                                    <Badge className="bg-primary text-white p-1 rounded-full"><Check className="w-3 h-3" /></Badge>
                                </div>
                            )}
                            {form.imageUrls[0] === url && (
                                <div className="absolute bottom-1 left-1">
                                    <Badge variant="secondary" className="text-[8px] px-1 py-0"><Camera className="w-2 h-2 mr-1" /> Asosiy</Badge>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader>
                <CardTitle>Kontent</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>Post turi</Label>
                        <Select value={form.postType} onValueChange={v => setForm({...form, postType: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PRODUCT_SHOWCASE">Mahsulot taqdimoti</SelectItem>
                                <SelectItem value="FLASH_SALE">Tezkor chegirma</SelectItem>
                                <SelectItem value="NEW_ARRIVAL">Yangi mahsulot</SelectItem>
                                <SelectItem value="RESTOCK">Yana sotuvda</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label>Til</Label>
                        <Select value={form.language} onValueChange={v => setForm({...form, language: v})}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="UZB">O'zbekcha</SelectItem>
                                <SelectItem value="RUS">Ruscha</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Matn</Label>
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-7 text-[10px] gap-1"
                            onClick={() => aiMutation.mutate()}
                            disabled={aiMutation.isPending}
                        >
                            {aiMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                            AI bilan to'ldirish
                        </Button>
                    </div>
                    <textarea 
                        className="w-full min-h-[150px] p-3 text-sm rounded-xl border bg-muted/30 focus:bg-white transition-colors"
                        value={form.captionText}
                        onChange={e => setForm({...form, captionText: e.target.value})}
                        placeholder="Post matnini kiriting..."
                    />
                </div>

                <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="showCta" 
                            checked={form.showCta}
                            onCheckedChange={(v: boolean) => setForm({...form, showCta: !!v})}
                        />
                        <Label htmlFor="showCta">CTA (Tugma) qo'shish</Label>
                    </div>
                    {form.showCta && (
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Matn</Label>
                                <Input 
                                    placeholder="Masalan: Adminga yozish" 
                                    value={form.ctaText}
                                    onChange={e => setForm({...form, ctaText: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Havola (Link)</Label>
                                <Input 
                                    placeholder="https://t.me/..." 
                                    value={form.ctaUrl}
                                    onChange={e => setForm({...form, ctaUrl: e.target.value})}
                                />
                            </div>
                        </div>
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader><CardTitle>Narx sozlamalari</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                {!fullProduct ? (
                    <div className="text-sm text-muted-foreground italic">Mahsulot tanlang</div>
                ) : (
                    <div className="space-y-4">
                        <div className="space-y-3">
                            <Label className="text-muted-foreground uppercase text-[10px] font-bold">Koreya (KRW)</Label>
                            {fullProduct.regionalConfigs?.find((c: any) => c.regionCode === 'KOR') ? (() => {
                                const korConfig = fullProduct.regionalConfigs.find((c: any) => c.regionCode === 'KOR');
                                if (!korConfig) return <p className="text-xs text-stone-400 italic">Koreya narxi topilmadi</p>;
                                return (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>🇰🇷 Dona narxi</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    ₩{new Intl.NumberFormat('en-US').format(Number(BigInt(korConfig.retailPrice)))} / dona
                                                </p>
                                            </div>
                                            <Switch checked={form.showKrwRetail} onCheckedChange={v => setForm({...form, showKrwRetail: v})} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>🇰🇷 Optom narxi</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    ₩{new Intl.NumberFormat('en-US').format(Number(BigInt(korConfig.wholesalePrice)))} dan — {korConfig.minWholesaleQty || 5} tadan
                                                </p>
                                            </div>
                                            <Switch checked={form.showKrwWholesale} onCheckedChange={v => setForm({...form, showKrwWholesale: v})} />
                                        </div>
                                    </>
                                );
                            })() : (
                                <p className="text-xs text-stone-400 italic">Koreya uchun narx kiritilmagan</p>
                            )}
                        </div>

                        <div className="pt-2 pb-2 border-b" />

                        <div className="space-y-3">
                            <Label className="text-muted-foreground uppercase text-[10px] font-bold">O'zbekiston (UZS)</Label>
                            {fullProduct.regionalConfigs?.find((c: any) => c.regionCode === 'UZB') && latestRate ? (() => {
                                const uzbConfig = fullProduct.regionalConfigs.find((c: any) => c.regionCode === 'UZB');
                                if (!uzbConfig) return <p className="text-xs text-stone-400 italic">O'zbekiston narxi topilmadi</p>;
                                
                                const weightGrams = fullProduct.weightGrams || 0;
                                const krwToUzs = BigInt(latestRate.krwToUzs);
                                const cargoRateKrw = BigInt(latestRate.cargoRateKrwPerKg);
                                
                                const retailKrw = BigInt(uzbConfig.retailPrice);
                                const retailProductUzsMinor = retailKrw * krwToUzs * 100n;
                                const retailCargoUzsMinor = (BigInt(weightGrams) * cargoRateKrw * krwToUzs * 100n) / 1000n;
                                const round1000UZS = (val: bigint) => (val / 100000n) * 100000n + (val % 100000n >= 50000n ? 100000n : 0n);
                                const retailUzs = round1000UZS(retailProductUzsMinor) + round1000UZS(retailCargoUzsMinor);

                                const wholesaleKrw = BigInt(uzbConfig.wholesalePrice);
                                const wholesaleProductUzsMinor = wholesaleKrw * krwToUzs * 100n;
                                const wholesaleCargoUzsMinor = (BigInt(weightGrams) * cargoRateKrw * krwToUzs * 100n) / 1000n;
                                const wholesaleUzs = round1000UZS(wholesaleProductUzsMinor) + round1000UZS(wholesaleCargoUzsMinor);

                                return (
                                    <>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>🇺🇿 Dona narxi</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatUzs(retailUzs)} / dona
                                                </p>
                                            </div>
                                            <Switch checked={form.showUzsRetail} onCheckedChange={v => setForm({...form, showUzsRetail: v})} />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <Label>🇺🇿 Optom narxi</Label>
                                                <p className="text-xs text-muted-foreground">
                                                    {formatUzs(wholesaleUzs)} dan — {uzbConfig.minWholesaleQty || 5} tadan
                                                </p>
                                            </div>
                                            <Switch checked={form.showUzsWholesale} onCheckedChange={v => setForm({...form, showUzsWholesale: v})} />
                                        </div>
                                    </>
                                );
                            })() : (
                                <p className="text-xs text-stone-400 italic">O'zbekiston narxi yoki kurs topilmadi</p>
                            )}
                        </div>
                    </div>
                )}
              </CardContent>
            </Card>
          )}

          {step === 5 && (
            <Card>
              <CardHeader><CardTitle>Havolalar va Kontaktlar</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                      <Label>📞 Telefon raqamni ko'rsatish</Label>
                      <Switch checked={form.showAdminPhone} onCheckedChange={v => setForm({...form, showAdminPhone: v})} />
                  </div>
                  {form.showAdminPhone && (
                      <Input 
                          value={form.adminPhone} 
                          onChange={e => setForm({...form, adminPhone: e.target.value})} 
                          placeholder="+998 90 123 45 67"
                      />
                  )}
                </div>
                
                <div className="pt-4 border-t space-y-4">
                  <Label className="text-muted-foreground uppercase text-[10px] font-bold">Ijtimoiy tarmoqlar</Label>
                  
                  {/* Link 1 */}
                  <div className="space-y-2 p-3 border rounded-lg bg-stone-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <Label>Havola 1</Label>
                        <Switch checked={form.link1Show} onCheckedChange={v => setForm({...form, link1Show: v})} />
                    </div>
                    {form.link1Show && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input placeholder="Matn (Masalan: Telegram)" value={form.link1Text} onChange={e => setForm({...form, link1Text: e.target.value})} />
                            <Input placeholder="URL (https://...)" value={form.link1Url} onChange={e => setForm({...form, link1Url: e.target.value})} />
                        </div>
                    )}
                  </div>

                  {/* Link 2 */}
                  <div className="space-y-2 p-3 border rounded-lg bg-stone-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <Label>Havola 2</Label>
                        <Switch checked={form.link2Show} onCheckedChange={v => setForm({...form, link2Show: v})} />
                    </div>
                    {form.link2Show && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input placeholder="Matn (Masalan: Instagram)" value={form.link2Text} onChange={e => setForm({...form, link2Text: e.target.value})} />
                            <Input placeholder="URL (https://...)" value={form.link2Url} onChange={e => setForm({...form, link2Url: e.target.value})} />
                        </div>
                    )}
                  </div>

                  {/* Link 3 */}
                  <div className="space-y-2 p-3 border rounded-lg bg-stone-50/50">
                    <div className="flex items-center justify-between mb-2">
                        <Label>Havola 3</Label>
                        <Switch checked={form.link3Show} onCheckedChange={v => setForm({...form, link3Show: v})} />
                    </div>
                    {form.link3Show && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <Input placeholder="Matn (Masalan: Website)" value={form.link3Text} onChange={e => setForm({...form, link3Text: e.target.value})} />
                            <Input placeholder="URL (https://...)" value={form.link3Url} onChange={e => setForm({...form, link3Url: e.target.value})} />
                        </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 6 && (
            <Card>
              <CardHeader><CardTitle>Kanallar va Vaqt</CardTitle></CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                    <Label>Yuboriladigan kanallar</Label>
                    <div className="grid grid-cols-1 gap-2">
                        {channels.map((c) => (
                            <label key={c.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/50 cursor-pointer">
                                <Checkbox 
                                    checked={form.channelIds.includes(c.id)}
                                    onCheckedChange={v => {
                                        setForm((prev: any) => ({
                                            ...prev,
                                            channelIds: v 
                                                ? [...prev.channelIds, c.id]
                                                : prev.channelIds.filter((id: string) => id !== c.id)
                                        }));
                                    }}
                                />
                                <div className="flex-1">
                                    <p className="text-sm font-medium">{c.name}</p>
                                    <p className="text-[10px] text-muted-foreground uppercase">{c.chatType} • {c.language}</p>
                                </div>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="pt-4 border-t space-y-4">
                    <Label>Vaqt</Label>
                    <RadioGroup 
                        value={form.scheduledAt ? 'LATER' : 'NOW'} 
                        onValueChange={(v: string) => setForm({...form, scheduledAt: v === 'NOW' ? '' : new Date().toISOString()})}
                    >
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="NOW" id="now" />
                            <Label htmlFor="now">Hozir yuborish</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                            <RadioGroupItem value="LATER" id="later" />
                            <Label htmlFor="later">Keyinroq (Schedule)</Label>
                        </div>
                    </RadioGroup>
                    {form.scheduledAt && (
                        <Input 
                            type="datetime-local" 
                            onChange={e => setForm({...form, scheduledAt: e.target.value})}
                        />
                    )}
                </div>
              </CardContent>
            </Card>
          )}

          {step === 7 && (
            <Card>
              <CardHeader><CardTitle>Tayyor!</CardTitle></CardHeader>
              <CardContent className="text-center py-12">
                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                    <Send className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-lg font-medium">Post yuborishga tayyor</h3>
                <p className="text-sm text-muted-foreground mt-2 max-w-xs mx-auto">
                    Barcha ma'lumotlarni tekshirib, saqlash yoki yuborish tugmasini bosing.
                </p>
              </CardContent>
              <CardFooter className="flex gap-3">
                 <Button variant="outline" className="flex-1" onClick={() => createMutation.mutate('DRAFT')} disabled={createMutation.isPending}>
                     {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null} Qoralama
                 </Button>
                 <Button className="flex-1" onClick={() => createMutation.mutate(form.scheduledAt ? 'SCHEDULED' : 'SENT')} disabled={createMutation.isPending}>
                    {createMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    {form.scheduledAt ? 'Rejalashtirish' : 'Yuborish'}
                 </Button>
              </CardFooter>
            </Card>
          )}

          <div className="flex justify-between pt-4">
            <Button variant="ghost" onClick={prevStep} disabled={step === 1}>
                <ArrowLeft className="mr-2 h-4 w-4" /> Orqaga
            </Button>
            {step < 7 && (
                <Button onClick={nextStep}>
                    Oldinga <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            )}
          </div>
        </div>

        {/* Right: Preview (40%) */}
        <div className="lg:col-span-4 sticky top-24">
          <p className="text-[10px] uppercase font-bold text-muted-foreground mb-3 tracking-widest text-center">Live Preview</p>
          <div className="bg-[#e7ebf0] p-6 rounded-[32px] shadow-inner min-h-[500px]">
            <div className="max-w-[320px] mx-auto bg-white rounded-2xl shadow-sm overflow-hidden animate-in fade-in duration-300">
                {form.imageUrls.length > 0 ? (
                    <img src={form.imageUrls[0]} className="w-full aspect-square object-cover" />
                ) : (
                    <div className="w-full aspect-square bg-stone-100 flex items-center justify-center text-stone-300">
                        <Camera className="w-12 h-12" strokeWidth={1} />
                    </div>
                )}
                <div className="p-3 text-[14px] leading-normal whitespace-pre-wrap font-sans">
                    <div dangerouslySetInnerHTML={{ __html: captionPreview.replace(/\n/g, '<br/>') }} />
                </div>
                <div className="px-3 pb-3">
                    <div className="h-9 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-sm font-medium">
                        {form.ctaType === 'BUY_NOW' ? 'Hozir sotib olish' : 
                         form.ctaType === 'DM_US' ? 'Lichkaga yozish' : 
                         form.ctaType === 'VISIT_WEB' ? 'Saytga o\'tish' : 
                         form.ctaCustomText || 'Tugma'}
                    </div>
                </div>
            </div>
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-4 italic">
            Eslatma: Telegramda ko'rinish biroz farq qilishi mumkin.
          </p>
        </div>
      </div>
    </div>
  );
}
