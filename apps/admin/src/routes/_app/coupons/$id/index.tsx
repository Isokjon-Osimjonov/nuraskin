import { createFileRoute } from '@tanstack/react-router';
import { CouponDetailPage } from '@/app/coupons/CouponDetailPage';

export const Route = createFileRoute('/_app/coupons/$id/')({
  component: CouponDetailPage,
});
