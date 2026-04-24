import { createFileRoute } from '@tanstack/react-router';
import { ScanPage } from '../../../app/inventory/ScanPage';

export const Route = createFileRoute('/_app/inventory/scan')({
  component: ScanPage,
});
