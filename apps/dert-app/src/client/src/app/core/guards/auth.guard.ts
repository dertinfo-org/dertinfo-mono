import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../../authentication/auth.service'

@Injectable({ providedIn: 'root' })
export class AuthGuard {

    constructor(private router: Router, private authService: AuthService) { }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
        if (this.authService.isAuthenticated()) {
            return true;
        }
        this.router.navigate(['/auth/signin']);
        return false;
    }
}
