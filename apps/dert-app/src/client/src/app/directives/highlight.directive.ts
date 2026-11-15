import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[highlight]',
    standalone: false
})
export class HighlightDirective {

    constructor(private el: ElementRef) {

    }

    @HostListener('focus') onFocus() {
        this.focus();
    }

    @HostListener('focusout') onFocusOut() {
        this.focusOut();
    }

    private focus() {
        this.el.nativeElement.style.backgroundColor = '#8FBE36';
    }

    private focusOut() {
        this.el.nativeElement.style.backgroundColor = null;
    }

}
