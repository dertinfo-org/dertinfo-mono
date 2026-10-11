import { Component, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { GroupRegisterConductor } from './services/group-register.conductor';
import { GroupRegisterTracker } from './services/group-register.tracker';

@Component({
    selector: 'app-group-register',
    templateUrl: './group-register.component.html',
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GroupRegisterComponent implements OnInit, OnDestroy {

  private _subscriptions: Subscription[] = [];
  private activeView: string = 'start';

  public informationHeader = '';
  public informationBody = '';

  constructor(
    private _activatedRoute: ActivatedRoute,
    private _conductor: GroupRegisterConductor,
    private _tracker: GroupRegisterTracker
  ) { }

  ngOnInit() {

    // Listen for changes to Route Paramaters
    this._subscriptions.push(this._activatedRoute.params.subscribe(params => {
      this._tracker.reset();
      this._conductor.setOverviews(
        this._activatedRoute.snapshot.data.groupRegisterOverview[0],
        this._activatedRoute.snapshot.data.groupRegisterOverview[1],
      );
      this._conductor.initUserData();
      this._conductor.initCatalogue();
      this.activeView = this._activatedRoute.snapshot.params['view'];
    }));

    this._subscriptions.push(this._tracker.configurationHelp$.subscribe(help => {
      if (help != null) {
        this.informationHeader = help.header;
        this.informationBody = help.body;
      }
    }));
  }

  ngOnDestroy() {
    this._subscriptions.map((sub) => { sub.unsubscribe(); });
    this._subscriptions = []; // For good measure
  }
}
