import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { RepositoryBase } from 'app/core/base/repository.base';
import { AppInsightsService } from 'app/core/logging/appinsights.service';
import { ConfigurationService } from 'app/core/services/configuration.service';
import { GroupDto } from 'app/models/dto/GroupDto';
import { GroupMemberDto } from 'app/models/dto/GroupMemberDto';
import { GroupRegistrationSubmissionDto } from 'app/models/dto/GroupRegistrationSubmissionDto';
import { GroupTeamDto } from 'app/models/dto/GroupTeamDto';
import { Observable } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';

@Injectable()
export class GroupRegisterRepository extends RepositoryBase {

    constructor(http: HttpClient, configurationService: ConfigurationService, appInsightsService: AppInsightsService) {
        super(http, configurationService, appInsightsService);
    }

    get(groupId: number): Observable<GroupDto> {
        const url = this.ApiUri + '/group/' + groupId.toString();  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    members(groupId: number): Observable<GroupMemberDto[]> {
        const url = this.ApiUri + '/group/' + groupId.toString() + '/members';

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    teams(groupId: number): Observable<GroupTeamDto[]> {
        const url = this.ApiUri + '/group/' + groupId.toString() + '/teams';

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    addRegistration(groupId: number, groupRegistrationSubmission: GroupRegistrationSubmissionDto) {
        const url = this.ApiUri + '/group/' + groupId + '/registrations';  // URL to web API

        return this.http.post(url, groupRegistrationSubmission).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }
}
