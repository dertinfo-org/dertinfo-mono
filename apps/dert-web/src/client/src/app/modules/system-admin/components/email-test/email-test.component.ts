import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

import { EmailTestRepository } from '../../services/email-test.repository';

const defaultHtmlBody = `<html>
<body>
  <h1>Email configuration test</h1>
  <p>This message confirms the configured email provider accepted a send.</p>
</body>
</html>`;

@Component({
    selector: 'app-email-test',
    templateUrl: './email-test.component.html',
    styleUrls: ['./email-test.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class EmailTestComponent {

    sending = false;
    resultMessage = '';
    resultOk = false;

    form = new FormGroup({
        fromAddress: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        fromName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
        toAddress: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.email] }),
        subject: new FormControl('DertInfo email configuration test', { nonNullable: true, validators: [Validators.required] }),
        htmlBody: new FormControl(defaultHtmlBody, { nonNullable: true, validators: [Validators.required] })
    });

    constructor(private emailTestRepository: EmailTestRepository) {
        this.form.valueChanges.subscribe(() => {
            if (!this.sending && this.form.valid) {
                this.resultMessage = '';
            }
        });
    }

    send(): void {
        if (this.sending) {
            return;
        }

        if (this.form.invalid) {
            this.form.markAllAsTouched();
            this.resultOk = false;
            this.resultMessage = 'Enter a from address, a from name, a to address, a subject, and an HTML body.';
            return;
        }

        this.sending = true;
        this.resultMessage = '';

        this.emailTestRepository.sendTest({
            fromAddress: this.form.controls.fromAddress.value.trim(),
            fromName: this.form.controls.fromName.value.trim(),
            toAddress: this.form.controls.toAddress.value.trim(),
            subject: this.form.controls.subject.value.trim(),
            htmlBody: this.form.controls.htmlBody.value
        }).subscribe({
            next: (result) => {
                this.sending = false;
                this.resultOk = true;
                this.resultMessage = result?.message || 'Test email accepted by the provider.';
            },
            error: (err: HttpErrorResponse) => {
                this.sending = false;
                this.resultOk = false;
                this.resultMessage = this.readError(err);
            }
        });
    }

    private readError(err: HttpErrorResponse): string {
        const body = err?.error;
        if (body && typeof body.message === 'string' && body.message) {
            return body.message;
        }
        if (typeof body === 'string' && body) {
            return body;
        }
        if (err?.status === 0) {
            return 'The email test could not reach the API.';
        }
        return 'The test email could not be sent.';
    }
}
