import { createFileRoute } from '@tanstack/react-router';
import { CouponFormPage } from '@/app/coupons/CouponFormPage';

export const Route = createFileRoute('/_app/coupons/$id/edit')({
  component: CouponFormPage,
});
