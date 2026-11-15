import { Directive, forwardRef } from '@angular/core';
import { AbstractControl, UntypedFormControl, NG_VALIDATORS, Validator, ValidatorFn } from '@angular/forms';

function validateRangeFactory(minValue: number, maxValue: number) {

    return (c: UntypedFormControl) => {

        // prepare the return
        const isValid = c.value >= minValue && c.value <= maxValue;

        return isValid ? null : {
            validateRange: {
                valid: false
            }
        };
    };
}


@Directive({
    selector: '[validateRange][formControlName],[validateRange][formControl],[validateRange][ngModel]',
    providers: [
        { provide: NG_VALIDATORS, useExisting: forwardRef(() => RangeValidator), multi: true }
    ],
    standalone: false
})
export class RangeValidator implements Validator {

    validatorFunction: ValidatorFn;

    initValidationFunction(rangeMin: number, rangeMax: number) {
        this.validatorFunction = validateRangeFactory(rangeMin, rangeMax);
    }

    validate(c: AbstractControl) {
        return this.validatorFunction(c);
    }


}



