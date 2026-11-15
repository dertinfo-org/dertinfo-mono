import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
    selector: 'app-loader',
    templateUrl: 'loader.component.html',
    styleUrls: ['loader.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoaderComponent {

    @Input() showLoading;
    @Input() loadingText;
}
