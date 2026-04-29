import { createFileRoute } from '@tanstack/react-router';
import { ShippingTiersPage } from '@/app/settings/ShippingTiersPage';

export const Route = createFileRoute('/_app/settings/shipping-tiers')({
  component: ShippingTiersPage,
});
