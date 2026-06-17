import { createFileRoute } from '@tanstack/react-router';
import { ShippingBoxesPage } from '@/app/settings/ShippingBoxesPage';

export const Route = createFileRoute('/_app/settings/shipping-boxes')({
  component: ShippingBoxesPage,
});
