import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { GroupDto, GroupMinimalSubmissionDto, UserGdprInformationSubmissionDto } from 'app/models/dto';
import { EventDto, EventMinimalSubmissionDto } from 'app/models/dto';
import { EventListCache, GroupListCache, UserRepository } from 'app/modules/repositories';
import { EventRepository } from 'app/modules/repositories';
import { AuthService } from '../../../core/authentication/auth.service';
import { NavigationService } from '../../../core/services/navigation.service';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardConductor {

  [x: string]: any;
  private groupsSubject: BehaviorSubject<GroupDto[]> = new BehaviorSubject<GroupDto[]>([]);
  private eventsSubject: BehaviorSubject<EventDto[]> = new BehaviorSubject<EventDto[]>([]);

  get groups$(): Observable<GroupDto[]> {
    return this.groupsSubject.asObservable();
  }

  get events$(): Observable<EventDto[]> {
    return this.eventsSubject.asObservable();
  }

  constructor(

    private authService: AuthService,
    private dashboardRepo: DashboardRepository,
    private eventRepo: EventRepository,
    private userRepo: UserRepository,
    private eventListCache: EventListCache,
    private groupListCache: GroupListCache,
    private navigationService: NavigationService
  ) {

  }

  public pinNewGroup(newGroup: GroupDto) {
    this.groupsSubject.next([...this.groupsSubject.getValue(), newGroup]);
  }

  public pinNewEvent(newEvent: EventDto) {
    this.eventsSubject.next([...this.eventsSubject.getValue(), newEvent]);
  }

  public addGroup(groupMinimalSubmissionDto: GroupMinimalSubmissionDto): Promise<GroupDto> {

    this.groupListCache.clearCache();

    const userData = this.authService.userData();
    const userFullName = (userData.firstname + ' ' + userData.lastname).trim();

    return new Promise((resolve, reject) => {
      const groupAddObs = this.dashboardRepo.createMinimal(groupMinimalSubmissionDto);
      const subs = groupAddObs.subscribe(
        (groupDto: GroupDto) => {
          subs.unsubscribe();
          this.authService.renewToken()
            .then(() => {
              this.navigationService.addGroupForUser(groupDto);
              resolve(groupDto);
            })
            .catch((err) => reject(err));
        },
        (err) => {
          subs.unsubscribe();
          reject(err);
        }
      );
    });
  }

  public addEvent(eventMinimalSubmissionDto: EventMinimalSubmissionDto): Promise<EventDto> {

    this.eventListCache.clearCache();

    return new Promise((resolve, reject) => {
      const eventAddObs = this.eventRepo.createMinimal(eventMinimalSubmissionDto);
      const subs = eventAddObs.subscribe(
        (eventDto: EventDto) => {
          subs.unsubscribe();
          this.authService.renewToken()
            .then(() => {
              this.navigationService.addEventForUser(eventDto);
              resolve(eventDto);
            })
            .catch((err) => reject(err));
        },
        (err) => {
          subs.unsubscribe();
          reject(err);
        }
      );
    });
  }

  public gdprAcceptanceGained() {

    const gdprSubmission: UserGdprInformationSubmissionDto = {
      gdprConsentGained: true,
      gdprConsentGainedDate: new Date()
    };

    const subs = this.userRepo.updateGdprInformation(gdprSubmission).subscribe(() => {

      this.authService.addGdprConsent();
      // subscripion to make it fire.
      subs.unsubscribe();
    });
  }

  /**
   * Groups Data coming in from the dashboard resolver is applied to the conductor through this method
   */
  public applyGroups(groups: Array<GroupDto>) {

    this.groupsSubject.next(groups);
  }

  /**
   * Events Data coming in from the dashboard resolver is applied to the conductor through this method
   */
  public applyEvents(events: Array<EventDto>) {

    this.eventsSubject.next(events);
  }
}
