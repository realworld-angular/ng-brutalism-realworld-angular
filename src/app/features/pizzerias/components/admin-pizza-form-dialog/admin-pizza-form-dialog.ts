import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  ViewChild,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { httpResource } from '@angular/common/http';
import { form, FormField, required, disabled, FormRoot, submit, min } from '@angular/forms/signals';
import { NbDialog, NbDialogContent, NbDialogActions, NbButton, NbInput, NbLabel } from '@ng-brutalism/ui';
import { PizzaApi } from '../../services/pizza-api';
import { Callout } from '../../../../shared/components/callout/callout';
import { Pizza, PizzaOption } from '../../models/pizza.models';
import { ImagePicker } from '../../../../shared/components/image-picker/image-picker';
import { firstValueFrom } from 'rxjs';

export interface AdminPizzaFormResult {
  pizza: Pizza;
  mode: 'create' | 'edit';
}

interface AdminPizzaFormModel {
  basePrice: number;
  name: string;
  image: string | null;
  extraToppings: boolean[];
}

@Component({
  selector: 'rw-admin-pizza-form-dialog',
  imports: [
    NbDialog, NbDialogContent, NbDialogActions, NbButton, NbInput, NbLabel,
    DecimalPipe, FormField, FormRoot, ImagePicker, Callout,
  ],
  templateUrl: './admin-pizza-form-dialog.html',
  styleUrl: './admin-pizza-form-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPizzaFormDialog {
  private readonly api = inject(PizzaApi);
  @ViewChild(NbDialog) private readonly dialog!: NbDialog;

  protected readonly data = signal<Pizza | null>(null);
  private resolve: ((result: AdminPizzaFormResult | undefined) => void) | null = null;

  protected readonly isEditMode = computed(() => this.data() !== null);

  protected readonly toppingsResource = httpResource<PizzaOption[]>(() => '/api/options/toppings', {
    defaultValue: [],
  });

  protected readonly model = signal<AdminPizzaFormModel>({
    basePrice: 10,
    name: '',
    image: null,
    extraToppings: [],
  });

  protected readonly pizzaForm = form(
    this.model,
    (schema) => {
      disabled(schema.name, () => true);
      required(schema.basePrice, { message: 'Price is required' });
      required(schema.image, { message: 'Select an image' });
      min(schema.basePrice, 0, { message: 'Price must be ≥ 0' });
    },
    {
      submission: {
        action: async (formRef) => {
          const { basePrice, image, extraToppings } = formRef().value();
          const toppingIds = extraToppings
            .map((selected, index) => (selected ? this.toppingsResource.value()![index].id : null))
            .filter((t): t is string => t !== null);
          const payload = {
            basePrice,
            imageFilename: image!,
            toppingIds,
          };
          const req = this.isEditMode()
            ? this.api.updatePizza(this.data()!.id, payload)
            : this.api.createPizza(payload);

          try {
            const pizza = await firstValueFrom(req);
            this.resolve?.({ pizza, mode: this.isEditMode() ? 'edit' : 'create' });
            this.dialog.close();
          } catch {
            return { kind: 'serverError', message: 'Save failed' };
          }
          return null;
        },
      },
    },
  );

  protected readonly selectedToppingsPrice = computed((): number => {
    const opts = this.toppingsResource.value();
    const extra = this.model().extraToppings;
    return opts.reduce((sum, o, i) => (extra[i] ? sum + o.price : sum), 0);
  });

  protected readonly pizzaTotalPrice = computed((): number | null => {
    return (this.model().basePrice ?? 0) + this.selectedToppingsPrice();
  });

  public constructor() {
    effect(() => {
      const toppings = this.toppingsResource.value();
      if (toppings && this.data()) {
        this.model.update((m) => ({
          ...m,
          extraToppings: toppings.map(
            (t) => this.data()?.toppings?.some((pt) => pt.id === t.id) ?? false,
          ),
        }));
      }
    });
  }

  open(pizza: Pizza | null): Promise<AdminPizzaFormResult | undefined> {
    this.data.set(pizza);
    this.model.set({
      basePrice: pizza?.basePrice ?? 10,
      name: pizza?.name ?? '',
      image: pizza?.image ?? null,
      extraToppings: [],
    });
    this.dialog.open();
    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  protected save(): void {
    void submit(this.pizzaForm);
  }

  protected dismiss(): void {
    this.resolve?.(undefined);
    this.dialog.close();
  }
}
