import { createFileRoute } from '@tanstack/react-router';
import { InventoryDetailPage } from '../../../app/inventory/InventoryDetailPage';

export const Route = createFileRoute('/_app/inventory/$productId')({
  component: InventoryDetailPage,
});
