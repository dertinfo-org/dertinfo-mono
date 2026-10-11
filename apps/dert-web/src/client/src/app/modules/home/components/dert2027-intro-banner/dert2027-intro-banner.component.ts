import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'dert2027-intro-banner',
    templateUrl: './dert2027-intro-banner.component.html',
    styleUrls: ['./dert2027-intro-banner.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class Dert2027IntroBannerComponent implements OnInit {

  public registrationLink = '/dashboard';

  constructor() { }

  ngOnInit() {
  }

}
