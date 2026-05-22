import { ChangeDetectionStrategy, Component, input, computed } from '@angular/core';
import { NbBadge } from '@ng-brutalism/ui';
import type { OrderStatus } from '../../../features/orders/order.models';

type NbBadgeVariant = 'default' | 'secondary' | 'success' | 'warning' | 'danger';

const STATUS_CONFIG: Record<OrderStatus, { label: string; variant: NbBadgeVariant }> = {
  PENDING: { label: 'Pending', variant: 'warning' },
  PREPARING: { label: 'Preparing', variant: 'secondary' },
  READY: { label: 'Ready', variant: 'success' },
  DELIVERED: { label: 'Delivered', variant: 'default' },
  CANCELLED: { label: 'Cancelled', variant: 'default' },
};

@Component({
  selector: 'rw-status-badge',
  imports: [NbBadge],
  templateUrl: './status-badge.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StatusBadge {
  public readonly status = input.required<OrderStatus>();

  protected readonly config = computed<{ label: string; variant: NbBadgeVariant }>(
    () => STATUS_CONFIG[this.status()] ?? STATUS_CONFIG.PENDING,
  );
}
