import { DOCUMENT, NgOptimizedImage } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  effect,
  inject,
  signal,
} from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../services/auth';
import { NbButton, NbAvatar } from '@ng-brutalism/ui';
import { PizzaLogo } from '../../../shared/components/pizza-logo/pizza-logo';
import { CartStore } from '../../../features/cart/cart.store';
import { RoleDirective } from '../../../shared/directives/role.directive';

@Component({
  selector: 'rw-header',
  imports: [RouterLink, RouterLinkActive, NgOptimizedImage, NbButton, NbAvatar, PizzaLogo, RoleDirective],
  templateUrl: './header.html',
  styleUrl: './header.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Header {
  protected readonly auth = inject(Auth);
  protected readonly cartStore = inject(CartStore);
  private readonly document = inject(DOCUMENT);

  protected readonly isMobileMenuOpen = signal(false);

  @HostListener('document:keydown.escape')
  public onDocumentEscape(): void {
    if (this.isMobileMenuOpen()) {
      this.closeMobileMenu();
    }
  }

  public constructor() {
    effect(() => {
      const open = this.isMobileMenuOpen();
      this.document.body.style.overflow = open ? 'hidden' : '';
    });
  }

  protected toggleMobileMenu(): void {
    this.isMobileMenuOpen.update((isOpen) => !isOpen);
  }

  protected closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  protected getInitials(name: string): string {
    const parts = name.split(/(?=[A-Z])/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }
}
