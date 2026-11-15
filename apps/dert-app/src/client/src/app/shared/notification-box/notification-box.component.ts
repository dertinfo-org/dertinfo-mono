import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-notification-box',
    templateUrl: './notification-box.component.html',
    styleUrls: ['./notification-box.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class NotificationBoxComponent implements OnInit {

  constructor() { }

  @Input() cardType: string = 'warning';
  @Input() header: string = 'Information Header';
  @Input() subText: string = 'Information sub text with detail';
  @Input() icon: string = 'lock-closed-outline';

  ngOnInit() {
  }

}
