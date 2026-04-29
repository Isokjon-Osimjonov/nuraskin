import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from './api/telegram.api';
import { productsApi } from '../products/api/products.api';
import { exchangeRatesApi } from '../exchange-rates/api/exchange-rates.api';
import { settingsApi } from '../settings/api/settings.api';
import { useParams, useNavigate, Link } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Send, Clock, Trash2, ExternalLink, AlertCircle, CheckCircle2, RefreshCw, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { buildCaptionPreview } from './utils/caption-builder';

export function PostDetailPage() {
  const { postId } = useParams({ from: '/_app/telegram/posts/$postId' });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: post, isLoading } = useQuery({
    queryKey: ['tg-posts', postId],
    queryFn: () => telegramApi.getPost(postId),
  });

  const { data: fullProduct } = useQuery({
    queryKey: ['products', post?.productId],
    queryFn: () => productsApi.getById(post!.productId!),
    enabled: !!post?.productId,
  });

  const { data: latestRate } = useQuery({
    queryKey: ['exchange-rates', 'latest'],
    queryFn: () => exchangeRatesApi.getLatest(),
  });

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsApi.get(),
  });

  const sendMutation = useMutation({
    mutationFn: () => telegramApi.sendPost(postId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tg-posts', postId] });
      toast.success("Post yuborish boshlandi");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: () => telegramApi.removePost(postId),
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['tg-posts'] });
        toast.success("Post o'chirildi");
        navigate({ to: '/telegram' } as any);
    }
  });

  const captionPreview = React.useMemo(() => {
      if (!post) return '';
      return buildCaptionPreview(post, fullProduct, latestRate);
  }, [post, fullProduct, latestRate, settings]);

  if (isLoading) return <div className="p-6">Yuklanmoqda...</div>;
  if (!post) return <div className="p-6 text-center">Post topilmadi</div>;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT': return <Badge className="bg-green-500 hover:bg-green-500 border-none">Yuborildi</Badge>;
      case 'SCHEDULED': return <Badge className="bg-blue-500 hover:bg-blue-500 border-none">Rejalashtirildi</Badge>;
      case 'FAILED': return <Badge variant="destructive">Xatolik</Badge>;
      case 'DRAFT': return <Badge variant="secondary">Qoralama</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate({ to: '/telegram' } as any)}>
            <ArrowLeft />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-3">
                Post #{post.id.slice(0, 8)}
                {getStatusBadge(post.status)}
            </h1>
            <p className="text-muted-foreground text-sm">
                Turi: {post.postType} • Til: {post.language}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
            {post.status === 'DRAFT' && (
                <Button onClick={() => sendMutation.mutate()} disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuborilmoqda...</>
                    ) : (
                        <><Send className="mr-2 h-4 w-4" /> Hozir yuborish</>
                    )}
                </Button>
            )}
            {post.status === 'FAILED' && (
                <Button onClick={() => sendMutation.mutate()} variant="outline" disabled={sendMutation.isPending}>
                    {sendMutation.isPending ? (
                        <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Yuborilmoqda...</>
                    ) : (
                        <><RefreshCw className="mr-2 h-4 w-4" /> Qayta urinish</>
                    )}
                </Button>
            )}
            <Button variant="ghost" className="text-red-500" disabled={deleteMutation.isPending} onClick={() => { if(confirm("O'chirasizmi?")) deleteMutation.mutate(); }}>
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader><CardTitle className="text-lg">Preview</CardTitle></CardHeader>
            <CardContent>
               <div className="bg-[#e7ebf0] p-8 rounded-3xl flex justify-center">
                    <div className="max-w-[320px] w-full bg-white rounded-2xl shadow-sm overflow-hidden">
                        {post.imageUrls.length > 0 && (
                            <img src={post.imageUrls[0]} className="w-full aspect-square object-cover" />
                        )}
                        <div className="p-3 text-[14px] leading-normal whitespace-pre-wrap font-sans">
                            <div dangerouslySetInnerHTML={{ __html: captionPreview.replace(/\n/g, '<br/>') }} />
                        </div>
                    </div>
               </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Yuborilgan kanallar</CardTitle></CardHeader>
            <CardContent className="p-0">
               <Table>
                 <TableHeader>
                    <TableRow>
                        <TableHead>Kanal</TableHead>
                        <TableHead>Holat</TableHead>
                        <TableHead>Message ID</TableHead>
                        <TableHead className="text-right">Sana</TableHead>
                    </TableRow>
                 </TableHeader>
                 <TableBody>
                    {(post as any).channels?.map((c: any) => (
                        <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.name}</TableCell>
                            <TableCell>
                                {c.status === 'SENT' ? (
                                    <Badge className="bg-green-100 text-green-700 border-none">OK</Badge>
                                ) : (
                                    <Badge variant="outline">{c.status}</Badge>
                                )}
                            </TableCell>
                            <TableCell className="font-mono text-xs">
                                {c.messageId || '—'}
                            </TableCell>
                            <TableCell className="text-right text-stone-500 text-sm">
                                {c.sentAt ? format(new Date(c.sentAt), 'dd.MM HH:mm') : '—'}
                            </TableCell>
                        </TableRow>
                    ))}
                 </TableBody>
               </Table>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
            <Card>
                <CardHeader><CardTitle className="text-sm">Ma'lumotlar</CardTitle></CardHeader>
                <CardContent className="text-sm space-y-4">
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Holati:</span>
                        <span className="font-medium">{post.status}</span>
                    </div>
                    <div className="flex justify-between border-b pb-2">
                        <span className="text-muted-foreground">Yaratildi:</span>
                        <span className="font-medium">{format(new Date(post.createdAt), 'dd.MM.yyyy')}</span>
                    </div>
                    {post.scheduledAt && (
                        <div className="flex justify-between border-b pb-2">
                            <span className="text-muted-foreground">Reja:</span>
                            <span className="font-medium text-blue-600">{format(new Date(post.scheduledAt), 'dd.MM HH:mm')}</span>
                        </div>
                    )}
                </CardContent>
            </Card>

            {post.errorMessage && (
                <Card className="border-destructive bg-destructive/5">
                    <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-4 w-4" /> Xatolik xabari
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="text-xs text-destructive font-mono">
                        {post.errorMessage}
                    </CardContent>
                </Card>
            )}
        </div>
      </div>
    </div>
  );
}
