// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ILogger } from '../providers/diagnostics/logger';
import { Observable, throwError } from 'rxjs';

// Application
import { EventDto } from '../models/dto';
import { ConfigurationService } from './configuration.service';

@Injectable()
export class EventService {

    constructor(private _logger: ILogger, private _authHttp: HttpClient, private _configurationService: ConfigurationService) {
        this._logger.trace('EventService - constructor ', ['EventService']);
    }

    getEvents(): Observable<EventDto[]> {
        this._logger.trace('EventService - getEvents ', ['EventService']);

        const url = this._configurationService.baseApiUrl + '/event';
        return this._authHttp.get(url) as Observable<EventDto[]>;
    }

    private handleError(error: Response | any) {
        this._logger.trace('EventService - handleError ', ['EventService']);
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
