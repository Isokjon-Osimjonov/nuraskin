import { useAuthStore } from '../stores/auth.store';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { AppLayout } from '../layouts/AppLayout';

export const Route = createFileRoute('/_app')({
  beforeLoad: ({ location }) => {
    const token = useAuthStore.getState().token;
    if (!token) {
      throw redirect({
        to: '/login',
        search: {
          redirect: location.href,
        },
      });
    }
  },
  component: AppLayout,
});
