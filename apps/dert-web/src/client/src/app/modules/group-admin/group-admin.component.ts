import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { GroupOverviewDto } from 'app/models/dto';
import { Observable ,  Subscription } from 'rxjs';
import { GroupAdminConductor } from './services/group-admin.conductor';
import { GroupAdminTracker } from './services/group-admin.tracker';

@Component({
    selector: 'app-group-admin',
    templateUrl: './group-admin.component.html',
    styleUrls: ['./group-admin.component.css'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GroupAdminComponent implements OnInit, OnDestroy {

  private _subscriptions: Subscription[] = [];

  private groupOverview: Observable<GroupOverviewDto>;

  public groupId;
  public groupName;
  public groupBio;
  public groupEmail;
  public groupPictureUrl;
  public contactName;
  public contactTelephone;
  public originTown;
  public isConfigured = true;
  public showDertOfDertsMenu = false;
  public showDertOfDertsMenuRoute;

  activeView: string = 'overview';

  // Doughnut
  doughnutChartColors: any[] = [{
    backgroundColor: ['#fff', 'rgba(0, 0, 0, .24)', ]
  }];

  total1: number = 500;
  data1: number = 200;
  doughnutChartData1: number[] = [this.data1, (this.total1 - this.data1)];

  total2: number = 1000;
  data2: number = 400;
  doughnutChartData2: number[] = [this.data2, (this.total2 - this.data2)];

  doughnutChartType = 'doughnut';
  doughnutOptions: any = {
    cutoutPercentage: 85,
    responsive: true,
    maintainAspectRatio: true,
    legend: {
      display: false,
      position: 'bottom'
    },
    elements: {
      arc: {
        borderWidth: 0,
      }
    },
    tooltips: {
      enabled: false
    }
  };

  constructor(
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private groupConductor: GroupAdminConductor,
    private _groupTracker: GroupAdminTracker,

  ) { }

  ngOnInit() {

    // Listen for changes to Route Paramaters
    this._subscriptions.push(this.activatedRoute.params.subscribe(params => {

      // Insert the data from the resolver
      this.groupConductor.setOverview(this.activatedRoute.snapshot.data.groupOverview);
      this.activeView = this.activatedRoute.snapshot.params['view'];

      // This is dirty please don't copy this.
      const groupId = this.activatedRoute.snapshot.params['id'];
      const groupName = this.activatedRoute.snapshot.params['name'];
      this.showDertOfDertsMenu = this.activatedRoute.snapshot.data.showDertOfDerts;
      this.showDertOfDertsMenuRoute = `/group-view/${groupName}/${groupId}/dertofderts`;
    }));

    // Listen for changes to Overview
    this._subscriptions.push(this._groupTracker.groupOverview$.subscribe((groupOverview) => {
      if (groupOverview) {
        this.groupId = groupOverview.id;
        this.groupName = groupOverview.groupName;
        this.groupBio = groupOverview.groupBio;
        this.groupEmail = groupOverview.groupEmail;
        this.groupPictureUrl = groupOverview.groupPictureUrl;
        this.contactName = groupOverview.contactName;
        this.contactTelephone = groupOverview.contactTelephone;
        this.originTown = groupOverview.originTown;
        this.isConfigured = groupOverview.isConfigured;
      }
    }));

  }

  public configureGroup(): void {
    this.router.navigate(['/group-configure', this.groupName, this.groupId, 'start']);
  }

  ngOnDestroy() {

    this._groupTracker.reset();
    this._subscriptions.map((sub) => { sub.unsubscribe(); });
    this._subscriptions = []; // For good measure
  }

}
