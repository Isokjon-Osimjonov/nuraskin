import { api } from '@/lib/api';
import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { mapAuthErrorToMessage } from '@nuraskin/shared-utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/stores/auth.store';

const LoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginInput = z.infer<typeof LoginSchema>;

export function LoginForm({ className, ...props }: React.ComponentPropsWithoutRef<'div'>) {
  const [isPending, setIsPending] = useState(false);
  const setAuth = useAuthStore(s => s.setAuth);
  const navigate = useNavigate();
  const search = useSearch({ from: '/login' });

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  async function onSubmit(data: LoginInput) {
    setIsPending(true);
    try {
      const json = await api.post<any>('/auth/login', data);
      setAuth(json.token, json.user);
      navigate({ to: search.redirect || '/' });
    } catch (err: any) {
      toast.error(mapAuthErrorToMessage(err));
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>Email va parolni kiriting.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  {...form.register('email')}
                />
                {form.formState.errors.email && (
                  <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                )}
              </div>
              <div className="grid gap-2">
                <div className="flex items-center">
                  <Label htmlFor="password">Parol</Label>
                </div>
                <Input id="password" type="password" {...form.register('password')} />
                {form.formState.errors.password && (
                  <p className="text-xs text-destructive">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Login
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
