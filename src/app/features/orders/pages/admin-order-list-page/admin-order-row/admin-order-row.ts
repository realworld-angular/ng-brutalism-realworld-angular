import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  ViewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { DatePipe, DecimalPipe, NgOptimizedImage } from '@angular/common';
import { OrderApi } from '../../../order-api';
import { AdminOrderListItem } from '../../../order.models';
import {
  ConfirmDialog,
} from '../../../../../shared/components/confirm-dialog/confirm-dialog';
import { StatusBadge } from '../../../../../shared/components/status-badge/status-badge';

@Component({
  selector: 'tr[rw-admin-order-row]',
  imports: [DecimalPipe, DatePipe, NgOptimizedImage, StatusBadge, ConfirmDialog],
  templateUrl: './admin-order-row.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminOrderRow {
  private readonly api = inject(OrderApi);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(ConfirmDialog) private readonly confirmDlg!: ConfirmDialog;

  public readonly order = input.required<AdminOrderListItem>();

  public readonly updateOrder = output<AdminOrderListItem>();
  public readonly showFeedback = output<{ variant: 'error' | 'success'; message: string }>();

  public async promptCancelOrder(): Promise<void> {
    const result = await this.confirmDlg.open({
      title: 'Cancel order?',
      message: 'Cancel this pending order? This sets the status to cancelled.',
      cancelLabel: 'Keep order',
      confirmLabel: 'Cancel order',
    });

    if (result === 'confirmed') {
      try {
        const updated = await firstValueFrom(
          this.api.cancelOrder(this.order().id).pipe(takeUntilDestroyed(this.destroyRef)),
        );
        this.updateOrder.emit(updated);
        this.showFeedback.emit({ variant: 'success', message: 'Order cancelled.' });
      } catch (err: unknown) {
        this.showFeedback.emit({
          variant: 'error',
          message:
            err && typeof err === 'object' && 'error' in err
              ? ((err as { error: { message?: string } }).error?.message ?? 'Failed')
              : 'Failed',
        });
      }
    }
  }

  public async promptDeliverOrder(): Promise<void> {
    const result = await this.confirmDlg.open({
      title: 'Mark delivered?',
      message: 'Mark this order as delivered?',
      cancelLabel: 'Not yet',
      confirmLabel: 'Mark delivered',
    });

    if (result === 'confirmed') {
      try {
        const updated = await firstValueFrom(
          this.api.deliverOrder(this.order().id).pipe(takeUntilDestroyed(this.destroyRef)),
        );
        this.updateOrder.emit(updated);
        this.showFeedback.emit({ variant: 'success', message: 'Order marked as delivered.' });
      } catch (err: unknown) {
        this.showFeedback.emit({
          variant: 'error',
          message:
            err && typeof err === 'object' && 'error' in err
              ? ((err as { error: { message?: string } }).error?.message ?? 'Failed')
              : 'Failed',
        });
      }
    }
  }
}
