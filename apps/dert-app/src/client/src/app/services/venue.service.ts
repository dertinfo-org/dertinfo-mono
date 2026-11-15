// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ILogger } from '../providers/diagnostics/logger';
import { Observable, throwError } from 'rxjs';

// Application
import { ConfigurationService } from './configuration.service';

@Injectable()
export class VenueService {

    constructor(private _logger: ILogger, private _authHttp: HttpClient, private _configurationService: ConfigurationService) {
        this._logger.trace('VenueService - constructor ', ['VenueService']);
    }

    getVenues(eventId) {
        this._logger.trace('VenueService - getVenues: EventId', ['VenueService'], eventId);

        const url = this._configurationService.baseApiUrl + '/event/' + eventId + '/venues';
        return this._authHttp.get(url);
    }

    private handleError(error: Response | any) {
        this._logger.trace('VenueService - handleError ', ['VenueService']);
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
