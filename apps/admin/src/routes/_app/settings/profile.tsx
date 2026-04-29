import * as React from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/app/settings/team/api/team.api';
import { useAuthStore } from '@/stores/auth.store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { User, Lock, Save, Eye, EyeOff, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_app/settings/profile')({
  component: ProfilePage,
});

function ProfilePage() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [fullName, setFullName] = React.useState(user?.fullName || '');
  
  const [passForm, setPassForm] = React.useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showCurrent, setShowCurrent] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);

  const profileMutation = useMutation({
    mutationFn: (data: { fullName: string }) => teamApi.update(user?.id || '', data),
    onSuccess: () => {
      toast.success("Profil yangilandi");
      // Note: Ideally we'd update the auth store here too if we want immediate name change in sidebar
      queryClient.invalidateQueries({ queryKey: ['team'] });
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi")
  });

  const passMutation = useMutation({
    mutationFn: () => teamApi.changePassword(user?.id || '', passForm),
    onSuccess: () => {
      toast.success("Parol muvaffaqiyatli o'zgartirildi");
      setPassForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    },
    onError: (err: any) => toast.error(err.message || "Xatolik yuz berdi")
  });

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    profileMutation.mutate({ fullName });
  };

  const handlePassSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (passForm.newPassword !== passForm.confirmPassword) {
      toast.error("Yangi parollar mos kelmadi");
      return;
    }
    passMutation.mutate();
  };

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold tracking-tight">Profil sozlamalari</h1>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Shaxsiy ma'lumotlar
          </CardTitle>
          <CardDescription>Ismingizni tahrirlashingiz mumkin</CardDescription>
        </CardHeader>
        <form onSubmit={handleProfileSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">To'liq ism</label>
              <Input 
                value={fullName} 
                onChange={e => setFullName(e.target.value)} 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Email (o'zgartirib bo'lmaydi)</label>
              <Input value={user?.email || ''} disabled className="bg-stone-50" />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={profileMutation.isPending}>
              {profileMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Saqlash
            </Button>
          </CardFooter>
        </form>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Parolni o'zgartirish
          </CardTitle>
          <CardDescription>Hisobingiz xavfsizligi uchun parolni yangilab turing</CardDescription>
        </CardHeader>
        <form onSubmit={handlePassSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Joriy parol</label>
              <div className="relative">
                <Input
                  type={showCurrent ? "text" : "password"}
                  value={passForm.currentPassword}
                  onChange={e => setPassForm(p => ({ ...p, currentPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowCurrent(!showCurrent)}
                >
                  {showCurrent ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Yangi parol</label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  value={passForm.newPassword}
                  onChange={e => setPassForm(p => ({ ...p, newPassword: e.target.value }))}
                  required
                  placeholder="Kamida 8 belgi"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Tasdiqlash</label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  value={passForm.confirmPassword}
                  onChange={e => setPassForm(p => ({ ...p, confirmPassword: e.target.value }))}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={passMutation.isPending}>
              {passMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Parolni yangilash
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
