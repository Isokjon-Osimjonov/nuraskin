import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from './api/team.api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  DialogDescription
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Trash2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/auth.store';
import { format } from 'date-fns';
import { Route } from '../../../routes/_app/settings/team';
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

export function TeamListPage() {
  const { page, limit } = Route.useSearch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore(s => s.user);

  const { data: rawTeam = [], isLoading } = useQuery({
    queryKey: ['team'],
    queryFn: () => teamApi.getAll(),
  });

  const isPaginatedResponse = !Array.isArray(rawTeam) && (rawTeam as any).data;
  const teamList = Array.isArray(rawTeam) ? rawTeam : (rawTeam as any).data || [];
  const totalItems = isPaginatedResponse ? (rawTeam as any).total : teamList.length;
  
  const team = Array.isArray(rawTeam) 
    ? teamList.slice((page - 1) * limit, page * limit) 
    : teamList;
  const totalPages = Math.ceil(totalItems / limit);

  const handlePageChange = (newPage: number) => {
    navigate({ search: { page: newPage, limit } as any });
  };

  const handlePageSizeChange = (newSize: number) => {
    navigate({ search: { page: 1, limit: newSize } as any });
  };

  const [isInviteOpen, setIsInviteOpen] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [newMember, setNewMember] = React.useState({ 
    fullName: '', 
    email: '', 
    role: 'ADMIN', 
    initialPassword: '',
    mustChangePassword: true
  });

  const inviteMutation = useMutation({
    mutationFn: () => teamApi.invite(newMember as any),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      setIsInviteOpen(false);
      setNewMember({ fullName: '', email: '', role: 'ADMIN', initialPassword: '', mustChangePassword: true });
      toast.success("Foydalanuvchi muvaffaqiyatli taklif qilindi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => teamApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success("Foydalanuvchi o'chirildi");
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi"),
  });

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Jamoa boshqaruvi</h1>
          <p className="text-muted-foreground">Admin panelga kirish huquqiga ega foydalanuvchilar</p>
        </div>
        <Button onClick={() => setIsInviteOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Yangi a'zo
        </Button>
      </div>

      <div className="space-y-4">
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Foydalanuvchi</DataTableHead>
              <DataTableHead>Email</DataTableHead>
              <DataTableHead>Rol</DataTableHead>
              <DataTableHead>Holat</DataTableHead>
              <DataTableHead>Oxirgi kirish</DataTableHead>
              <DataTableHead className="text-right">Amallar</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {isLoading ? (
               Array.from({ length: 5 }).map((_, i) => (
                 <DataTableRow key={i}>
                    <DataTableCell><Skeleton className="h-4 w-[150px]" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-4 w-[200px]" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-5 w-[60px] rounded-full" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-5 w-[80px] rounded-full" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-4 w-[120px]" /></DataTableCell>
                    <DataTableCell><Skeleton className="h-8 w-8 rounded ml-auto" /></DataTableCell>
                 </DataTableRow>
               ))
            ) : team.length === 0 ? (
               <DataTableEmpty colSpan={6} message="Foydalanuvchilar topilmadi" />
            ) : team.map((member: any) => (
              <DataTableRow key={member.id}>
                <DataTableCell>
                  <div className="font-medium text-stone-900">{member.fullName}</div>
                  {member.id === currentUser?.id && (
                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-bold uppercase mt-1 inline-block">Siz</span>
                  )}
                </DataTableCell>
                <DataTableCell className="text-muted-foreground">{member.email}</DataTableCell>
                <DataTableCell>
                  <Badge variant="secondary" className="font-mono text-[10px] tracking-wide rounded-full">{member.role}</Badge>
                </DataTableCell>
                <DataTableCell>
                  <div className="flex flex-col gap-1 items-start">
                    {member.isActive ? (
                      <Badge variant="success" className="rounded-full">Faol</Badge>
                    ) : (
                      <Badge variant="outline" className="rounded-full text-muted-foreground">Nofaol</Badge>
                    )}
                    {member.mustChangePassword && (
                      <span className="text-[10px] text-orange-600 font-medium italic">Parolni o'zgartirishi kutilmoqda</span>
                    )}
                  </div>
                </DataTableCell>
                <DataTableCell className="text-stone-500 text-sm">
                  {member.lastLoginAt ? format(new Date(member.lastLoginAt), 'dd.MM.yyyy HH:mm') : 'Hech qachon'}
                </DataTableCell>
                <DataTableCell className="text-right">
                  {member.id !== currentUser?.id && (
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-stone-400 hover:text-red-600"
                        onClick={() => { if(confirm("O'chirishni tasdiqlaysizmi?")) deleteMutation.mutate(member.id); }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
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

      {/* Invite Modal */}
      <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Yangi jamoa a'zosi</DialogTitle>
            <DialogDescription>
              Foydalanuvchi ma'lumotlarini kiriting va boshlang'ich parolni o'rnating.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To'liq ism</label>
              <Input 
                placeholder="Masalan: Aziz Alimov" 
                value={newMember.fullName}
                onChange={e => setNewMember(p => ({ ...p, fullName: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email manzil</label>
              <Input 
                type="email" 
                placeholder="aziz@example.com" 
                value={newMember.email}
                onChange={e => setNewMember(p => ({ ...p, email: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Rol</label>
              <Select value={newMember.role} onValueChange={v => setNewMember(p => ({ ...p, role: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                  <SelectItem value="WAREHOUSE">Ombor (Warehouse)</SelectItem>
                  <SelectItem value="VIEWER">Kuzatuvchi (Viewer)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Boshlang'ich parol</label>
              <div className="relative">
                <Input 
                  type={showPassword ? "text" : "password"} 
                  placeholder="Kamida 8 ta belgi" 
                  value={newMember.initialPassword}
                  onChange={e => setNewMember(p => ({ ...p, initialPassword: e.target.value }))}
                />
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon" 
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsInviteOpen(false)}>Bekor qilish</Button>
            <Button 
              onClick={() => inviteMutation.mutate()} 
              disabled={inviteMutation.isPending || newMember.initialPassword.length < 8}
            >
              Yaratish
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
