import { createFileRoute } from '@tanstack/react-router';
import { PostCreatePage } from '@/app/telegram/PostCreatePage';

export const Route = createFileRoute('/_app/telegram/posts/new')({
  component: PostCreatePage,
});
