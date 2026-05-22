import { ChangeDetectionStrategy, Component, ViewChild, signal } from '@angular/core';
import { NbDialog, NbDialogContent, NbDialogActions } from '@ng-brutalism/ui';
import { NbButton } from '@ng-brutalism/ui';

export interface ConfirmDialogData {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
}

export type ConfirmDialogResult = 'confirmed' | 'dismissed';

@Component({
  selector: 'rw-confirm-dialog',
  imports: [NbDialog, NbDialogContent, NbDialogActions, NbButton],
  templateUrl: './confirm-dialog.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialog {
  @ViewChild(NbDialog) private readonly dialog!: NbDialog;

  protected readonly title = signal('');
  protected readonly message = signal('');
  protected readonly confirmLabel = signal('Confirm');
  protected readonly cancelLabel = signal('Cancel');

  private resolve: ((result: ConfirmDialogResult) => void) | null = null;

  open(data: ConfirmDialogData): Promise<ConfirmDialogResult> {
    this.title.set(data.title);
    this.message.set(data.message ?? '');
    this.confirmLabel.set(data.confirmLabel ?? 'Confirm');
    this.cancelLabel.set(data.cancelLabel ?? 'Cancel');
    this.dialog.open();
    return new Promise<ConfirmDialogResult>((resolve) => {
      this.resolve = resolve;
    });
  }

  protected confirm(): void {
    this.resolve?.('confirmed');
    this.dialog.close();
  }

  protected dismiss(): void {
    this.resolve?.('dismissed');
    this.dialog.close();
  }
}
