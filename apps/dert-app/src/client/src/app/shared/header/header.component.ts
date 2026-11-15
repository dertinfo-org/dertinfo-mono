import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { ILogger } from '../../providers/diagnostics/logger';

import { Subscription } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from 'src/app/authentication/auth.service';


@Component({
    selector: 'app-header',
    templateUrl: 'header.component.html',
    standalone: false
})
export class AppHeaderComponent {

    @Input() pageTitle;

    private _authChangedSubscription: Subscription;

    public get userAuthenticated() {
        return this._authService.isAuthenticated()
    };


    // #####################################################################
    // # LIFE CYCLE
    // #####################################################################

    constructor(
        private _logger: ILogger,
        private _router: Router,
        private _authService: AuthService
    ) {}

    // #####################################################################
    // # SUBSCRIPTIONS
    // #####################################################################

    // #####################################################################
    // # PUBLIC
    // #####################################################################

    loginClick() {
        this._logger.trace('AppHeaderComponent - loginClick ', ['AppHeaderComponent']);

        this._router.navigate(['auth/signin']);
    }

    logoutClick() {
        this._logger.trace('AppHeaderComponent - logoutClick ', ['AppHeaderComponent']);

        this._router.navigate(['auth/signout']);
    }
}
