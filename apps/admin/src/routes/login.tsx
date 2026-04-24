import { createFileRoute, redirect } from '@tanstack/react-router';
import { LoginForm } from '@/components/login-form';
import { useAuthStore } from '@/stores/auth.store';
import { z } from 'zod';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    redirect: z.string().optional(),
  }),
  beforeLoad: () => {
    const token = useAuthStore.getState().token;
    if (token) {
      throw redirect({ to: '/' });
    }
  },
  component: LoginPage,
});

function LoginPage() {
  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm />
      </div>
    </div>
  );
}
