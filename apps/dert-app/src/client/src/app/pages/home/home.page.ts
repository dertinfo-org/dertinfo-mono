import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ActionSheetController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { AuthService } from 'src/app/authentication/auth.service';
import { EventDto } from 'src/app/models/dto';
import { ILogger } from 'src/app/providers/diagnostics/logger';
import { EventStore } from 'src/app/stores/event.store';

@Component({
    selector: 'app-home',
    templateUrl: './home.page.html',
    styleUrls: ['./home.page.scss'],
    standalone: false
})
export class HomePage implements OnInit, OnDestroy {

  private _primaryEventSubscription: Subscription;
  private _authChangedSubscription: Subscription;
  private _eventLoading = true;

  private selectedEventNickname = 'DERT';
  private selectedYear = '';

  /*Please note: there is a hack here as this will get converted to images/480x360/banner.png*/
  public selectedEventPictureUrl = './assets/images/banner.png';
  public userAuthenticated = false;

  // #####################################################################
  // # PROPERTIES
  // #####################################################################

  get loadingEvent(): boolean {
    return this.userAuthenticated && this._eventLoading;
  }

  // #####################################################################
  // # LIFECYCLE
  // #####################################################################

  constructor(
    private _logger: ILogger,
    public router: Router,
    private _authService: AuthService,
    public eventStore: EventStore,
    public actionSheetCtrl: ActionSheetController
  ) {
    this._logger.trace('HomePage - constructor ', ['HomePage']);
  }

  ngOnInit() {
    this._logger.trace('HomePage - ngOnInit ', ['HomePage']);

    this.subscribe();
  }

  ngOnDestroy() {
    this._logger.trace('HomePage - ngOnDestroy ', ['HomePage']);

    this.unsubscribe();
  }

  // #####################################################################
  // # SUBSCRIPTIONS
  // #####################################################################

  private subscribe() {
    this._logger.trace('HomePage - subscribe ', ['HomePage']);

    /* event selection change */
    this._primaryEventSubscription = this.eventStore.primaryEvent$.subscribe(
      (data: EventDto) => this.primaryEventChangeNext(data),
      (err) => this.primaryEventSubscriptionError(err),
      () => this.primaryEventSubscriptionComplete()
    );

    /* authentication changed */
    this._authChangedSubscription = this._authService.authChanged$.subscribe(
      (data) => this.userAuthenticatedSubNext(data),
      (err) => this.userAuthenticatedSubError(err),
      () => this.userAuthenticatedSubComplete()
    );
  }

  private primaryEventChangeNext(evt: EventDto) {
    this._logger.trace('HomePage - primaryEventChangeNext ', ['HomePage'], evt);

    if (evt) {
      this.selectedEventPictureUrl = evt.eventPictureUrl;
      this.selectedEventNickname = this.minifyEventName(evt.name);
      this.selectedYear = this.selectedEventNickname;
    }

    this._eventLoading = false;
  }

  private primaryEventSubscriptionError(err: any) {
    this._logger.trace('HomePage - primaryEventSubscriptionError ', ['HomePage']);

    if (this._primaryEventSubscription) {
      this._primaryEventSubscription.unsubscribe();
    }
  }

  private primaryEventSubscriptionComplete() {
    this._logger.trace('HomePage - primaryEventSubscriptionComplete ', ['HomePage']);

    if (this._primaryEventSubscription) {
      this._primaryEventSubscription.unsubscribe();
    }
  }

  private userAuthenticatedSubNext(isAuthenticated: boolean) {
    this._logger.trace('HomePage - userAuthenticatedSubNext ', ['HomePage']);

    this.userAuthenticated = isAuthenticated;

    if (!this.userAuthenticated) {
      this.selectedEventPictureUrl = './assets/images/banner.png';
      this.selectedEventNickname = 'DERT';
      this.selectedYear = '';
    } else {
      this._eventLoading = true;
    }
  }

  private userAuthenticatedSubError(err: any) {
    this._logger.trace('HomePage - userAuthenticatedSubError ', ['HomePage']);

    if (this._authChangedSubscription) {
      this._authChangedSubscription.unsubscribe();
    }
  }

  private userAuthenticatedSubComplete() {
    this._logger.trace('HomePage - userAuthenticatedSubComplete ', ['HomePage']);

    if (this._authChangedSubscription) {
      this._authChangedSubscription.unsubscribe();
    }
  }

  private unsubscribe() {
    if (this._primaryEventSubscription) {
      this._primaryEventSubscription.unsubscribe();
    }

    if (this._authChangedSubscription) {
      this._authChangedSubscription.unsubscribe();
    }
  }

  // #####################################################################
  // # PRIVATE
  // #####################################################################
  private minifyEventName(eventName: string): string {

    const nickname = eventName.trim().substring(4, eventName.length).trim();
    return nickname;
  }

}
