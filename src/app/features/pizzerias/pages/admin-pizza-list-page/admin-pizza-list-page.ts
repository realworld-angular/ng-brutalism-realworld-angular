import { ChangeDetectionStrategy, Component, inject, signal, ViewChild } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { PizzaApi } from '../../services/pizza-api';
import { Callout } from '../../../../shared/components/callout/callout';
import { Pizza } from '../../models/pizza.models';
import { NbButton } from '@ng-brutalism/ui';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import { EmptyState } from '../../../../shared/components/empty-state/empty-state';
import { AdminPizzaFormDialog } from '../../components/admin-pizza-form-dialog/admin-pizza-form-dialog';
import { AdminPizzaRow } from '../../components/admin-pizza-row/admin-pizza-row';

@Component({
  selector: 'rw-admin-pizzas-page',
  imports: [NbButton, Spinner, Callout, EmptyState, AdminPizzaRow, AdminPizzaFormDialog],
  templateUrl: './admin-pizza-list-page.html',
  styleUrl: './admin-pizza-list-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPizzaListPage {
  private readonly api = inject(PizzaApi);
  @ViewChild(AdminPizzaFormDialog) private readonly pizzaFormDialog!: AdminPizzaFormDialog;

  protected readonly pizzasResource = httpResource<Pizza[]>(() => '/api/admin/pizzeria/pizzas');

  protected readonly deleteError = signal('');

  protected openCreate(): void {
    this.openPizzaFormDialog(null);
  }

  protected openEdit(pizza: Pizza): void {
    this.openPizzaFormDialog(pizza);
  }

  private async openPizzaFormDialog(pizza: Pizza | null): Promise<void> {
    const result = await this.pizzaFormDialog.open(pizza);
    if (!result) return;
    const { pizza: updatedPizza, mode } = result;
    if (mode === 'edit') {
      this.pizzasResource.set(
        (this.pizzasResource.value() ?? []).map((existingPizza) =>
          existingPizza.id === updatedPizza.id ? updatedPizza : existingPizza,
        ),
      );
    } else {
      this.pizzasResource.set([...(this.pizzasResource.value() ?? []), updatedPizza]);
    }
  }

  protected onPizzaDeleted(pizza: Pizza): void {
    this.pizzasResource.set((this.pizzasResource.value() ?? []).filter((p) => p.id !== pizza.id));
  }

  protected onDeleteError(message: string): void {
    this.deleteError.set(message);
  }
}
