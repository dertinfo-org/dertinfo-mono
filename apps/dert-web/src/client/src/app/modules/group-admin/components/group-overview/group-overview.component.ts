import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { EventDto, GroupOverviewDto, GroupRegistrationDto } from 'app/models/dto';
import { Observable ,  Subscription } from 'rxjs';
import { GroupAdminConductor } from '../../services/group-admin.conductor';
import { GroupAdminTracker } from '../../services/group-admin.tracker';

@Component({
    selector: 'app-group-overview',
    templateUrl: './group-overview.component.html',
    styleUrls: ['./group-overview.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GroupOverviewComponent implements OnInit, OnDestroy {

  private _subscriptions: Subscription[] = [];

  public vm = {
    contactEmail: '',
    contactName: '',
    contactTelephone: '',
    membersCount: 0,
    registrationsCount: 0,
    teamsCount: 0,
    unpaidInvoicesCount: 0,
    activeRegistrations: [],
    promotedEvents: [],
    isConfigured: true
  };

  constructor(
    private _groupConductor: GroupAdminConductor,
    private _groupTracker: GroupAdminTracker
  ) { }

  ngOnInit() {

    // Listen for changes to Overview
    this._subscriptions.push(this._groupTracker.groupOverview$.subscribe((groupOverview) => {
      if (groupOverview) {

        this.vm = {
          contactEmail: groupOverview.groupEmail,
          contactName: groupOverview.contactName,
          contactTelephone: groupOverview.contactTelephone,
          membersCount: groupOverview.membersCount,
          registrationsCount: groupOverview.registrationsCount,
          teamsCount: groupOverview.teamsCount,
          unpaidInvoicesCount: groupOverview.unpaidInvoicesCount,
          activeRegistrations: [],
          promotedEvents: [],
          isConfigured: groupOverview.isConfigured
        };

        // Init Registrations if not already recieved
        this._groupConductor.initRegistrations(this._groupTracker.groupId);
      }
    }));

    // Listen for changes to Registrations
    this._subscriptions.push(this._groupTracker.activeRegistrations$.subscribe((activeRegistrations) => {
      this.vm.activeRegistrations = activeRegistrations;
    }));

    // Listen for changes to Promoted Events
    this._subscriptions.push(this._groupTracker.promotedEvents$.subscribe((promotedEvents) => {
      this.vm.promotedEvents = promotedEvents;
    }));
  }

  public getRegistrationRouteLink(event: EventDto) {
    const alreadyRegistered = this.vm.activeRegistrations.find(r => r.eventId === event.id);
    if (alreadyRegistered) {
      return [`/group-registration/${alreadyRegistered.id}/overview`];
    } else {
      return [`/group-register/${this._groupTracker.groupId}/${event.id}/start`];
    }
  }

  ngOnDestroy() {
    this._subscriptions.map((sub) => { sub.unsubscribe(); });
    this._subscriptions = []; // For good measure
  }

}
