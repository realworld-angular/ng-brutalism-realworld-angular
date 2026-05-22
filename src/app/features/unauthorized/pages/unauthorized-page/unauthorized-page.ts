import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButton } from '@ng-brutalism/ui';

@Component({
  selector: 'rw-unauthorized-page',
  imports: [RouterLink, NbButton],
  templateUrl: './unauthorized-page.html',
  styleUrl: './unauthorized-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnauthorizedPage {}
