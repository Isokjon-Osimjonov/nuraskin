import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { telegramApi } from './api/telegram.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Radio, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Route } from '../../routes/_app/telegram/channels';
import { useNavigate } from '@tanstack/react-router';
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

export function ChannelsPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: rawChannels = [], isLoading } = useQuery({
    queryKey: ['tg-channels'],
    queryFn: () => telegramApi.listChannels(),
  });

  const isPaginatedResponse = !Array.isArray(rawChannels) && (rawChannels as any).data;
  const channelsList = Array.isArray(rawChannels) ? rawChannels : (rawChannels as any).data || [];
  const totalItems = isPaginatedResponse ? (rawChannels as any).total : channelsList.length;
  
  const channels = Array.isArray(rawChannels) 
    ? channelsList.slice((page - 1) * limit, page * limit) 
    : channelsList;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  const [isAddOpen, setIsAddOpen] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ ok: boolean, title?: string, error?: string } | null>(null);
  const [isTesting, setIsTesting] = React.useState(false);

  const [newChannel, setNewChannel] = React.useState({ 
    name: '', 
    chatId: '', 
    chatType: 'CHANNEL' as const, 
    language: 'UZB' 
  });

  const testMutation = useMutation({
    mutationFn: (chatId: string) => telegramApi.testChannel(chatId),
    onMutate: () => {
      setIsTesting(true);
      setTestResult(null);
    },
    onSuccess: (res) => {
      setTestResult({ ok: res.ok, title: res.title });
      if (res.ok && !newChannel.name) {
          setNewChannel(prev => ({ ...prev, name: res.title || '' }));
      }
    },
    onError: (err: any) => {
      setTestResult({ ok: false, error: err.message });
    },
    onSettled: () => setIsTesting(false)
  });

  const addMutation = useMutation({
    mutationFn: () => telegramApi.addChannel(newChannel as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tg-channels'] });
      setIsAddOpen(false);
      setNewChannel({ name: '', chatId: '', chatType: 'CHANNEL', language: 'UZB' });
      setTestResult(null);
      toast.success("Kanal muvaffaqiyatli qo'shildi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => telegramApi.removeChannel(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tg-channels'] });
      toast.success("Kanal olib tashlandi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Telegram Kanallar</h1>
          <p className="text-muted-foreground">Post yuboriladigan kanallar va guruhlar</p>
        </div>
        <Button onClick={() => setIsAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Kanal qo'shish
        </Button>
      </div>

      <div className="space-y-4">
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Nomi</DataTableHead>
              <DataTableHead>Chat ID</DataTableHead>
              <DataTableHead>Turi</DataTableHead>
              <DataTableHead>Til</DataTableHead>
              <DataTableHead>Holat</DataTableHead>
              <DataTableHead className="text-right">Amallar</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {isLoading ? (
               Array.from({ length: 3 }).map((_, i) => (
                 <DataTableRow key={i}>
                    <DataTableCell><Skeleton className="h-4 w-[150px]" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-4 w-[100px]" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-5 w-[60px] rounded-full" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-4 w-[40px]" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-5 w-[60px] rounded-full" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-8 w-8 ml-auto rounded" /></DataTableCell>
                 </DataTableRow>
               ))
            ) : channels.length === 0 ? (
                <DataTableEmpty colSpan={6} message="Hali kanallar qo'shilmagan" />
            ) : channels.map((channel: any) => (
              <DataTableRow key={channel.id}>
                <DataTableCell className="font-medium text-stone-900">{channel.name}</DataTableCell>
                <DataTableCell className="font-mono text-xs">{channel.chatId}</DataTableCell>
                <DataTableCell>
                  <Badge variant="outline" className="text-[10px] tracking-wide rounded-full">{channel.chatType}</Badge>
                </DataTableCell>
                <DataTableCell className="text-stone-500">{channel.language}</DataTableCell>
                <DataTableCell>
                  {channel.isActive ? (
                    <Badge variant="success" className="rounded-full">Faol</Badge>
                  ) : (
                    <Badge variant="outline" className="rounded-full">Nofaol</Badge>
                  )}
                </DataTableCell>
                <DataTableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-stone-400 hover:text-red-600"
                    onClick={() => { if(confirm("Kanalni o'chirmoqchimisiz?")) removeMutation.mutate(channel.id); }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>

        {!isLoading && (
          <TablePagination 
            currentPage={page} 
            totalPages={totalPages} 
            pageSize={limit} 
            onPageChange={handlePageChange} 
            onPageSizeChange={handlePageSizeChange} 
          />
        )}
      </div>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi kanal qo'shish</DialogTitle>
            <DialogDescription>
              Bot ushbu kanal yoki guruhda admin bo'lishi shart.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Chat ID</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="@kanal_nomi yoki -100..." 
                  value={newChannel.chatId}
                  onChange={e => setNewChannel(p => ({ ...p, chatId: e.target.value }))}
                />
                <Button 
                    variant="secondary" 
                    disabled={!newChannel.chatId || isTesting}
                    onClick={() => testMutation.mutate(newChannel.chatId)}
                >
                    {isTesting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Test"}
                </Button>
              </div>
              
              {testResult && (
                  <div className={`p-3 rounded-md text-sm flex items-start gap-2 ${testResult.ok ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {testResult.ok ? <CheckCircle2 className="h-5 w-5 shrink-0" /> : <XCircle className="h-5 w-5 shrink-0" />}
                      <div>
                          <p className="font-medium">{testResult.ok ? 'Ulanish muvaffaqiyatli' : 'Xatolik'}</p>
                          <p className="text-xs opacity-90">{testResult.ok ? `Kanal: ${testResult.title}` : testResult.error}</p>
                      </div>
                  </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Til</label>
                  <Select value={newChannel.language} onValueChange={v => setNewChannel(p => ({ ...p, language: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UZB">O'zbekcha</SelectItem>
                      <SelectItem value="RUS">Ruscha</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Turi</label>
                  <Select value={newChannel.chatType} onValueChange={v => setNewChannel(p => ({ ...p, chatType: v as any }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CHANNEL">Kanal</SelectItem>
                      <SelectItem value="GROUP">Guruh</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ichki nom (Tizim uchun)</label>
              <Input 
                placeholder="Masalan: Asosiy kanal (Uz)" 
                value={newChannel.name}
                onChange={e => setNewChannel(p => ({ ...p, name: e.target.value }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddOpen(false)}>Bekor qilish</Button>
            <Button 
                onClick={() => addMutation.mutate()} 
                disabled={!newChannel.name || !newChannel.chatId || !testResult?.ok || addMutation.isPending}
            >
                {addMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Qo'shish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
