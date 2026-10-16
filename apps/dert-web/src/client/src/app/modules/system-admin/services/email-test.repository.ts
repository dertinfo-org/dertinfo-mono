import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { RepositoryBase } from 'app/core/base/repository.base';
import { AppInsightsService } from 'app/core/logging/appinsights.service';
import { ConfigurationService } from 'app/core/services/configuration.service';

export interface EmailTestSendSubmission {
    fromAddress: string;
    fromName: string;
    toAddress: string;
    subject: string;
    htmlBody: string;
}

export interface EmailTestSendResult {
    message: string;
}

@Injectable()
export class EmailTestRepository extends RepositoryBase {

    constructor(http: HttpClient, configurationService: ConfigurationService, appInsightsService: AppInsightsService) {
        super(http, configurationService, appInsightsService);
    }

    public sendTest(submission: EmailTestSendSubmission): Observable<EmailTestSendResult> {
        const url = `${this.ApiUri}/sendemail/test-email-send`;
        return this.http.post<EmailTestSendResult>(url, submission);
    }
}
