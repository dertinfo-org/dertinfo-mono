import { Directive, ElementRef, HostListener } from '@angular/core';

@Directive({
    selector: '[maintain-original]',
    standalone: false
})
export class MaintainOriginalDirective {

    private _preservedVal: string;
    private _clearTimer: ReturnType<typeof setTimeout>;

    constructor(private el: ElementRef) {

    }

    @HostListener('focusin') onFocus() {
        this.focus();
    }

    @HostListener('focusout') onFocusOut() {
        this.focusOut();
    }

    private nativeInput(): HTMLInputElement {
        return this.el.nativeElement.querySelector('input');
    }

    private focus() {
        const input = this.nativeInput();
        this.el.nativeElement.style.backgroundColor = '#8FBE36';
        this._preservedVal = input.value;
        // Ionic 8 wraps the native input, and the focus re-render writes the value back.
        clearTimeout(this._clearTimer);
        this._clearTimer = setTimeout(() => {
            input.value = '';
        });
    }

    private focusOut() {
        clearTimeout(this._clearTimer);
        const input = this.nativeInput();
        this.el.nativeElement.style.backgroundColor = null;
        if (input.value === '') {
            input.value = this._preservedVal;
        }
    }
}
