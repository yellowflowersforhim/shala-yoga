
import { Badge } from './ui/badge';

interface StatusBadgeProps {
  status: string;
}

export default function StatusBadge({ status }: StatusBadgeProps) {
  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    pending: { label: 'Pendiente', variant: 'secondary' },
    paid: { label: 'Pagado', variant: 'default' },
    failed: { label: 'Fallido', variant: 'destructive' },
    refunded: { label: 'Reembolsado', variant: 'outline' },
    active: { label: 'Activo', variant: 'default' },
    completed: { label: 'Completado', variant: 'secondary' },
    cancelled: { label: 'Cancelado', variant: 'destructive' }
  };

  const config = statusConfig[status] || { label: status, variant: 'secondary' as const };

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
