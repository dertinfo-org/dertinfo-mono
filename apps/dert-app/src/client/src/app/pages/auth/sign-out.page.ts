import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: 'app-sign-out',
    templateUrl: './sign-out.page.html',
    styleUrls: ['./sign-out.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SignOutPage implements OnInit {



  constructor(private _router: Router, private _authService: AuthService) { }

  ngOnInit() {
    this._authService.logout();
    this._router.navigate(['/home']);
  }
}
