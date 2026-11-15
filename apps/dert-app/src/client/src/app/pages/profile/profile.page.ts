// src/pages/profile/profile.ts

import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ILogger } from '../../providers/diagnostics/logger';
import { Subscription } from 'rxjs';
import { UserData } from '../../models/auth/UserData';
import { List } from 'immutable';
import { GroupDto, PinCodeSubmissionDto, VenueDto } from '../../models/dto/index';
import { GroupStore } from '../../stores/group.store';
import { AlertController, AlertOptions, ToastController } from '@ionic/angular';
import { PinCodeService } from '../../services/pin-code.service';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: 'page-profile',
    templateUrl: 'profile.page.html',
    styleUrls: ['profile.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProfilePage implements OnInit, OnDestroy {

    public imageSize = 'avatar';

    private _authChangedSubscription: Subscription;
    private _groupListSubscription: Subscription;
    private _groupsLoading = true;

    public get userAuthenticated() {
        return this._authService.isAuthenticated();
    }

    public userData: UserData = null;

    public adminGroups: List<GroupDto> = null;
    public adminVenues: List<VenueDto> = null;

    // We need to inject AuthService so that we can
    // use it in the view
    constructor(
        private _logger: ILogger,
        private _authService: AuthService,
        private _groupStore: GroupStore,
        public alertCtrl: AlertController,
        public _pinCodeService: PinCodeService,
        private toastCtrl: ToastController
    ) {
        this._logger.trace('ProfilePage - constructor ', ['ProfilePage']);
    }

    ngOnInit() {
        this._logger.trace('ProfilePage - ngOnInit ', ['ProfilePage']);

        this.userData = this._authService.userData();

        this._groupStore.loadGroupsByCurrentUser();

        this.subscribe();
    }


    ngOnDestroy() {
        this._logger.trace('ProfilePage - ngOnDestroy ', ['ProfilePage']);

        this.unsubscribe();
    }

    // #####################################################################
    // # SUBSCRIPTIONS
    // #####################################################################

    subscribe() {
        this._logger.trace('ProfilePage - subscribe ', ['ProfilePage']);

        /* groups list changed */
        this._groupListSubscription = this._groupStore.groups$.subscribe(
            (data: List<GroupDto>) => this.groupListSubscriptionNext(data),
            (err) => this.groupListSubscriptionError(err),
            () => this.groupListSubscriptionComplete()
        );
    }

    unsubscribe() {
        this._logger.trace('ProfilePage - unsubscribe ', ['ProfilePage']);

        if (this._authChangedSubscription) {
            this._authChangedSubscription.unsubscribe();
        }
    }

    private groupListSubscriptionNext(groupList: List<GroupDto>) {
        this._logger.trace('ProfilePage - groupListSubscriptionNext ', ['ProfilePage'], groupList);

        if (groupList && groupList.count() > 0) {
            this.adminGroups = groupList;
            this._groupsLoading = false;
        }
    }

    private groupListSubscriptionError(err: any) {
        this._logger.trace('ProfilePage - groupListSubscriptionError ', ['ProfilePage']);

        if (this._groupListSubscription) {
            this._groupListSubscription.unsubscribe();
        }
    }

    private groupListSubscriptionComplete() {
        this._logger.trace('ProfilePage - groupListSubscriptionComplete ', ['ProfilePage']);

        if (this._groupListSubscription) {
            this._groupListSubscription.unsubscribe();
        }
    }

    private pinEnteredHandler(pinCode: any) {
        this._logger.trace('ProfilePage - pinEnteredHandler ', ['ProfilePage'], pinCode);

        const pinCodeSubmissionDto: PinCodeSubmissionDto = {
            pinCode: pinCode.pin
        };

        this._pinCodeService.submitPinCode(pinCodeSubmissionDto).subscribe(
            (data) => {
                this._authService.renewToken().then(() => {
                    this._groupStore.loadGroupsByCurrentUser();
                });

                const promise = this.toastCtrl.create({
                    message: 'Permission Added',
                    duration: 2000,
                    position: 'bottom'
                });

                promise.then((toast) => {toast.present()} );
            },
            (error) => {
                const promise = this.toastCtrl.create({
                    message: 'Pin incorrect',
                    duration: 2000,
                    position: 'bottom'
                });

                promise.then((toast) => {toast.present()} );
            }
        );
    }

    // #####################################################################
    // # PUBLIC
    // #####################################################################

    public onEnterPinClick() {

        const alertOptions: AlertOptions = {
            cssClass: 'group-member-pin',
            header: 'Enter Group Member Pin',
            message: 'Entering a valid pin will add you to the group to view results',
            inputs: [
              {
                name: 'pin',
                placeholder: 'pin'
              },
            ],
            buttons: [
              {
                text: 'Cancel',
                handler: data => {
                  console.log('Cancel clicked', data);
                }
              },
              {
                text: 'Save',
                handler: data => {
                  this.pinEnteredHandler(data);
                }
              }
            ]
          };

        const promise = this.alertCtrl.create(alertOptions);
        promise.then((alert) => alert.present());
    }

    login() {
        this._logger.trace('ProfilePage - logout ', ['ProfilePage']);
        this._authService.login();
    }

    logout() {
        this._logger.trace('ProfilePage - logout ', ['ProfilePage']);
        this._authService.logout();
    }
}
