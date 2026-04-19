import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuthStore } from '@/stores/auth.store';

export const Route = createFileRoute('/login')({
  component: LoginPage,
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginInput = z.infer<typeof LoginSchema>;

function LoginForm() {
  const [isPending, setIsPending] = useState(false);
  const setAuth = useAuthStore((s) => s.setAuth);
  const navigate = useNavigate();

  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: '', password: '' },
  });

  function onSubmit(_data: LoginInput) {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
      setAuth('mock-token', { id: '1', email: _data.email, name: 'Admin' });
      navigate({ to: '/' });
    }, 1000);
  }

  function onError() {
    toast.error('Login failed. Check your credentials.');
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          className="mt-1 w-full"
          {...form.register('email')}
        />
        {form.formState.errors.email && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.email.message}
          </p>
        )}
      </div>

      <div className="mt-4">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          className="mt-1 w-full"
          {...form.register('password')}
        />
        {form.formState.errors.password && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.password.message}
          </p>
        )}
      </div>

      <Button type="submit" className="w-full mt-6" disabled={isPending}>
        {isPending && <Loader2 className="animate-spin" />}
        Sign in
      </Button>
    </form>
  );
}

function LoginPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 dark:from-zinc-950 dark:to-zinc-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card border border-border shadow-lg rounded-xl p-8">
        <div>
          <p className="text-2xl font-bold tracking-tight">NuraSkin</p>
          <p className="text-sm text-muted-foreground mt-1">Admin Panel</p>
        </div>

        <Separator className="my-6" />

        <LoginForm />
      </div>

      <p className="absolute bottom-6 text-center text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        <span onClick={() => navigate({ to: '/' })}>← Back to store</span>
      </p>
    </div>
  );
}
