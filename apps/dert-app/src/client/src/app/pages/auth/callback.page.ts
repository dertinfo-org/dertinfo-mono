import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: 'app-callback',
    templateUrl: './callback.page.html',
    styleUrls: ['./callback.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CallbackPage implements OnInit {

  constructor(private _router: Router, private authService: AuthService) {
    this.authService.handleAuthentication();
  }

  ngOnInit() {

    this._router.navigate(['/home']);
  }



}
