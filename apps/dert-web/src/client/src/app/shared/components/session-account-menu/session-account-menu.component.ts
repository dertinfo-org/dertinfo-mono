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
}
