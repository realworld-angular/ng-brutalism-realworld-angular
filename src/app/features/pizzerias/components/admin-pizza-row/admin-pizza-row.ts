import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  output,
  signal,
  ViewChild,
} from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { Pizza } from '../../models/pizza.models';
import { PizzaApi } from '../../services/pizza-api';
import {
  ConfirmDialog,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: '[rw-admin-pizza-row]',
  imports: [DecimalPipe, NgOptimizedImage, ConfirmDialog],
  templateUrl: './admin-pizza-row.html',
  styleUrl: './admin-pizza-row.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.aria-label]': '"Pizza: " + pizza().name' },
})
export class AdminPizzaRow {
  private readonly api = inject(PizzaApi);
  private readonly destroyRef = inject(DestroyRef);

  @ViewChild(ConfirmDialog) private readonly confirmDlg!: ConfirmDialog;

  readonly pizza = input.required<Pizza>();

  readonly edit = output<Pizza>();
  readonly deleted = output<Pizza>();
  readonly deleteError = output<string>();

  protected readonly deleting = signal(false);

  protected toppingLabels(): string {
    return (this.pizza().toppings ?? []).map((t) => t.label).join(', ');
  }

  protected menuListTotalPrice(): number {
    const pizza = this.pizza();
    return pizza.basePrice + (pizza.toppings ?? []).reduce((sum, t) => sum + t.price, 0);
  }

  protected async promptDelete(): Promise<void> {
    const pizza = this.pizza();
    const message = `Delete "${pizza.name}"? This removes the pizza from the menu. Customers can no longer order it.`;

    const result = await this.confirmDlg.open({
      title: 'Delete pizza?',
      message,
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete',
    });

    if (result === 'confirmed' && !this.deleting()) {
      this.deleteError.emit('');
      this.deleting.set(true);
      try {
        await firstValueFrom(this.api.deletePizza(pizza.id).pipe(takeUntilDestroyed(this.destroyRef)));
        this.deleted.emit(pizza);
      } catch (err: unknown) {
        this.deleteError.emit(
          err && typeof err === 'object' && 'error' in err
            ? ((err as { error: { message?: string } }).error?.message ?? 'Delete failed')
            : 'Delete failed',
        );
      } finally {
        this.deleting.set(false);
      }
    }
  }
}
