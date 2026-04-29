import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { telegramApi } from './api/telegram.api';
import { useNavigate, Link } from '@tanstack/react-router';
import { Route } from '../../routes/_app/telegram/index';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Send, Clock, AlertCircle, Radio, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty
} from '@/components/ui/DataTable';
import { TablePagination } from '@/components/ui/TablePagination';

export function TelegramDashboard() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();

  const { data: postsData, isLoading: postsLoading } = useQuery({
    queryKey: ['tg-posts', { page, limit }],
    queryFn: () => telegramApi.listPosts({ page, limit }),
  });

  const { data: channels = [], isLoading: channelsLoading } = useQuery({
    queryKey: ['tg-channels'],
    queryFn: () => telegramApi.listChannels(),
  });

  const posts = postsData?.data || [];
  const totalPages = postsData ? Math.ceil(postsData.total / limit) : 0;

  const stats = React.useMemo(() => {
    // Note: stats based on paginated data will only reflect the current page,
    // but preserving the original logic structure for now.
    const data = postsData?.data || [];
    return {
      sent: data.filter(p => p.status === 'SENT').length,
      scheduled: data.filter(p => p.status === 'SCHEDULED').length,
      failed: data.filter(p => p.status === 'FAILED').length,
      channelsCount: channels.length,
    };
  }, [postsData, channels]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SENT': return <Badge variant="success" className="rounded-full">Yuborildi</Badge>;
      case 'SCHEDULED': return <Badge className="bg-blue-500 hover:bg-blue-500 border-none rounded-full">Rejalashtirildi</Badge>;
      case 'FAILED': return <Badge variant="destructive" className="rounded-full">Xatolik</Badge>;
      case 'DRAFT': return <Badge variant="secondary" className="rounded-full">Qoralama</Badge>;
      default: return <Badge variant="outline" className="rounded-full">{status}</Badge>;
    }
  };

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telegram Boshqaruvi</h1>
          <p className="text-muted-foreground">Kanal va postlarni boshqarish</p>
        </div>
        <Button onClick={() => navigate({ to: '/telegram/posts/new' } as any)}>
          <Plus className="mr-2 h-4 w-4" />
          Yangi post
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Jami yuborildi</CardTitle>
            <Send className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sent}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejalashtirilgan</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Xatoliklar</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failed}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ulangan kanallar</CardTitle>
            <Radio className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.channelsCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight">Postlar tarixi</h2>
        </div>
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Mahsulot</DataTableHead>
              <DataTableHead>Turi</DataTableHead>
              <DataTableHead>Holat</DataTableHead>
              <DataTableHead>Sana</DataTableHead>
              <DataTableHead className="text-right">Amallar</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {postsLoading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <DataTableRow key={i}>
                  <DataTableCell><Skeleton className="h-4 w-[150px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[80px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-6 w-[80px] rounded-full" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-4 w-[100px]" /></DataTableCell>
                  <DataTableCell><Skeleton className="h-8 w-8 ml-auto rounded" /></DataTableCell>
                </DataTableRow>
              ))
            ) : posts.length === 0 ? (
              <DataTableEmpty colSpan={5} message="Hali postlar yo'q" />
            ) : (
              posts.map((post: any) => (
                <DataTableRow key={post.id}>
                  <DataTableCell className="font-medium text-stone-900">{post.productName || '—'}</DataTableCell>
                  <DataTableCell className="text-xs uppercase font-medium tracking-wide text-stone-500">{post.postType}</DataTableCell>
                  <DataTableCell>{getStatusBadge(post.status)}</DataTableCell>
                  <DataTableCell className="text-sm text-stone-500">
                    {post.sentAt ? format(new Date(post.sentAt), 'dd.MM.yyyy HH:mm') : 
                     post.scheduledAt ? format(new Date(post.scheduledAt), 'dd.MM.yyyy HH:mm') : 
                     format(new Date(post.createdAt), 'dd.MM.yyyy HH:mm')}
                  </DataTableCell>
                  <DataTableCell className="text-right">
                    <Button variant="ghost" size="icon" className="text-stone-400 hover:text-stone-900" asChild>
                      <Link to="/telegram/posts/$postId" params={{ postId: post.id }}>
                        <Eye className="h-4 w-4" />
                      </Link>
                    </Button>
                  </DataTableCell>
                </DataTableRow>
              ))
            )}
          </DataTableBody>
        </DataTable>

        {!postsLoading && (
          <TablePagination 
            currentPage={page} 
            totalPages={totalPages} 
            pageSize={limit} 
            onPageChange={handlePageChange} 
            onPageSizeChange={handlePageSizeChange} 
          />
        )}
      </div>
    </div>
  );
}
