import { Directive, ElementRef, Input, OnInit, Renderer2 } from '@angular/core';
import { Observable } from 'rxjs';

@Directive({
    selector: '[isLoading]',
    standalone: false
})
export class LoadingDirective implements OnInit {

    @Input('isLoading') isLoadingObs: Observable<boolean>;

    constructor(private el: ElementRef, private renderer: Renderer2) { }

    ngOnInit() {
        if (this.isLoadingObs) {
            this.isLoadingObs.subscribe((isLoading) => {
                //console.log('LoadingDirective - isLoadingObs - Notified Of Change. IsLoading:' + isLoading);
                this.showLoading(isLoading);
            });
        }
    }

    private showLoading(isLoading: boolean) {
        if (isLoading) {
            //console.log('LoadingDirective - showLoading - true');
            this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', 'Yellow');
        } else {
            //console.log('LoadingDirective - showLoading - false');
            this.renderer.setStyle(this.el.nativeElement, 'backgroundColor', null);
        }
    }
}
