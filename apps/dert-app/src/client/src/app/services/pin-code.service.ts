// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ILogger } from '../providers/diagnostics/logger';
import { Observable, throwError } from 'rxjs';

// Application
import { PinCodeSubmissionDto } from '../models/dto/index';
import { ConfigurationService } from './configuration.service';


@Injectable()
export class PinCodeService {

    constructor(private _logger: ILogger, private _authHttp: HttpClient, private _configurationService: ConfigurationService) {
        this._logger.trace('PinCodeService - constructor ', ['PinCodeService']);
    }

    submitPinCode(pinCodeSubmissionDto: PinCodeSubmissionDto): Observable<PinCodeSubmissionDto> {
        this._logger.trace('PinCodeService - submitPinCode ', ['PinCodeService']);

        const url = this._configurationService.baseApiUrl + '/pincode';

        return this._authHttp.post(url, pinCodeSubmissionDto) as Observable<PinCodeSubmissionDto>;
    }

    private handleError(error: Response | any) {
        this._logger.trace('PinCodeService - handleError ', ['PinCodeService']);
        // In a real world app, we might use a remote logging infrastructure
        let errMsg: string;
        if (error instanceof Response) {
            const body = error.json() || '';
            const err = body || JSON.stringify(body);
            errMsg = `${error.status} - ${error.statusText || ''} ${err}`;
        } else {
            errMsg = error.message ? error.message : error.toString();
        }
        console.error(errMsg);
        return throwError(() => errMsg);
    }
}
