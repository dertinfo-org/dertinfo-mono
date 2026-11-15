// angular
import { Component, OnDestroy, OnInit } from '@angular/core';
import { LoadingController, NavController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { List } from 'immutable';
import { ILogger } from '../../providers/diagnostics/logger';

// services
import { DanceStore } from '../../stores/dance.store';
import { VenueStore } from '../../stores/venue.store';

// Pages
import { DanceDetailPage } from './dance-detail.page';

// Models
import {
    VenueDanceDto,
    VenueDto
} from '../../models/dto';
import { Router } from '@angular/router';

// import * as moment from 'moment'

@Component({
    templateUrl: 'dance-list.page.html',
    styleUrls: ['dance-list.page.scss'],
    providers: [],
    standalone: false
})
export class DanceListPage implements OnInit, OnDestroy {


    private _loadTimeoutHook;
    private _loadTimeoutDuration = 10000;
    private _isError = false;
    private _noDances = false;
    private _venueLoading = true;
    private _dancesLoading = true;

    public imageSize = '100x100';
    private _danceListSubscription: Subscription;
    private _primaryVenueSubscription: Subscription;


    public myVenue: VenueDto;
    public showPendingList: boolean;
    public showCompletedList: boolean;
    public showLockedList: boolean;
    public pendingDances: List<VenueDanceDto>;
    public completedDances: List<VenueDanceDto>;
    public lockedDances: List<VenueDanceDto>;
    public errorMessage: any;

    get isLoading() {
        return this._dancesLoading || this._venueLoading;
    }

    constructor(
        private _logger: ILogger,
        private _danceStore: DanceStore,
        private _venueStore: VenueStore,
        public router: Router,
        public loadingCtrl: LoadingController
    ) {
        this._logger.trace('DanceListPage - constructor ', ['DanceListPage']);

    }

    ngOnInit(): void {
        this._logger.trace('DanceListPage - ngOnInit ', ['DanceListPage']);

        this._venueLoading = true;
        this._dancesLoading = true;

        this.subscribe();

        this._loadTimeoutHook = setTimeout(() => {
            if (this._venueLoading || this._dancesLoading) {
                this._venueLoading = false;
                this._dancesLoading = false;
                this._isError = true;
            }
        }, this._loadTimeoutDuration );

    }

    ngOnDestroy(): void {
        this._logger.trace('DanceListPage - ngOnDestroy ', ['DanceListPage']);

        this.unsubscribe();

    }

    subscribe() {
        this._logger.trace('DanceListPage - subscribe ', ['DanceListPage']);

        /* primary venue change */
        this._primaryVenueSubscription = this._venueStore.primaryVenue$.subscribe(
            (data: VenueDto) => this.primaryVenueChangeNext(data),
            (err) => this.venuesServiceSubscriptionError(err),
            () => this.venueServiceSubscriptionComplete()
        );

        /* primary venue change */
        this._danceListSubscription = this._danceStore.dances$.subscribe(
            (data: List<VenueDanceDto>) => this.danceListSubscriptionNext(data),
            (err) => this.danceListSubscriptionError(err),
            () => this.danceListSubscriptionComplete()
        );
    }


    unsubscribe() {
        this._logger.trace('DanceListPage - unsubscribe ', ['DanceListPage']);

        if (this._primaryVenueSubscription) {
            this._primaryVenueSubscription.unsubscribe();
        }

        if (this._danceListSubscription) {
            this._danceListSubscription.unsubscribe();
        }
    }

    private primaryVenueChangeNext(primaryVenue: VenueDto) {
        this._logger.trace('DanceListPage - primaryVenueChangeNext ', ['DanceListPage'], primaryVenue);

        this._noDances = false;

        // tslint:disable-next-line:no-extra-boolean-cast
        if (primaryVenue) {
            this.myVenue = primaryVenue;
            this._danceStore.loadDancesByVenueId(this.myVenue.id);

            // timeout to allow angular to bind
            setTimeout(() => {
                this._venueLoading = false;
            }, 250);
        } else {
            this._venueLoading = false;
            this._dancesLoading = false;
            this._noDances = true;
        }
    }

    private venuesServiceSubscriptionError(err: any) {
        this._logger.trace('VenuePage - venuesServiceSubscriptionError ', ['DanceListPage']);

        if (this._primaryVenueSubscription) {
            this._primaryVenueSubscription.unsubscribe();
        }
    }

    private venueServiceSubscriptionComplete() {
        this._logger.trace('VenuePage - venueServiceSubscriptionComplete ', ['DanceListPage']);

        if (this._primaryVenueSubscription) {
            this._primaryVenueSubscription.unsubscribe();
        }
    }

    private danceListSubscriptionNext(danceList: List<VenueDanceDto>) {
        this._logger.trace('DanceListPage - danceListSubscriptionNext ', ['DanceListPage'], danceList);

        this._noDances = false;

        if (danceList && danceList.count() > 0) {
            this.allocateDances(danceList);

            // timeout to allow angular to bind
            setTimeout(() => {
                this._dancesLoading = false;
            }, 250);
        } else {
            this._dancesLoading = false;
            this._noDances = true;
        }
    }

    private danceListSubscriptionError(err: any) {
        this._logger.trace('VenuePage - danceListSubscriptionError ', ['DanceListPage']);

        if (this._danceListSubscription) {
            this._danceListSubscription.unsubscribe();
        }
    }

    private danceListSubscriptionComplete() {
        this._logger.trace('VenuePage - danceListSubscriptionComplete ', ['DanceListPage']);

        if (this._danceListSubscription) {
            this._danceListSubscription.unsubscribe();
        }
    }





    /*
    getDances() {
        this.danceService.getDances()
            .subscribe(
            dances => this.allocateDances(dances),
            error => this.errorMessage = <any>error);
    }
    */

    allocateDances(dances: List<VenueDanceDto>) {
        this._logger.trace('DanceListPage - allocateDances ', ['DanceListPage']);

        this.pendingDances = dances.filter(d => !d.hasScoresEntered).toList();
        this.completedDances = dances.filter(d => d.hasScoresEntered && !d.hasScoresChecked).toList();
        this.lockedDances = dances.filter(d => d.hasScoresEntered && d.hasScoresChecked).toList();

        /*
                this.pendingDances = dances.filter(dl => !d.hasScoresEntered)
                this.completedDances = dances.filter(dl => d.hasScoresEntered && !d.hasScoresChecked)
                this.lockedDances = dances.filter(dl => d.hasScoresEntered && d.hasScoresChecked)
                */

        /* not required - done in the view directly on the list*/
        this.showPendingList = this.pendingDances.count() > 0;
        this.showCompletedList = this.completedDances.count() > 0;
        this.showLockedList = this.lockedDances.count() > 0;
    }


    goToDanceDetail(danceId: number) {
        this._logger.trace('DanceListPage - goToDanceDetail ', ['DanceListPage']);

        this.router.navigate([`dances/${danceId}`]);

        // todo - we need to do this to get to detail.
        // this.navCtrl.push(DanceDetailPage, {
        //     id: danceId
        // });
    }

}
