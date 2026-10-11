import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CookieService } from 'ngx-cookie-service';

@Component({
    selector: 'app-cookie-consent',
    templateUrl: './cookie-consent.component.html',
    styleUrls: ['./cookie-consent.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class CookieConsentComponent implements OnInit {

  /** How long an acceptance is remembered. A session cookie is dropped when the browser closes. */
  private readonly consentLifetimeDays = 365;

  public isVisible = false;

  constructor(private cookieService: CookieService) { }

  ngOnInit() {

    // CHeck For Cookie-Consent Cookie
    const cookieValue = this.cookieService.get('cookie-consent');

    if (cookieValue !== 'consented') {
      this.isVisible = true;
    }
  }

  public onAcceptCookiesClick() {

    this.cookieService.set('cookie-consent', 'consented', {
      expires: this.consentLifetimeDays,
      path: '/',
      sameSite: 'Lax',
      secure: window.location.protocol === 'https:',
    });

    this.isVisible = false;
  }
}
