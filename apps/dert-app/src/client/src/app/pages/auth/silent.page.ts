import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: 'app-silent',
    templateUrl: './silent.page.html',
    styleUrls: ['./silent.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SilentPage {

  constructor(private authService: AuthService) {
    this.authService.parseSilentResponse();
  }

}
