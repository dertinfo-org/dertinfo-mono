import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { AppConstants } from 'app/app.constants';
import { MemberType } from 'app/models/app/Enumerations/MemberType';
import {
  ActivityDto,
  GroupMemberDto,
  GroupRegistrationDto,
  GroupTeamDto
} from 'app/models/dto';
import { GroupRegisterTermsComponent } from 'app/regions/terms/components/group-register-terms/group-register-terms.component';
import { Subscription } from 'rxjs';
import { GroupRegisterConductor } from '../../services/group-register.conductor';
import { GroupRegisterSelection, GroupRegisterTracker } from '../../services/group-register.tracker';

interface SummaryLine {
  name: string;
  role: string;
  ticket: string;
  price: number;
  priceTBC: boolean;
}

@Component({
    selector: 'app-start',
    templateUrl: './start.component.html',
    styleUrls: ['./start.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StartComponent implements OnInit, OnDestroy {

  private _subscriptions: Subscription[] = [];
  private readonly listPageSize = 5;

  public eventName: string;
  public eventSynopsis: string;
  public eventPictureUrl: string;
  public eventStartDate: Date;
  public eventEndDate: Date;
  public locationTown: string;
  public locationPostcode: string;
  public teams: GroupTeamDto[] = [];
  public members: GroupMemberDto[] = [];
  public teamActivities: ActivityDto[] = [];
  public individualActivities: ActivityDto[] = [];
  public selection: GroupRegisterSelection = {
    teamIds: [],
    personIds: [],
    teamActivityIds: {},
    personActivityIds: {}
  };
  public memberType = MemberType;
  public submitting = false;
  public teamSearch = '';
  public personSearch = '';
  public teamsExpanded = false;
  public peopleExpanded = false;

  termsAndConditionsFormGroup: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    private _conductor: GroupRegisterConductor,
    private _tracker: GroupRegisterTracker,
    public composeDialog: MatDialog,
    private snackBar: MatSnackBar,
    private router: Router
  ) { }

  ngOnInit() {

    this.termsAndConditionsFormGroup = this.fb.group({
      agreeToTermsAndConditions: [false, Validators.requiredTrue]
    });

    this._subscriptions.push(this._tracker.eventDto$.subscribe((eventDto) => {
      if (eventDto) {
        this.eventName = eventDto.name;
        this.eventSynopsis = eventDto.eventSynopsis;
        this.eventPictureUrl = eventDto.eventPictureUrl;
        this.eventStartDate = eventDto.eventStartDate;
        this.eventEndDate = eventDto.eventEndDate;
        this.locationTown = eventDto.locationTown;
        this.locationPostcode = eventDto.locationPostcode;
      }
    }));

    this._subscriptions.push(this._tracker.teams$.subscribe((teams) => {
      this.teams = teams || [];
    }));

    this._subscriptions.push(this._tracker.members$.subscribe((members) => {
      this.members = members || [];
    }));

    this._subscriptions.push(this._tracker.teamActivities$.subscribe((activities) => {
      this.teamActivities = activities || [];
    }));

    this._subscriptions.push(this._tracker.individualActivities$.subscribe((activities) => {
      this.individualActivities = activities || [];
    }));

    this._subscriptions.push(this._tracker.selection$.subscribe((selection) => {
      if (selection) {
        this.selection = selection;
      }
    }));
  }

  ngOnDestroy() {
    this._subscriptions.map((sub) => { sub.unsubscribe(); });
    this._subscriptions = [];
  }

  public get selectedTeams(): GroupTeamDto[] {
    return this.teams.filter(team => this.selection.teamIds.indexOf(team.teamId) >= 0);
  }

  public get selectedPeople(): GroupMemberDto[] {
    return this.members.filter(person => this.selection.personIds.indexOf(person.groupMemberId) >= 0);
  }

  public get filteredTeams(): GroupTeamDto[] {
    return this.filterByName(this.teams, this.teamSearch, team => team.teamName);
  }

  public get visibleTeams(): GroupTeamDto[] {
    return this.teamsExpanded ? this.filteredTeams : this.filteredTeams.slice(0, this.listPageSize);
  }

  public get teamsHaveMore(): boolean {
    return !this.teamsExpanded && this.filteredTeams.length > this.listPageSize;
  }

  public get filteredPeople(): GroupMemberDto[] {
    return this.filterByName(this.members, this.personSearch, person => person.name);
  }

  public get visiblePeople(): GroupMemberDto[] {
    return this.peopleExpanded ? this.filteredPeople : this.filteredPeople.slice(0, this.listPageSize);
  }

  public get peopleHaveMore(): boolean {
    return !this.peopleExpanded && this.filteredPeople.length > this.listPageSize;
  }

  public get summaryLines(): SummaryLine[] {
    const lines: SummaryLine[] = [];
    this.selectedTeams.forEach(team => {
      this.ticketsForTeam(team.teamId).forEach(activity => {
        lines.push({
          name: team.teamName,
          role: 'Team',
          ticket: activity.title,
          price: activity.price,
          priceTBC: activity.priceTBC
        });
      });
    });
    this.selectedPeople.forEach(person => {
      this.ticketsForPerson(person.groupMemberId).forEach(activity => {
        lines.push({
          name: person.name,
          role: this.personKind(person),
          ticket: activity.title,
          price: activity.price,
          priceTBC: activity.priceTBC
        });
      });
    });
    return lines;
  }

  public get summaryTotalIsTbc(): boolean {
    return this.summaryLines.length > 0 && this.summaryLines.every(line => line.priceTBC);
  }

  public get summaryTotal(): number {
    return this.summaryLines.reduce((total, line) => {
      if (line.priceTBC) {
        return total;
      }
      return total + (line.price || 0);
    }, 0);
  }

  public isTeamSelected(teamId: number): boolean {
    return this.selection.teamIds.indexOf(teamId) >= 0;
  }

  public isPersonSelected(personId: number): boolean {
    return this.selection.personIds.indexOf(personId) >= 0;
  }

  public isTeamActivitySelected(teamId: number, activityId: number): boolean {
    const selected = this.selection.teamActivityIds[teamId] || [];
    return selected.indexOf(activityId) >= 0;
  }

  public isPersonActivitySelected(personId: number, activityId: number): boolean {
    const selected = this.selection.personActivityIds[personId] || [];
    return selected.indexOf(activityId) >= 0;
  }

  public ticketsForTeam(teamId: number): ActivityDto[] {
    const selected = this.selection.teamActivityIds[teamId] || [];
    return this.teamActivities.filter(activity => selected.indexOf(activity.id) >= 0);
  }

  public ticketsForPerson(personId: number): ActivityDto[] {
    const selected = this.selection.personActivityIds[personId] || [];
    return this.individualActivities.filter(activity => selected.indexOf(activity.id) >= 0);
  }

  public personKind(person: GroupMemberDto): string {
    return person.memberType === MemberType.guest ? 'Guest' : 'Member';
  }

  public selectedTeamCountLabel(): string {
    return this.countLabel(this.selectedTeams.length, 'team', 'teams');
  }

  public selectedPersonCountLabel(): string {
    return this.countLabel(this.selectedPeople.length, 'person', 'people');
  }

  public onTeamSearch(event: Event) {
    this.teamSearch = (event.target as HTMLInputElement).value;
    this.teamsExpanded = false;
  }

  public onPersonSearch(event: Event) {
    this.personSearch = (event.target as HTMLInputElement).value;
    this.peopleExpanded = false;
  }

  public showMoreTeams() {
    this.teamsExpanded = true;
  }

  public showMorePeople() {
    this.peopleExpanded = true;
  }

  public trackTeam(_index: number, team: GroupTeamDto): number {
    return team.teamId;
  }

  public trackPerson(_index: number, person: GroupMemberDto): number {
    return person.groupMemberId;
  }

  public trackActivity(_index: number, activity: ActivityDto): number {
    return activity.id;
  }

  public onTeamToggle(teamId: number) {
    this._conductor.toggleTeam(teamId);
  }

  public onPersonToggle(personId: number) {
    this._conductor.togglePerson(personId);
  }

  public onTeamActivityToggle(teamId: number, activityId: number) {
    this._conductor.toggleTeamActivity(teamId, activityId);
  }

  public onPersonActivityToggle(personId: number, activityId: number) {
    this._conductor.togglePersonActivity(personId, activityId);
  }

  submit() {
    if (!this.termsAndConditionsFormGroup.valid || this.submitting) {
      return;
    }

    this.submitting = true;

    this._conductor.submitGroupRegistration(this.termsAndConditionsFormGroup.value.agreeToTermsAndConditions)
      .subscribe((registrationDto: GroupRegistrationDto) => {
        this._conductor.clear();
        this.router.navigate(['group-registration', registrationDto.id]);
      }, () => {
        this.submitting = false;
        this.snackBar.open('Registration could not be created.', 'Dismiss', { duration: 5000 });
      });
  }

  onStepperStepChange($event) {
    this._conductor.startStepperStepChanged($event);
  }

  onTermsAndConditionsClick() {
    const dialogRef = this.composeDialog.open(GroupRegisterTermsComponent, AppConstants.largeMatDialogConfig);
    dialogRef.afterClosed().subscribe(() => { });
  }

  private filterByName<T>(items: T[], search: string, nameOf: (item: T) => string): T[] {
    const query = (search || '').trim().toLowerCase();
    if (!query) {
      return items;
    }
    return items.filter(item => (nameOf(item) || '').toLowerCase().indexOf(query) >= 0);
  }

  private countLabel(count: number, singular: string, plural: string): string {
    return `${count} ${count === 1 ? singular : plural} selected`;
  }
}
