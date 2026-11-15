import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Subscription } from 'rxjs';
import { AuthService } from './authentication/auth.service';
import { EventDto, VenueDto } from './models/dto';
import { ILogger } from './providers/diagnostics/logger';
// import { ApplicationStore } from './stores/application.store';
import { EventStore } from './stores/event.store';
import { VenueStore } from './stores/venue.store';
@Component({
    selector: 'app-root',
    templateUrl: 'app.component.html',
    styleUrls: ['app.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent {

  private _authChangedSubscription: Subscription;
  private _venueChangedSubscription: Subscription;
  private _eventChangedSubscription: Subscription;

  private _userAuthenticated = false;
  public loggedInUser: string = '';
  public hasVenueSelected: boolean = false;
  public hasEventSelected: boolean = false;
  public selectedVenueName = 'No Venue Selected';
  public selectedEventName = 'No Event Selected';
  public selectedEventPictureUrl = '';

  public appPages = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Venue', url: '/venue', icon: 'business' },
    { title: 'Dances', url: '/dances', icon: 'walk' },
    { title: 'Profile', url: '/profile', icon: 'person' },
    { title: 'Help', url: '/help', icon: 'help' },
    { title: 'About', url: '/about', icon: 'information' },
  ];

  constructor(
    private _logger: ILogger,
    private _venueStore: VenueStore,
    private _eventStore: EventStore,
    private _authService: AuthService

  ) {

    this.subscribe();
  }

  // #####################################################################
  // # LIFECYCLE
  // #####################################################################

  ngOnInit() {
    this._logger.trace('SideMenuPage - ngOnInit ', ['SideMenuPage']);

    this.subscribe();

    this._userAuthenticated = this._authService.isAuthenticated()
  }

  ngOnDestroy() {
    this._logger.trace('SideMenuPage - ngOnDestroy ', ['SideMenuPage']);

    this.unsubscribe();
  }


  // #####################################################################
  // # SUBSCRIPTIONS
  // #####################################################################

  private subscribe() {
    this._logger.trace('AppComponent - subscribe ', ['AppComponent']);
    this._authChangedSubscription = this._authService.authChanged$.subscribe(
      (data) => this.userAuthenticatedSubNext(data),
      (err) => this.userAuthenticatedSubError(err),
      () => this.userAuthenticatedSubComplete()
    );

    this._venueChangedSubscription = this._venueStore.primaryVenue$.subscribe(
      (data) => this.venueChangedSubNext(data),
      (err) => this.venueChangedSubError(err),
      () => this.venueChangedSubComplete()
    );

    this._eventChangedSubscription = this._eventStore.primaryEvent$.subscribe(
      (data) => this.eventChangedSubNext(data),
      (err) => this.eventChangedSubError(err),
      () => this.eventChangedSubComplete()
    );
  }

  private unsubscribe() {
    this._logger.trace('SideMenuPage - unsubscribe ', ['SideMenuPage']);
    if (this._authChangedSubscription) {
      this._authChangedSubscription.unsubscribe();
    }
    if (this._venueChangedSubscription) {
      this._venueChangedSubscription.unsubscribe();
    }
    if (this._eventChangedSubscription) {
      this._eventChangedSubscription.unsubscribe();
    }
  }

  private userAuthenticatedSubNext(isAuthenticated: boolean) {
    this._logger.trace('SideMenuPage - userAuthenticatedSubNext ', ['SideMenuPage']);

    this._userAuthenticated = isAuthenticated;

    if(this._userAuthenticated) {
      this.loggedInUser = this._authService.userData().name;
    } else {
      this.loggedInUser = '';
    }
  }

  private userAuthenticatedSubError(err: any) {
    this._logger.trace('SideMenuPage - userAuthenticatedSubError ', ['SideMenuPage']);

    if (this._authChangedSubscription) {
      this._authChangedSubscription.unsubscribe();
    }
  }

  private userAuthenticatedSubComplete() {
    this._logger.trace('SideMenuPage - userAuthenticatedSubComplete ', ['SideMenuPage']);

    if (this._authChangedSubscription) {
      this._authChangedSubscription.unsubscribe();
    }
  }

  private venueChangedSubNext(currentVenue: VenueDto) {
    this._logger.trace('SideMenuPage - venueChangedSubNext ', ['SideMenuPage']);

    this.selectedVenueName = currentVenue ? currentVenue.name : 'No Venue Selected';
  }

  private venueChangedSubError(err: any) {
    this._logger.trace('SideMenuPage - venueChangedSubError ', ['SideMenuPage']);

    if (this._venueChangedSubscription) {
      this._venueChangedSubscription.unsubscribe();
    }
  }

  private venueChangedSubComplete() {
    this._logger.trace('SideMenuPage - venueChangedSubComplete ', ['SideMenuPage']);

    if (this._venueChangedSubscription) {
      this._venueChangedSubscription.unsubscribe();
    }
  }

  private eventChangedSubNext(currentEvent: EventDto) {
    this._logger.trace('SideMenuPage - eventChangedSubNext ', ['SideMenuPage']);

    this.hasEventSelected = currentEvent ? true : false;
    this.selectedEventName = this.hasEventSelected ? currentEvent.name : 'No Event Selected';
    this.selectedEventPictureUrl = this.hasEventSelected ? currentEvent.eventPictureUrl : 'assets/icon/missing-avatar-event.png';
  }

  private eventChangedSubError(err: any) {
    this._logger.trace('SideMenuPage - eventChangedSubError ', ['SideMenuPage']);

    if (this._eventChangedSubscription) {
      this._eventChangedSubscription.unsubscribe();
    }
  }

  private eventChangedSubComplete() {
    this._logger.trace('SideMenuPage - eventChangedSubComplete ', ['SideMenuPage']);

    if (this._eventChangedSubscription) {
      this._eventChangedSubscription.unsubscribe();
    }
  }
}
