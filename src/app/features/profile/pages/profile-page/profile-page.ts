import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';

import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Auth } from '../../../../core/services/auth';
import { NbButton, NbAvatar } from '@ng-brutalism/ui';
@Component({
  selector: 'rw-profile-page',
  imports: [NbButton, NbAvatar],
  templateUrl: './profile-page.html',
  styleUrl: './profile-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePage {
  private readonly auth = inject(Auth);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isLoggingOut = signal(false);
  protected readonly user = this.auth.user;

  protected getInitials(name: string): string {
    const parts = name.split(/(?=[A-Z])/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  protected logout(): void {
    this.isLoggingOut.set(true);
    this.auth
      .logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          window.location.href = '/';
        },
      });
  }
}
