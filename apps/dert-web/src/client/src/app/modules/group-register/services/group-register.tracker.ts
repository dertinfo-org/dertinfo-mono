// Angular & RxJS
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

// Types
import { InformationPanelData } from 'app/models/app';
import { UserData } from 'app/models/auth/userdata.model';
import { ActivityDto, EventDto, GroupDto, GroupMemberDto, GroupTeamDto } from 'app/models/dto';

export interface GroupRegisterSelection {
    teamIds: number[];
    personIds: number[];
    teamActivityIds: { [teamId: number]: number[] | null };
    personActivityIds: { [personId: number]: number[] | null };
}

// Requires
declare function require(url: string);
const help = require('../../../../assets/help/app-group-register.en.json');

@Injectable()
export class GroupRegisterTracker {

    // #region Observables and Subjects

    private _userData = new BehaviorSubject<UserData>(null);
    private _groupDto = new BehaviorSubject<GroupDto>(null);
    private _eventDto = new BehaviorSubject<EventDto>(null);
    private _teams = new BehaviorSubject<GroupTeamDto[]>(null);
    private _members = new BehaviorSubject<GroupMemberDto[]>(null);
    private _teamActivities = new BehaviorSubject<ActivityDto[]>(null);
    private _individualActivities = new BehaviorSubject<ActivityDto[]>(null);
    private _selection = new BehaviorSubject<GroupRegisterSelection>(this.emptySelection());
    private _configurationHelp = new BehaviorSubject<InformationPanelData>(help['event-details']);

    get userData$() { return this._userData.asObservable(); }
    get groupDto$() { return this._groupDto.asObservable(); }
    get eventDto$() { return this._eventDto.asObservable(); }
    get teams$() { return this._teams.asObservable(); }
    get members$() { return this._members.asObservable(); }
    get teamActivities$() { return this._teamActivities.asObservable(); }
    get individualActivities$() { return this._individualActivities.asObservable(); }
    get selection$() { return this._selection.asObservable(); }
    get configurationHelp$() { return this._configurationHelp.asObservable(); }

    // #endregion

    private _memoryStore: {
        userData: UserData,
        groupDto: GroupDto,
        eventDto: EventDto,
        teams: GroupTeamDto[],
        members: GroupMemberDto[],
        teamActivities: ActivityDto[],
        individualActivities: ActivityDto[],
        selection: GroupRegisterSelection,
        infoPanelData: InformationPanelData
    };

    constructor() {
        this.reset();
    }

    // #region Properties Getters

    public get groupId(): number {
        return this._memoryStore.groupDto.id;
    }

    public get eventId(): number {
        return this._memoryStore.eventDto.id;
    }

    public get groupDto(): GroupDto {
        return this._memoryStore.groupDto;
    }

    public get eventDto(): EventDto {
        return this._memoryStore.eventDto;
    }

    public get selection(): GroupRegisterSelection {
        return this._memoryStore.selection;
    }

    public get teamActivities(): ActivityDto[] {
        return this._memoryStore.teamActivities;
    }

    public get individualActivities(): ActivityDto[] {
        return this._memoryStore.individualActivities;
    }

    // #endregion

    // #region Properties Setters

    public set groupDto(groupDto: GroupDto) {
        this._memoryStore.groupDto = groupDto;
        this._groupDto.next(this._memoryStore.groupDto);
    }

    public set eventDto(eventDto: EventDto) {
        this._memoryStore.eventDto = eventDto;
        this._eventDto.next(this._memoryStore.eventDto);
    }

    public set userData(userData: UserData) {
        this._memoryStore.userData = userData;
        this._userData.next(this._memoryStore.userData);
    }

    public set teams(teams: GroupTeamDto[]) {
        this._memoryStore.teams = teams || [];
        this._teams.next(this._memoryStore.teams);
    }

    public set members(members: GroupMemberDto[]) {
        this._memoryStore.members = members || [];
        this._members.next(this._memoryStore.members);
    }

    public set teamActivities(teamActivities: ActivityDto[]) {
        this._memoryStore.teamActivities = teamActivities || [];
        this.applyPendingDefaults(true);
        this._teamActivities.next(this._memoryStore.teamActivities);
        this.publishSelection();
    }

    public set individualActivities(individualActivities: ActivityDto[]) {
        this._memoryStore.individualActivities = individualActivities || [];
        this.applyPendingDefaults(false);
        this._individualActivities.next(this._memoryStore.individualActivities);
        this.publishSelection();
    }

    public set help(infoPanelData: InformationPanelData) {
        this._memoryStore.infoPanelData = infoPanelData;
        this._configurationHelp.next(this._memoryStore.infoPanelData);
    }

    // #endregion

    // #region Selection

    public toggleTeam(teamId: number) {
        const teamIds = this.selection.teamIds.slice();
        const teamActivityIds = { ...this.selection.teamActivityIds };
        const index = teamIds.indexOf(teamId);

        if (index >= 0) {
            teamIds.splice(index, 1);
            delete teamActivityIds[teamId];
        } else {
            teamIds.push(teamId);
            teamActivityIds[teamId] = this.defaultActivityIds(this._memoryStore.teamActivities);
        }

        this._memoryStore.selection = { ...this.selection, teamIds, teamActivityIds };
        this.publishSelection();
    }

    public togglePerson(personId: number) {
        const personIds = this.selection.personIds.slice();
        const personActivityIds = { ...this.selection.personActivityIds };
        const index = personIds.indexOf(personId);

        if (index >= 0) {
            personIds.splice(index, 1);
            delete personActivityIds[personId];
        } else {
            personIds.push(personId);
            personActivityIds[personId] = this.defaultActivityIds(this._memoryStore.individualActivities);
        }

        this._memoryStore.selection = { ...this.selection, personIds, personActivityIds };
        this.publishSelection();
    }

    public toggleTeamActivity(teamId: number, activityId: number) {
        if (this.selection.teamIds.indexOf(teamId) < 0) {
            return;
        }

        const teamActivityIds = { ...this.selection.teamActivityIds };
        teamActivityIds[teamId] = this.toggleActivityId(
            teamActivityIds[teamId],
            activityId,
            this._memoryStore.teamActivities
        );
        this._memoryStore.selection = { ...this.selection, teamActivityIds };
        this.publishSelection();
    }

    public togglePersonActivity(personId: number, activityId: number) {
        if (this.selection.personIds.indexOf(personId) < 0) {
            return;
        }

        const personActivityIds = { ...this.selection.personActivityIds };
        personActivityIds[personId] = this.toggleActivityId(
            personActivityIds[personId],
            activityId,
            this._memoryStore.individualActivities
        );
        this._memoryStore.selection = { ...this.selection, personActivityIds };
        this.publishSelection();
    }

    public activityIdsForTeam(teamId: number): number[] {
        return (this.selection.teamActivityIds[teamId] || []).slice();
    }

    public activityIdsForPerson(personId: number): number[] {
        return (this.selection.personActivityIds[personId] || []).slice();
    }

    // #endregion

    // #region Properties hasLoaded()

    public hasLoadedGroupDto(): boolean {
        return this._memoryStore.groupDto !== null;
    }

    public hasLoadedEventDto(): boolean {
        return this._memoryStore.eventDto !== null;
    }

    public hasLoadedUserData(): boolean {
        return this._memoryStore.userData !== null;
    }

    public hasLoadedTeams(): boolean {
        return this._memoryStore.teams !== null;
    }

    public hasLoadedMembers(): boolean {
        return this._memoryStore.members !== null;
    }

    public hasLoadedTeamActivities(): boolean {
        return this._memoryStore.teamActivities !== null;
    }

    public hasLoadedIndividualActivities(): boolean {
        return this._memoryStore.individualActivities !== null;
    }

    // #endregion

    public reset() {

        this._memoryStore = {
            groupDto: null,
            eventDto: null,
            userData: null,
            teams: null,
            members: null,
            teamActivities: null,
            individualActivities: null,
            selection: this.emptySelection(),
            infoPanelData: help['event-details']
        };

        this._userData.next(null);
        this._groupDto.next(null);
        this._eventDto.next(null);
        this._teams.next(null);
        this._members.next(null);
        this._teamActivities.next(null);
        this._individualActivities.next(null);
        this._selection.next(this.emptySelection());
        this._configurationHelp.next(help['event-details']);

    }

    private emptySelection(): GroupRegisterSelection {
        return {
            teamIds: [],
            personIds: [],
            teamActivityIds: {},
            personActivityIds: {}
        };
    }

    private publishSelection() {
        this._selection.next(this._memoryStore.selection);
    }

    private defaultActivityIds(activities: ActivityDto[]): number[] {
        if (!activities) {
            return null;
        }

        return activities.filter(activity => activity.isDefault && !activity.soldOut).map(activity => activity.id);
    }

    private applyPendingDefaults(forTeams: boolean) {
        const activities = forTeams ? this._memoryStore.teamActivities : this._memoryStore.individualActivities;
        const selectedIds = forTeams ? this.selection.teamIds : this.selection.personIds;
        const activityIds = forTeams
            ? { ...this.selection.teamActivityIds }
            : { ...this.selection.personActivityIds };
        let changed = false;

        selectedIds.forEach(id => {
            if (activityIds[id] === null) {
                activityIds[id] = this.defaultActivityIds(activities);
                changed = true;
            }
        });

        if (!changed) {
            return;
        }

        this._memoryStore.selection = forTeams
            ? { ...this.selection, teamActivityIds: activityIds }
            : { ...this.selection, personActivityIds: activityIds };
    }

    private toggleActivityId(currentIds: number[], activityId: number, activities: ActivityDto[]): number[] {
        const nextIds = (currentIds || []).slice();
        const index = nextIds.indexOf(activityId);

        if (index >= 0) {
            nextIds.splice(index, 1);
            return nextIds;
        }

        const activity = (activities || []).find(item => item.id === activityId);
        if (activity && !activity.soldOut) {
            nextIds.push(activityId);
        }

        return nextIds;
    }

}
