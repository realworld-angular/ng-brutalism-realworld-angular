import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  effect,
  DestroyRef,
  ViewChild,
  untracked,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormField, form, required, FormRoot } from '@angular/forms/signals';
import { httpResource } from '@angular/common/http';
import { Title } from '@angular/platform-browser';
import { firstValueFrom } from 'rxjs';
import { Router } from '@angular/router';
import { PizzeriaApi } from '../../services/pizzeria-api';
import { Callout } from '../../../../shared/components/callout/callout';
import { PizzeriaDetail } from '../../models/pizzeria.models';
import { NbButton } from '@ng-brutalism/ui';
import { ImagePicker } from '../../../../shared/components/image-picker/image-picker';
import { PhotonLocationField } from '../../../../shared/components/photon-location-field/photon-location-field';
import type { LocationValue } from '../../../../shared/components/photon-location-field/photon-location-field';
import { Spinner } from '../../../../shared/components/spinner/spinner';
import {
  ConfirmDialog,
  ConfirmDialogData,
} from '../../../../shared/components/confirm-dialog/confirm-dialog';

@Component({
  selector: 'rw-admin-pizzeria-configuration-page',
  imports: [NbButton, FormField, FormRoot, ImagePicker, Callout, PhotonLocationField, Spinner, ConfirmDialog],
  templateUrl: './admin-pizzeria-configuration-page.html',
  styleUrl: './admin-pizzeria-configuration-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminPizzeriaConfigurationPage {
  private readonly pizzeriaApi = inject(PizzeriaApi);
  private readonly destroyRef = inject(DestroyRef);
  private readonly router = inject(Router);
  @ViewChild(ConfirmDialog) private readonly confirmDlg!: ConfirmDialog;
  private readonly title = inject(Title);

  protected readonly pizzeriaResource = httpResource<PizzeriaDetail>(
    () => '/api/pizzerias/admin/pizzeria',
  );

  protected readonly isDeleting = signal(false);
  protected readonly submitSuccess = signal(false);

  protected readonly model = signal({
    location: null as LocationValue | null,
    image: null as string | null,
  });

  protected readonly pizzeriaForm = form(
    this.model,
    (schema) => {
      required(schema.location, { message: 'Choose a location from the list' });
      required(schema.image, { message: 'Please select an image' });
    },
    {
      submission: {
        action: async (formRef) => {
          this.submitSuccess.set(false);
          const location = formRef().value().location!;
          try {
            await firstValueFrom(
              this.pizzeriaApi
                .updateMyPizzeria({
                  city: location.city,
                  country: location.country,
                  imageFilename: formRef().value().image!,
                })
                .pipe(takeUntilDestroyed(this.destroyRef)),
            );
          } catch {
            return { kind: 'serverError', message: 'Save failed' };
          }
          this.submitSuccess.set(true);
          return null;
        },
      },
    },
  );

  public constructor() {
    effect(() => {
      if (this.pizzeriaResource.status() === 'resolved') {
        const pizzeria = untracked(() => this.pizzeriaResource.value());
        if (pizzeria) {
          this.title.setTitle(`Configure your pizzeria - ${pizzeria.name}`);
        }
      }
    });

    effect(() => {
      if (this.pizzeriaResource.status() === 'resolved') {
        const pizzeria = untracked(() => this.pizzeriaResource.value());
        if (pizzeria) {
          this.model.update((modelState) => ({
            ...modelState,
            location: { city: pizzeria.city, country: pizzeria.country },
            image: pizzeria.image,
          }));
        }
      }
    });
  }

  protected async deletePizzeria(): Promise<void> {
    const pizzeria = this.pizzeriaResource.value()!;
    const message = `Are you sure you want to delete "${pizzeria.name}"? This action cannot be undone.`;

    const result = await this.confirmDlg.open({
      title: 'Delete pizzeria',
      message,
      cancelLabel: 'Cancel',
      confirmLabel: 'Delete pizzeria' as const,
    });

    if (result === 'confirmed') {
      this.isDeleting.set(true);
      try {
        await firstValueFrom(this.pizzeriaApi.deleteMyPizzeria().pipe(takeUntilDestroyed(this.destroyRef)));
        void this.router.navigateByUrl('/pizzerias/admin/new');
      } finally {
        this.isDeleting.set(false);
      }
    }
  }
}
