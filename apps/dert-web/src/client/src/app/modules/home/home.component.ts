import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from 'app/core/authentication/auth.service';

@Component({
    selector: 'app-home',
    templateUrl: './home.component.html',
    styleUrls: ['./home.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class HomeComponent implements OnInit {
  isAnnualSelected: boolean = false;
  contactForm: UntypedFormGroup;
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
}
