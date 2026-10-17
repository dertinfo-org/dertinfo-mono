import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationService } from 'app/core/services/navigation.service';
import {
    GroupRegistrationDto,
    GroupRegistrationSubmissionDto,
    MemberAttendanceDto,
    TeamAttendanceDto,
} from 'app/models/dto';
import { EventDto, GroupDto } from 'app/models/dto';
import { EventRepository, RegistrationRepository } from 'app/modules/repositories';
import { forkJoin, Observable, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AuthService } from '../../../core/authentication/auth.service';
import { GroupRegisterRepository } from './group-register.repository';
import { GroupRegisterTracker } from './group-register.tracker';

declare function require(url: string);
const help = require('../../../../assets/help/app-group-register.en.json');

@Injectable()
export class GroupRegisterConductor {

    private startStepperOrder = ['event-details', 'event-pricing', 'teams-and-people', 'activities', 'summary', 'terms'];

    constructor(
        public authService: AuthService,
        private eventRepo: EventRepository,
        private groupRepo: GroupRegisterRepository,
        private registrationRepo: RegistrationRepository,
        private navigationService: NavigationService,
        private snackBar: MatSnackBar,
        private _tracker: GroupRegisterTracker,

    ) { }

    public setOverviews(groupDto: GroupDto, eventDto: EventDto) {

        let doReset = false;
        if (this._tracker.groupDto && this._tracker.groupId !== groupDto.id) { doReset = true; }
        if (this._tracker.eventDto && this._tracker.eventId !== eventDto.id) { doReset = true; }

        if (doReset) {
            this._tracker.reset();
        }

        this._tracker.groupDto = groupDto;
        this._tracker.eventDto = eventDto;
    }

    public clear() {
        this._tracker.reset();
    }

    public initUserData() {
        if (!this._tracker.hasLoadedUserData()) {
            this._tracker.userData = this.authService.userData();
        }
    }

    public initCatalogue() {
        this.initTeams();
        this.initMembers();
        this.initTeamActivities();
        this.initIndividualActivities();
    }

    public initTeams() {
        if (this._tracker.hasLoadedTeams()) {
            return;
        }

        const groupId = this._tracker.groupId;
        const subs = this.groupRepo.teams(groupId).subscribe((teams) => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedGroupDto() && this._tracker.groupId === groupId) {
                this._tracker.teams = teams;
            }
        }, () => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedGroupDto() && this._tracker.groupId === groupId) {
                this._tracker.teams = [];
            }
        });
    }

    public initMembers() {
        if (this._tracker.hasLoadedMembers()) {
            return;
        }

        const groupId = this._tracker.groupId;
        const subs = this.groupRepo.members(groupId).subscribe((members) => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedGroupDto() && this._tracker.groupId === groupId) {
                this._tracker.members = members;
            }
        }, () => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedGroupDto() && this._tracker.groupId === groupId) {
                this._tracker.members = [];
            }
        });
    }

    public initTeamActivities() {
        if (this._tracker.hasLoadedTeamActivities()) {
            return;
        }

        const eventId = this._tracker.eventId;
        const subs = this.eventRepo.publishedTeamActivities(eventId).subscribe((activities) => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedEventDto() && this._tracker.eventId === eventId) {
                this._tracker.teamActivities = activities;
            }
        }, () => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedEventDto() && this._tracker.eventId === eventId) {
                this._tracker.teamActivities = [];
            }
        });
    }

    public initIndividualActivities() {
        if (this._tracker.hasLoadedIndividualActivities()) {
            return;
        }

        const eventId = this._tracker.eventId;
        const subs = this.eventRepo.publishedIndividualActivities(eventId).subscribe((activities) => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedEventDto() && this._tracker.eventId === eventId) {
                this._tracker.individualActivities = activities;
            }
        }, () => {
            subs.unsubscribe();
            if (this._tracker.hasLoadedEventDto() && this._tracker.eventId === eventId) {
                this._tracker.individualActivities = [];
            }
        });
    }

    public toggleTeam(teamId: number) {
        this._tracker.toggleTeam(teamId);
    }

    public togglePerson(personId: number) {
        this._tracker.togglePerson(personId);
    }

    public toggleTeamActivity(teamId: number, activityId: number) {
        this._tracker.toggleTeamActivity(teamId, activityId);
    }

    public togglePersonActivity(personId: number, activityId: number) {
        this._tracker.togglePersonActivity(personId, activityId);
    }

    public startStepperStepChanged($event: any) {

        if (this.startStepperOrder.length > $event.selectedIndex) {
            this._tracker.help = help[this.startStepperOrder[$event.selectedIndex]];
        } else {
            this._tracker.help = { header: 'Help Not Available', body: '' };
        }
    }

    public submitGroupRegistration(agreeToTermsAndConditions: boolean): Observable<GroupRegistrationDto> {

        const groupRegistrationSubmissionDto: GroupRegistrationSubmissionDto = {
            agreeToTermsAndConditions,
            eventId: this._tracker.eventId
        };

        return this.groupRepo.addRegistration(this._tracker.groupId, groupRegistrationSubmissionDto).pipe(
            tap((registration) => {
                this.navigationService.markEventConfiguredForUser(registration.id);
            }),
            switchMap((registration) => this.persistSelections(registration).pipe(
                catchError(() => {
                    this.snackBar.open(
                        'The registration was created, but some choices could not be saved. You can finish them on the registration page.',
                        'Dismiss',
                        { duration: 5000 }
                    );
                    return of(registration);
                })
            ))
        );
    }

    private persistSelections(registration: GroupRegistrationDto): Observable<GroupRegistrationDto> {
        const registrationId = registration.id;
        const teamIds = this._tracker.selection.teamIds;
        const personIds = this._tracker.selection.personIds;
        const calls: Observable<any>[] = [];

        if (teamIds.length) {
            calls.push(this.registrationRepo.batchAddTeamAttendances(
                registrationId,
                teamIds.map(teamId => ({ teamAttendanceId: 0, teamId }))
            ));
        }

        if (personIds.length) {
            calls.push(this.registrationRepo.batchAddMemberAttendances(
                registrationId,
                personIds.map(groupMemberId => ({ memberAttendanceId: 0, groupMemberId }))
            ));
        }

        if (!calls.length) {
            return of(registration);
        }

        return forkJoin(calls).pipe(
            switchMap((results) => {
                const reconcileCalls: Observable<any>[] = [];
                let index = 0;

                if (teamIds.length) {
                    const attendances = (results[index++] || []) as TeamAttendanceDto[];
                    attendances.forEach(attendance => {
                        reconcileCalls.push(...this.reconcileTeam(registrationId, attendance));
                    });
                }

                if (personIds.length) {
                    const attendances = (results[index++] || []) as MemberAttendanceDto[];
                    attendances.forEach(attendance => {
                        reconcileCalls.push(...this.reconcilePerson(registrationId, attendance));
                    });
                }

                if (!reconcileCalls.length) {
                    return of(registration);
                }

                return forkJoin(reconcileCalls).pipe(map(() => registration));
            })
        );
    }

    private reconcileTeam(registrationId: number, attendance: TeamAttendanceDto): Observable<any>[] {
        const selected = this._tracker.activityIdsForTeam(attendance.teamId);
        const attached = attendance.attendanceActivities || [];
        const attachedIds = attached.map(activity => activity.activityId);
        const toAdd = selected.filter(activityId => attachedIds.indexOf(activityId) < 0);
        const toRemove = attached
            .filter(activity => selected.indexOf(activity.activityId) < 0)
            .map(activity => activity.id);
        const calls: Observable<any>[] = [];

        if (toAdd.length) {
            calls.push(this.registrationRepo.batchAddTeamAttendanceActivities(
                registrationId,
                attendance.id,
                { activityIds: toAdd }
            ));
        }

        if (toRemove.length) {
            calls.push(this.registrationRepo.batchRemoveTeamAttendanceActivities(
                registrationId,
                attendance.id,
                { activityTeamAttendanceIds: toRemove }
            ));
        }

        return calls;
    }

    private reconcilePerson(registrationId: number, attendance: MemberAttendanceDto): Observable<any>[] {
        const selected = this._tracker.activityIdsForPerson(attendance.groupMemberId);
        const attached = attendance.attendanceActivities || [];
        const attachedIds = attached.map(activity => activity.activityId);
        const toAdd = selected.filter(activityId => attachedIds.indexOf(activityId) < 0);
        const toRemove = attached
            .filter(activity => selected.indexOf(activity.activityId) < 0)
            .map(activity => activity.id);
        const calls: Observable<any>[] = [];

        if (toAdd.length) {
            calls.push(this.registrationRepo.batchAddMemberAttendanceActivities(
                registrationId,
                attendance.id,
                { activityIds: toAdd }
            ));
        }

        if (toRemove.length) {
            calls.push(this.registrationRepo.batchRemoveMemberAttendanceActivities(
                registrationId,
                attendance.id,
                { activityMemberAttendanceIds: toRemove }
            ));
        }

        return calls;
    }
}
