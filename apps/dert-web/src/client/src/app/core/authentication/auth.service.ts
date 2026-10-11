import { Inject, Injectable, DOCUMENT } from '@angular/core';

import { Router } from '@angular/router';
import { AuthService as Auth0AngularService } from '@auth0/auth0-angular';
import { UserSettingsUpdateSubmissionDto } from 'app/models/dto';
import { Subject } from 'rxjs';
import { filter, take } from 'rxjs/operators';
import { UserData } from '../../models/auth/userdata.model';
import { ConfigurationService } from '../services/configuration.service';

/**
 * DertInfo AuthService facade over @auth0/auth0-angular.
 *
 * Login flow (Authorization Code + PKCE + rotating refresh tokens):
 *  1. APP_INITIALIZER loads ConfigurationService (local/staging/prod callback + remote Auth0 ids).
 *  2. AuthClientConfig.set(...) configures the SDK (see app.module.ts initSettings).
 *  3. login() → Auth0 Universal Login → redirect back to {auth0CallbackUrl}/callback.
 *  4. AuthCallbackComponent waits for isAuthenticated$, then maps id-token claims → UserData
 *     and navigates to /dashboard.
 *  5. AuthHttpInterceptor attaches Bearer access tokens to API calls (no auth0-js renewAuth iframe).
 *  6. renewToken() uses getAccessTokenSilently({ cacheMode: 'off' }) so post–group-create claim
 *     refresh uses the refresh_token grant (works on localhost; avoids consent_required silent iframe).
 *  7. logout() — prefer /auth/signout first; clears local session then Auth0 logout
 *     with returnTo = site root ('' → /home). ErrorHandler ignores HTTP errors while loggingOut.
 *
 * Staging/prod use the same path; only ConfigurationService callback/API values differ.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {

  /**
   * Side-nav listens so display name updates after settings changes / claim refresh.
   */
  private userDataChangedSubject: Subject<UserData> = new Subject<UserData>();

  /**
   * Mirror of Auth0 isAuthenticated$ for sync callers (e.g. templates / legacy checks).
   * Do not use for route guards — AuthGuard waits on isLoading$ / isAuthenticated$ instead.
   */
  private authenticated = false;

  /**
   * True while Auth0 federated logout redirect is in progress.
   * ErrorHandler skips session error pages so in-flight API failures do not flash /session/404.
   */
  private loggingOut = false;

  private readonly userDataStorageKey = 'user_data';

  public get userDataChanged$() {
    return this.userDataChangedSubject.asObservable();
  }

  /** Used by ErrorHandlerService during Auth0 logout redirect. */
  public get isLoggingOut(): boolean {
    return this.loggingOut;
  }

  constructor(
    public router: Router,
    private _configurationService: ConfigurationService,
    private auth0: Auth0AngularService,
    @Inject(DOCUMENT) private document: Document,
  ) {
    // Keep a sync flag for non-guard callers after the SDK has settled.
    this.auth0.isAuthenticated$.subscribe((isAuth) => {
      this.authenticated = isAuth;
      if (isAuth) {
        // Keep a sync AT copy for ng2-file-upload (cannot use AuthHttpInterceptor).
        this.ensureAccessTokenCached().catch(() => { /* ignore until login completes */ });
      }
    });

    // When the SDK restores a session from localStorage (page refresh), rebuild UserData from claims.
    this.auth0.idTokenClaims$
      .pipe(filter((claims) => !!claims))
      .subscribe((claims) => {
        this.applyClaimsToUserData(claims as Record<string, unknown>);
      });
  }

  /**
   * Step 3 — send the browser to Auth0 Universal Login.
   * redirect_uri / audience / scope come from AuthClientConfig (set at APP_INITIALIZER).
   */
  public login(): void {
    this.auth0.loginWithRedirect({
      appState: { target: '/dashboard' },
    });
  }

  /**
   * Same redirect as login(), asking New Universal Login to open the sign-up screen.
   * Classic Universal Login ignores screen_hint and shows the usual Auth0 page.
   */
  public signUp(): void {
    this.auth0.loginWithRedirect({
      appState: { target: '/dashboard' },
      authorizationParams: {
        screen_hint: 'signup',
      },
    });
  }

  /**
   * Drop a browser session that can no longer mint an access token, then send the user to sign-in.
   * openUrl: false clears the Auth0 SPA cache in memory and localStorage without visiting /v2/logout.
   */
  public abandonStaleSessionAndLogin(): void {
    localStorage.removeItem(this.userDataStorageKey);
    localStorage.removeItem('dertinfo_access_token');
    this.auth0.logout({ openUrl: false }).pipe(take(1)).subscribe({
      next: () => this.login(),
      error: (err) => {
        console.error('Auth0 local logout failed', err);
        this.clearAuth0BrowserCache();
        this.login();
      },
    });
  }

  /**
   * Step 4 — called from /callback after Auth0 redirects back with ?code=&state=.
   * The SDK exchanges the code for tokens automatically on app bootstrap; we wait until
   * authenticated, ensure UserData is populated, then navigate to the intended route.
   */
  public handleAuthentication(): void {
    this.auth0.error$.pipe(take(1)).subscribe((err) => {
      if (err) {
        console.error('Auth0 callback error', err);
        this.router.navigate(['/home']);
      }
    });

    this.auth0.isAuthenticated$
      .pipe(
        filter((isAuth) => isAuth === true),
        take(1),
      )
      .subscribe(() => {
        this.auth0.idTokenClaims$.pipe(take(1)).subscribe((claims) => {
          if (claims) {
            this.applyClaimsToUserData(claims as Record<string, unknown>);
          }
          this.auth0.appState$.pipe(take(1)).subscribe((appState) => {
            const target = (appState && (appState as { target?: string }).target) || '/dashboard';
            this.router.navigateByUrl(target);
          });
        });
      });
  }

  public updateUserDetails(updatedSettings: UserSettingsUpdateSubmissionDto) {
    const user_data: UserData = this.userData();
    if (!user_data) {
      return;
    }

    user_data.firstname = updatedSettings.firstName;
    user_data.lastname = updatedSettings.lastName;

    localStorage.setItem(this.userDataStorageKey, JSON.stringify(user_data));
    this.userDataChangedSubject.next(user_data);
  }

  /**
   * Step 7 — clear app session, then Auth0 logout.
   * returnTo is the site root (auth0CallbackUrl / origin). Angular '' redirects to /home.
   * Must be listed in Auth0 Allowed Logout URLs (local/staging/prod origins).
   * Prefer navigating to /auth/signout first so the user sees a signing-out message.
   */
  public logout(): void {
    this.loggingOut = true;
    localStorage.removeItem(this.userDataStorageKey);
    localStorage.removeItem('dertinfo_access_token');

    // returnTo = root only; SPA maps '' → home after Auth0 redirects back.
    const returnTo = this._configurationService.auth0CallbackUrl || this.document.location.origin;
    this.auth0.logout({
      logoutParams: {
        returnTo,
      },
    }).pipe(take(1)).subscribe({
      error: (err) => {
        console.error('Auth0 logout failed', err);
        this.loggingOut = false;
        this.router.navigate(['/home']);
      },
    });
  }

  /**
   * Access token for non-HttpClient callers (e.g. ng2-file-upload).
   * Prefer AuthHttpInterceptor for Angular HttpClient requests.
   */
  public accessToken(): string {
    // Sync read from Auth0 localStorage cache is not exposed; callers that need a token
    // for upload widgets should prefer the last known token from getAccessTokenSilently.
    // We keep a best-effort sync path via a short-lived cache updated on renew/login.
    return localStorage.getItem('dertinfo_access_token') || '';
  }

  public isAuthenticated(): boolean {
    return this.authenticated;
  }

  public userData(): UserData {
    const raw = localStorage.getItem(this.userDataStorageKey);
    return raw ? JSON.parse(raw) : null;
  }

  /**
   * Signed-in person for the public homepage header.
   * Reads the Auth0 localStorage cache and user_data only. Does not call Auth0 or the API.
   * An access-token cache whose expiresAt is not in the future is signed out, even when user_data remains.
   */
  public readActiveSession(): UserData | null {
    if (!this.hasUnexpiredAccessToken()) {
      return null;
    }

    const stored = this.userData();
    if (stored) {
      return stored;
    }

    return this.readUserFromUnexpiredCache();
  }

  /**
   * Step 6 — force a new access token (and refreshed custom claims) via refresh_token grant.
   * Used after group/event create when the API updates Auth0 app_metadata; the previous AT
   * still lacks the new groupadmin/eventadmin claim until we renew.
   *
   * cacheMode: 'off' bypasses the SDK cache so Auth0 re-evaluates claims.
   * This is NOT the old auth0-js renewAuth iframe (/silent) path.
   */
  public renewToken(): Promise<void> {
    console.log('AuthService - renewToken (refresh_token grant, cache bypass)');
    // RxJS 6: use toPromise (firstValueFrom is RxJS 7+).
    return this.auth0.getAccessTokenSilently({
      cacheMode: 'off',
      detailedResponse: true,
    } as any).pipe(take(1)).toPromise().then((result: any) => {
      const token = typeof result === 'string' ? result : result?.access_token;
      if (token) {
        localStorage.setItem('dertinfo_access_token', token);
      }

      return this.auth0.idTokenClaims$.pipe(take(1)).toPromise().then((claims) => {
        if (claims) {
          this.applyClaimsToUserData(claims as Record<string, unknown>);
        }
      });
    });
  }

  /**
   * @deprecated Silent iframe callback removed — refresh tokens replace /silent.
   * Kept as a no-op so any lingering route does not crash during migration.
   */
  public parseSilentResponse() {
    console.warn('parseSilentResponse is obsolete; refresh tokens replace silent iframe renewal.');
  }

  public addGdprConsent() {
    const user_data: UserData = this.userData();
    if (!user_data) {
      return;
    }
    user_data.gdprConsentGained = true;
    localStorage.setItem(this.userDataStorageKey, JSON.stringify(user_data));
  }

  /**
   * Map Auth0 id-token claims (including https://dertinfo.co.uk/* custom claims) into UserData.
   */
  private clearAuth0BrowserCache(): void {
    Object.keys(localStorage)
      .filter((key) => key.indexOf('@@auth0spajs@@') === 0)
      .forEach((key) => localStorage.removeItem(key));
  }

  private applyClaimsToUserData(claims: Record<string, unknown>): void {
    const user_data = this.userDataFromRecord(claims);
    localStorage.setItem(this.userDataStorageKey, JSON.stringify(user_data));
    this.userDataChangedSubject.next(user_data);
  }

  /**
   * True when an Auth0 token cache entry (not the @@user@@ profile key) has expiresAt in the future.
   * expiresAt is unix seconds, matching the SPA SDK cache.
   */
  private hasUnexpiredAccessToken(): boolean {
    return this.readUnexpiredCacheEntry() !== null;
  }

  private readUserFromUnexpiredCache(): UserData | null {
    const entry = this.readUnexpiredCacheEntry();
    if (!entry) {
      return null;
    }

    const decoded = entry.body && entry.body.decodedToken;
    const claims = (decoded && decoded.claims) || {};
    const user = (decoded && decoded.user) || {};
    return this.userDataFromRecord(Object.assign({}, claims, user));
  }

  private readUnexpiredCacheEntry(): { body?: { decodedToken?: { user?: Record<string, unknown>; claims?: Record<string, unknown> } } } | null {
    const now = Math.floor(Date.now() / 1000);
    const keys = Object.keys(localStorage);
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (key.indexOf('@@auth0spajs@@') !== 0 || key.indexOf('@@user@@') !== -1) {
        continue;
      }

      const raw = localStorage.getItem(key);
      if (!raw) {
        continue;
      }

      let entry: { expiresAt?: number; body?: { decodedToken?: { user?: Record<string, unknown>; claims?: Record<string, unknown> } } };
      try {
        entry = JSON.parse(raw);
      } catch {
        continue;
      }

      if (typeof entry.expiresAt === 'number' && entry.expiresAt > now) {
        return entry;
      }
    }

    return null;
  }

  private userDataFromRecord(source: Record<string, unknown>): UserData {
    return {
      email: (source['email'] as string) || '',
      name: (source['name'] as string) || '',
      nickname: (source['nickname'] as string) || '',
      picture: (source['picture'] as string) || '',
      firstname: (source['https://dertinfo.co.uk/firstname'] as string) || '',
      lastname: (source['https://dertinfo.co.uk/lastname'] as string) || '',
      phone: (source['https://dertinfo.co.uk/phone'] as string) || '',
      gdprConsentGained: !!(source['https://dertinfo.co.uk/gdprconsentgained']),
      dertOfDertsAdmin: !!(source['https://dertinfo.co.uk/dodadmin']),
      superAdmin: !!(source['https://dertinfo.co.uk/superadmin']),
    };
  }

  /**
   * Called after successful login/renew to cache AT for upload widgets that cannot use the interceptor.
   */
  public ensureAccessTokenCached(): Promise<string> {
    return this.auth0.getAccessTokenSilently().pipe(take(1)).toPromise().then((token) => {
      localStorage.setItem('dertinfo_access_token', token);
      return token;
    });
  }
}
