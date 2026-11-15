import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { List } from 'immutable';
import { Subscription } from 'rxjs';
import { EventDto, VenueDto } from 'src/app/models/dto';
import { ILogger } from 'src/app/providers/diagnostics/logger';
import { EventStore } from 'src/app/stores/event.store';
import { VenueStore } from 'src/app/stores/venue.store';
import { IonFab, NavController } from '@ionic/angular';

@Component({
    selector: 'app-venue',
    templateUrl: './venue.page.html',
    styleUrls: ['./venue.page.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class VenuePage implements OnInit, OnDestroy {

  // Fields
  private _loadTimeoutHook;
  private _loadTimeoutDuration = 10000;
  private _primaryVenueSubscription: Subscription;
  private _primaryEventSubscription: Subscription;
  private _venueListSubscription: Subscription;
  private _eventListSubscription: Subscription;
  private _venuesLoading = true;
  private _eventsLoading = true;
  private _isError = false;
  private _noVenues = false;

  public selectedVenueId = 0;
  public selectedEventId = 0;
  public selectedEventNickname = '';

  // #####################################################################
  // # LIFECYCLE
  // #####################################################################

  constructor(
      private _logger: ILogger,
      public eventStore: EventStore,
      public venueStore: VenueStore,
      public navCtrl: NavController,
      public router: Router) {
      this._logger.trace('VenuePage - constructor ', ['VenuePage']);
  }

  ngOnInit() {
      this._logger.trace('VenuePage - ngOnInit ', ['VenuePage']);

      if (this._loadTimeoutHook) {
          this._loadTimeoutHook.clearTimeout();
      }


      this.subscribe();

      this._loadTimeoutHook = setTimeout(() => {
          if (this._eventsLoading || this._venuesLoading) {
              this._isError = true;
          }
      }, this._loadTimeoutDuration );
  }

  ngOnDestroy() {
      this._logger.trace('VenuePage - ngOnDestroy ', ['VenuePage']);

      this.unsubscribe();
  }

  // #####################################################################
  // # SUBSCRIPTIONS
  // #####################################################################

  /** Subscribe to any application events that will effect the state of this component */
  subscribe() {
      this._logger.trace('VenuePage - subscribe ', ['VenuePage']);

      /* venue selection change */
      this._primaryVenueSubscription = this.venueStore.primaryVenue$.subscribe(
          (data: VenueDto) => this.primaryVenueChangeNext(data),
          (err) => this.venuesServiceSubscriptionError(err),
          () => this.venueServiceSubscriptionComplete()
      );

      /* event selection change */
      this._primaryEventSubscription = this.eventStore.primaryEvent$.subscribe(
          (data: EventDto) => this.primaryEventChangeNext(data),
          (err) => this.eventServiceSubscriptionError(err),
          () => this.eventServiceSubscriptionComplete()
      );

      /* venues load change */
      this._venueListSubscription = this.venueStore.venues$.subscribe(
          (data: List<VenueDto>) => {
              this._logger.trace('this.venueStore.venues$.subscribe - next ', ['VenuePage']);
              this._venuesLoading = false;
          },
          (err) => this.venuesServiceSubscriptionError(err),
          () => this.venueServiceSubscriptionComplete()
      );

      /* events load change */
      this._eventListSubscription = this.eventStore.events$.subscribe(
          (data: List<EventDto>) => {
              this._logger.trace('this.eventStore.events$.subscribe - next ', ['VenuePage']);
              this._eventsLoading = false;
          },
          (err) => this.eventServiceSubscriptionError(err),
          () => this.eventServiceSubscriptionComplete()
      );
  }

  private unsubscribe() {
      this._logger.trace('VenuePage - unsubscribe ', ['VenuePage']);
      this._primaryEventSubscription.unsubscribe();
      this._primaryVenueSubscription.unsubscribe();
      this._eventListSubscription.unsubscribe();
      this._venueListSubscription.unsubscribe();
  }

  private primaryVenueChangeNext(venue: VenueDto) {
      this._logger.trace('VenuePage - primaryVenueChangeNext ', ['VenuePage'], venue);

      this._noVenues = false;

      if (venue) {
          this.selectedVenueId = venue.id;
      } else {
          // Primary venue is reported as null. No venues yet setup.
          this._noVenues = true;
      }
  }

  private venuesServiceSubscriptionError(err: any) {
      this._logger.trace('VenuePage - venuesServiceSubscriptionError ', ['VenuePage']);

      if (this._primaryVenueSubscription) {
          this._primaryVenueSubscription.unsubscribe();
      }
  }

  private venueServiceSubscriptionComplete() {
      this._logger.trace('VenuePage - venueServiceSubscriptionComplete ', ['VenuePage']);

      if (this._primaryVenueSubscription) {
          this._primaryVenueSubscription.unsubscribe();
      }
  }

  private primaryEventChangeNext(evt: EventDto) {
      this._logger.trace('VenuePage - primaryEventChangeNext ', ['VenuePage'], evt);

      if (evt) {
          this.selectedEventId = evt.id;
          this.selectedEventNickname = this.minifyEventName(evt.name);
      }
  }

  private eventServiceSubscriptionError(err: any) {
      this._logger.trace('VenuePage - eventServiceSubscriptionError ', ['VenuePage']);

      if (this._primaryEventSubscription) {
          this._primaryEventSubscription.unsubscribe();
      }
  }

  private eventServiceSubscriptionComplete() {
      this._logger.trace('VenuePage - eventServiceSubscriptionComplete ', ['VenuePage']);

      if (this._primaryEventSubscription) {
          this._primaryEventSubscription.unsubscribe();
      }
  }

  // #####################################################################
  // # PRIVATE
  // #####################################################################

  private minifyEventName(eventName: string): string {

      const nickname = eventName.trim().substring(4, eventName.length).trim();
      return nickname;
  }

  // #####################################################################
  // # PUBLIC
  // #####################################################################

  public changeVenueClick(venue: VenueDto) {
      this._logger.trace('VenuePage - changeVenueClick ', ['VenuePage']);

      if (this.venueStore.primaryVenue.id === venue.id) {
          this.router.navigate(['dances'])
      } else {
      this.venueStore.setPrimaryVenue(venue);
      }
  }

  public onEventSelected(eventDto: EventDto, fab: IonFab) {
      this._logger.trace('VenuePage - onEventSelected ### ', ['VenuePage'], eventDto);
      this.selectedEventNickname = this.minifyEventName(eventDto.name);
      this._venuesLoading = true;
      this.eventStore.setPrimaryEvent(eventDto);

      fab.close();
  }


}
