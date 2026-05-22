import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { DecimalPipe, NgOptimizedImage } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { form, FormField, FormRoot, min, required, submit } from '@angular/forms/signals';
import { NbDialog, NbDialogContent, NbDialogActions, NbButton, NbInput, NbTitle } from '@ng-brutalism/ui';
import { CartStore } from '../../../cart/cart.store';
import { Pizza, PizzaOption } from '../../../pizzerias/models/pizza.models';
import { PizzaOrderFormDialogData } from '../../order.models';
import { CatalogImageUrlPipe } from '../../../../shared/pipes/catalog-image-url.pipe';
import { SizeOptionField } from '../pizza-size-option-field/pizza-size-option-field';
import { Spinner } from '../../../../shared/components/spinner/spinner';

interface PizzaOrderFormModel {
  selectedSize: PizzaOption | null;
  extraToppings: boolean[];
  quantity: number;
}

@Component({
  selector: 'rw-pizza-order-form-dialog',
  imports: [
    NbDialog, NbDialogContent, NbDialogActions, NbButton, NbTitle,
    DecimalPipe, NgOptimizedImage, CatalogImageUrlPipe, FormField, FormRoot, NbInput, SizeOptionField, Spinner,
  ],
  templateUrl: './pizza-order-form-dialog.html',
  styleUrl: './pizza-order-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PizzaOrderFormDialog {
  private readonly cartStore = inject(CartStore);
  @ViewChild(NbDialog) private readonly dialog!: NbDialog;

  protected readonly data = signal<PizzaOrderFormDialogData | null>(null);

  private resolve: ((result: string | undefined) => void) | null = null;

  protected readonly sizesResource = httpResource<PizzaOption[]>(() => '/api/options/sizes', {
    defaultValue: [],
  });
  protected readonly toppingsResource = httpResource<PizzaOption[]>(() => '/api/options/toppings', {
    defaultValue: [],
  });

  protected readonly defaultToppings = signal('');

  protected readonly model = signal<PizzaOrderFormModel>({
    selectedSize: null,
    extraToppings: [],
    quantity: 1,
  });

  protected readonly orderForm = form(
    this.model,
    (schema) => {
      required(schema.selectedSize, { message: 'Please select a size' });
      required(schema.quantity, { message: 'Quantity is required' });
      min(schema.quantity, 1, { message: 'Quantity must be at least 1' });
    },
    {
      submission: {
        action: async (form) => {
          if (this.cartStore.hasItemsForOtherPizzeria(this.data()!.pizzeriaId)) {
            this.cartStore.clear();
          }

          const { selectedSize, extraToppings, quantity } = form().value();
          this.cartStore.addItem(
            this.data()!.pizza.id,
            Number(quantity),
            selectedSize?.id ?? null,
            extraToppings
              .map((selected, index) =>
                selected ? this.toppingsResource.value()![index].id : null,
              )
              .filter((t): t is string => t !== null),
            this.data()!.pizzeriaId,
          );
          this.resolve?.('added');
          this.dialog.close();
          return null;
        },
      },
    },
  );

  protected readonly modalTotal = computed<number>(() => {
    const { selectedSize, extraToppings, quantity } = this.orderForm().value();
    const pizza = this.data()?.pizza;
    if (!pizza) return 0;
    const sizePrice = selectedSize?.price ?? 0;
    const toppingsPrice = extraToppings.reduce(
      (sum, topping, index) => sum + (topping ? this.toppingsResource.value()![index].price : 0),
      0,
    );
    return (pizza.basePrice + sizePrice + toppingsPrice) * Number(quantity);
  });

  public constructor() {
    effect(() => {
      const toppings = this.toppingsResource.value();
      if (toppings && this.data()) {
        this.model.update((m) => ({
          ...m,
          extraToppings: toppings.map(() => false),
        }));
      }
    });
  }

  open(data: PizzaOrderFormDialogData): Promise<string | undefined> {
    this.data.set(data);
    this.defaultToppings.set(data.pizza.toppings.map((t) => t.label).join(', '));
    this.model.set({
      selectedSize: null,
      extraToppings: [],
      quantity: 1,
    });
    this.dialog.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  protected save(): void {
    void submit(this.orderForm);
  }

  protected dismiss(): void {
    this.resolve?.(undefined);
    this.dialog.close();
  }

  protected decrementQuantity(): void {
    const current = this.model();
    const qty = Number(current.quantity);
    this.model.set({ ...current, quantity: qty - 1 });
  }

  protected incrementQuantity(): void {
    const current = this.model();
    this.model.set({ ...current, quantity: Number(current.quantity) + 1 });
  }
}
