import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { UserData } from 'app/models/auth/userdata.model';

@Component({
    selector: 'app-session-account-menu',
    templateUrl: './session-account-menu.component.html',
    styleUrls: ['./session-account-menu.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SessionAccountMenuComponent {
  @Input() user: UserData;

  /** Local mark used when the session has no picture, so the page never loads an image over HTTP. */
  readonly defaultAvatar = 'assets/images/di-avatar.svg';
}
