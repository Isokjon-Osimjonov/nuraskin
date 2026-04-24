import { createFileRoute } from '@tanstack/react-router';
import { InventoryOverviewPage } from '../../../app/inventory/InventoryOverviewPage';

export const Route = createFileRoute('/_app/inventory/')({
  component: InventoryOverviewPage,
});
