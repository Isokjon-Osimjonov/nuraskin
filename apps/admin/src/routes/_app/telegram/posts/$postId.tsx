import { createFileRoute } from '@tanstack/react-router';
import { PostDetailPage } from '@/app/telegram/PostDetailPage';

export const Route = createFileRoute('/_app/telegram/posts/$postId')({
  component: PostDetailPage,
});
