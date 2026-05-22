import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NbButton } from '@ng-brutalism/ui';

@Component({
  selector: 'rw-not-found-page',
  imports: [RouterLink, NbButton],
  templateUrl: './not-found-page.html',
  styleUrl: './not-found-page.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundPage {}
