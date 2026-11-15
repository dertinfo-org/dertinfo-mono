// Angular
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { ILogger } from '../providers/diagnostics/logger';

// Application
import { ConfigurationService } from './configuration.service';

// Models
import {
    DanceDetailDto,
    DanceImageSubmissionDto,
    DanceMarkingSheetDto,
    DanceResultsSubmissionDto
} from '../models/dto';


@Injectable()
export class DanceService {

    constructor(private _logger: ILogger, private authHttp: HttpClient, private _configurationService: ConfigurationService) {
        this._logger.trace('DanceService - constructor ', ['DanceService']);
    }

    getDance(danceId: number): Observable<DanceDetailDto> {
        this._logger.trace('DanceService - getDance ', ['DanceService']);

        const url = this._configurationService.baseApiUrl + '/dance/' + danceId;  // URL to web API

        return this.authHttp.get(url) as Observable<DanceDetailDto>;
    }

    getDancesByVenueId(venueId: number) {
        this._logger.trace('DanceService - getDancesByVenueId ', ['DanceService']);

        const url = this._configurationService.baseApiUrl + '/venue/' + venueId + '/dances';  // URL to web API
        return this.authHttp.get(url);
    }

    submitScores(danceResultsSubmissionDto: DanceResultsSubmissionDto): Observable<DanceDetailDto> {
        this._logger.trace('DanceService - submitScores ', ['DanceService']);

        const url = this._configurationService.baseApiUrl + '/dance';

        return this.authHttp.post(url, danceResultsSubmissionDto) as Observable<DanceDetailDto>;
    }

    uploadPhoto(danceImageSubmissionDto: DanceImageSubmissionDto): Observable<DanceMarkingSheetDto> {
        this._logger.trace('DanceService - uploadPhoto ', ['DanceService']);

        const url = this._configurationService.baseApiUrl + '/dance/' + danceImageSubmissionDto.danceId + '/markingsheet';

        return this.authHttp.post(url, danceImageSubmissionDto) as Observable<DanceMarkingSheetDto>;
    }

    deletePhoto(danceId: number, markingSheetId: number): Observable<DanceMarkingSheetDto> {
        this._logger.trace('DanceService - deletePhoto ', ['DanceService']);

        const url = this._configurationService.baseApiUrl + '/dance/' + danceId + '/markingsheet/' + markingSheetId;

        return this.authHttp.delete(url)  as Observable<DanceMarkingSheetDto>;
    }

    private handleError(error: Response | any) {
        this._logger.trace('DanceService - handleError ', ['DanceService']);
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
