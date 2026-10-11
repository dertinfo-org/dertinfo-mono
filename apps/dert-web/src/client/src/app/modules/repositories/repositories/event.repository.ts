
import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { catchError, map, share } from 'rxjs/operators';

import { RepositoryBase } from 'app/core/base/repository.base';
import { AppInsightsService } from 'app/core/logging/appinsights.service';
import {
    ActivityDetailDto,
    ActivityDto,
    ActivitySubmissionDto,
    ActivityUpdateDto,
    CompetitionSummaryDto,
    EmailTemplateDetailDto,
    EmailTemplateDto,
    EmailTemplateUpdateSubmissionDto,
    EventActivityDto,
    EventCompetitionDto,
    EventConfigurationSubmissionDto,
    EventDatesUpdateDto,
    EventDto,
    EventImageDto,
    EventMinimalSubmissionDto,
    EventOverviewDto,
    EventOverviewUpdateDto,
    EventRegistrationDto,
    EventSubmissionDto,
    InvoicePaidUpdateSubmissionDto
} from 'app/models/dto';
import { EventCancellationOptionsDto } from 'app/models/dto/EventCancellationOptionsDto';
import { ConfigurationService } from 'app/core/services/configuration.service';

@Injectable()
export class EventRepository extends RepositoryBase {

    constructor( http: HttpClient, configurationService: ConfigurationService, appInsightsService: AppInsightsService) {
        super(http, configurationService, appInsightsService);
    }

    list(): Observable<EventDto[]> {
        const url = this.ApiUri + '/event/web';  // URL to web API
        // this._environmentService.getApiBaseUrl()

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventDtosMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    listAvailable(): Observable<EventDto[]> {
        const url = this.ApiUri + '/event/available';  // URL to web API
        // this._environmentService.getApiBaseUrl()

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventDtosMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    listPromoted(): Observable<EventDto[]> {
        const url = this.ApiUri + '/event/promoted';  // URL to web API
        // this._environmentService.getApiBaseUrl()

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventDtosMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    createMinimal(eventSubmission: EventMinimalSubmissionDto) {
        const url = this.ApiUri + '/event/minimal';  // URL to web API

        return this.http.post(url, eventSubmission).pipe(
            share(),
            map((data) => this.eventDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    create(eventSubmission: EventSubmissionDto) {
        const url = this.ApiUri + '/event';  // URL to web API

        return this.http.post(url, eventSubmission).pipe(
            share(),
            map((data) => this.eventDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    /**
     * Returns the event information containing the contact details for the event management interface.
     * Protection at the Api to "Authenticated Users"
     */
    get(eventId: number): Observable<EventDto> {
        const url = this.ApiUri + '/event/' + eventId.toString();  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    /**
     * Returns the event information containing the contact details for the event management interface.
     * Protection at the Api to "Event Admin Only"
     */
    overview(eventId: number): Observable<EventOverviewDto> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/overview';  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventOverviewDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    images(eventId: number): Observable<EventImageDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/images';  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventImageDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    // Moved to Invoice Repository - 20181118
    // invoices(eventId: number): Observable<EventInvoiceDto[]> {
    //     const url = this.ApiUri + '/event/' + eventId.toString() + '/invoices';  // URL to web API

    //     return this.authHttp.get(url)
    //         .share()
    //         .map((data) => data)
    //         .catch((err) => this.processApiError(err));
    // }

    registrations(eventId: number): Observable<EventRegistrationDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/registrations';  // URL to web API

        return this.http.get(url).pipe(
            map((data) => this.eventRegistrationDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    teamActivities(eventId: number): Observable<EventActivityDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/team-activities';  // URL to web API

        return this.http.get(url).pipe(
            map((data) => this.eventActivityDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    individualActivities(eventId: number): Observable<EventActivityDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/individual-activities';  // URL to web API

        return this.http.get(url).pipe(
            map((data) => this.eventActivityDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    publishedTeamActivities(eventId: number): Observable<ActivityDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/published-team-activities';

        return this.http.get(url).pipe(
            map((data) => this.eventActivityDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    publishedIndividualActivities(eventId: number): Observable<ActivityDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/published-individual-activities';

        return this.http.get(url).pipe(
            map((data) => this.eventActivityDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    // note - will use detail as development continues
    activityDetail(eventId: number, activityId: number): Observable<ActivityDetailDto> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/activities/' + activityId.toString();  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => this.eventActivityDetailDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    emailTemplates(eventId: number): Observable<EmailTemplateDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/email-templates';  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    emailTemplateDetail(eventId: number, emailTemplateId: number): Observable<EmailTemplateDetailDto> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/email-template/' + emailTemplateId.toString();  // URL to web API

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    competitions(eventId: number): Observable<EventCompetitionDto[]> {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/competitions';

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    downloads(eventId: any): any {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/downloads';

        return this.http.get(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    deleteImage(eventImage: EventImageDto) {
        const url = this.ApiUri + '/event/' + eventImage.eventId.toString() + '/eventimage/' + eventImage.eventImageId;  // URL to web API

        return this.http.delete(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    addActivity(eventId: number, activitySubmission: ActivitySubmissionDto) {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/activity';  // URL to web API

        return this.http.post(url, activitySubmission).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    updateOverview(eventId: number, eventOverviewUpdate: EventOverviewUpdateDto) {
        const url = this.ApiUri + '/event/' + eventId;  // URL to web API

        return this.http.put(url, eventOverviewUpdate).pipe(
            share(),
            catchError((err) => this.processApiError(err)));
    }

    updateDates(eventId: number, eventDatesUpdate: EventDatesUpdateDto) {
        const url = this.ApiUri + '/event/' + eventId + '/dates';  // URL to web API

        return this.http.put(url, eventDatesUpdate).pipe(
            share(),
            catchError((err) => this.processApiError(err)));
    }

    updateEmailTemplate(eventId: number, emailTemplateUpdate: EmailTemplateUpdateSubmissionDto) {
        const url = this.ApiUri + '/event/' + eventId + '/email-template';  // URL to web API

        return this.http.put(url, emailTemplateUpdate).pipe(
            share(),
            catchError((err) => this.processApiError(err)));
    }

    // note - update calls pass the id of the items to update in the body of the submission.
    updateActivity(eventId: number, activityUpdate: ActivityUpdateDto) {
        const url = this.ApiUri + '/event/' + eventId + '/activities';  // URL to web API

        return this.http.put(url, activityUpdate).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    removeActivity(eventId: number, activity: ActivityDto) {
        const url = this.ApiUri + '/event/' + eventId + '/activities/' + activity.id;  // URL to web API

        return this.http.delete(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    applyConfiguration(eventId: number, eventConfigurationSubmissionDto: EventConfigurationSubmissionDto) {
        const url = this.ApiUri + '/event/' + eventId + '/configure';  // URL to web API

        return this.http.post(url, eventConfigurationSubmissionDto).pipe(
            share(),
            map((data) => this.eventDtoMap(data)),
            catchError((err) => this.processApiError(err)));
    }

    deleteEvent(eventId: number) {
        const url = this.ApiUri + '/event/' + eventId;  // URL to web API

        return this.http.delete(url).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    cancelEvent(eventId: number, options: EventCancellationOptionsDto) {
        const url = this.ApiUri + '/event/' + eventId + '/cancel';  // URL to web API

        return this.http.put(url, options).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    closeEvent(eventId: number) {

        const url = this.ApiUri + '/event/' + eventId + '/close';  // URL to web API

        return this.http.put(url, null).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    setPrimaryImage(eventImage: EventImageDto) {
        const url = `${this.ApiUri}/event/${eventImage.eventId.toString()}/eventimage/${eventImage.eventImageId}/setprimary`;

        return this.http.put(url, null).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    updateInvoicePaid(eventId: number, invoicePaidUpdateSubmissionDto: InvoicePaidUpdateSubmissionDto) {
        const url = this.ApiUri + '/event/' + eventId.toString() + '/invoice/paid';  // URL to web API

        return this.http.put(url, invoicePaidUpdateSubmissionDto).pipe(
            share(),
            map((data) => data),
            catchError((err) => this.processApiError(err)));
    }

    private eventDtosMap(data: any) {
        const eventDtos: EventDto[] = data;

        return eventDtos;
    }

    private eventDtoMap(data: any) {
        const eventDto: EventDto = data;

        return eventDto;
    }

    private eventOverviewDtoMap(data: any) {
        const eventOverviewDto: EventOverviewDto = data;

        // Manipulate the image paths to gain the correct sizes - this should be done using a pipe.

        return eventOverviewDto;
    }

    private eventImageDtoMap(data: any) {
        const eventImageDtos: EventImageDto[] = data;

        return eventImageDtos;
    }

    private eventRegistrationDtoMap(data: any) {
        const eventRegistrationDtos: EventRegistrationDto[] = data;

        return eventRegistrationDtos;
    }

    private eventActivityDtoMap(data: any) {
        const eventRegistrationDtos: ActivityDto[] = data;

        return eventRegistrationDtos;
    }

    private eventActivityDetailDtoMap(data: any) {
        const activityDetailDto: ActivityDetailDto[] = data;

        return activityDetailDto;
    }

}
