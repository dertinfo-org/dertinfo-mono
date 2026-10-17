import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/authentication/auth.service';
import { UserData } from 'app/models/auth/userdata.model';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HomeComponent implements OnInit, OnDestroy {
  isAnnualSelected: boolean = false;
  contactForm: UntypedFormGroup;
  sessionUser: UserData | null = null;
  private sessionSubscription: Subscription;

  constructor(
    private router: Router,
    private fb: UntypedFormBuilder,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.contactForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.email]],
      subject: ['', [Validators.required]],
      message: ['', Validators.required]
    });
    this.refreshSession();
    this.sessionSubscription = this.authService.userDataChanged$.subscribe(() => this.refreshSession());
  }

  ngOnDestroy() {
    if (this.sessionSubscription) {
      this.sessionSubscription.unsubscribe();
    }
  }

  public signUp() {
    this.authService.signUp();
  }

  public routeToTerms() {
    this.router.navigate(['./terms']);
  }

  public routeToDataPolicy() {
    this.router.navigate(['./datapolicy']);
  }

  public routeToCookiePolicy() {
    this.router.navigate(['./cookiepolicy']);
  }

  private refreshSession() {
    this.sessionUser = this.authService.readActiveSession();
  }
}
