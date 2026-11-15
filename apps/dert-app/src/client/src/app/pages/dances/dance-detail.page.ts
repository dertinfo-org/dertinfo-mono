import { Component, OnDestroy, OnInit, ViewChild, ChangeDetectionStrategy } from '@angular/core';
import { UntypedFormControl, UntypedFormGroup, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { Subscription } from 'rxjs';
import { ILogger } from '../../providers/diagnostics/logger';

// forms
import { RangeValidator } from '../../directives/range-validator.directive';

// Stores & Services
import { DanceStore } from '../../stores/dance.store';
import { DanceService } from '../../services/dance.service';

// Models
import {
    DanceDetailDto,
    DanceImageSubmissionDto,
    DanceMarkingSheetDto,
    DanceResultsSubmissionDto,
    DanceScoreDto
} from '../../models/dto/index';
import { EventStore } from '../../stores/event.store';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from 'src/app/authentication/auth.service';

@Component({
    selector: 'page-dance-detail',
    templateUrl: 'dance-detail.page.html',
    styleUrls: ['dance-detail.page.scss'],
    providers: [DanceService],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class DanceDetailPage implements OnInit, OnDestroy {

    //Replace with swiper: @ViewChild('scoreEntrySlider') scoreEntrySlider: any;

    private swiperInstance: any;

    private _loadTimeoutHook;
    private _loadTimeoutDuration = 10000;
    private _isLoading = true;
    private _isError = false;
    private _primaryDanceSubscription: Subscription;

    public myDance: DanceDetailDto;
    public danceId: number;
    public headerImageSize = '100x100';
    public danceScores: DanceScoreDto[];
    public danceMarkingSheets: DanceMarkingSheetDto[];
    public scoresLocked = false;
    public currentSlide = 'scores';
    public danceScoresFormGroup: UntypedFormGroup = new UntypedFormGroup({});
    public errorMessage: any;
    public overrun = false;

    public showLockedByCheckedMessage = false;
    public showNotPublishedMessage = false;
    public showScoresNotInMessage = false;

    // #####################################################################
    // # LIFECYCLE
    // #####################################################################

    constructor(
        private _logger: ILogger,
        private _danceStore: DanceStore,
        private _eventStore: EventStore,
        private toastCtrl: ToastController,
        private activatedRoute: ActivatedRoute,
        private _authService: AuthService
    ) {
        this._logger.trace('DanceDetailPage - constructor ', ['DanceDetailPage']);
        this.danceId = parseInt(this.activatedRoute.snapshot.params.id,10);
    }

    ngOnInit(): void {
        this._logger.trace('DanceDetailPage - ngOnInit ', ['DanceDetailPage']);

        this._isLoading = true;

        this.subscribe();
        this.getDance(this.danceId);

        this._loadTimeoutHook = setTimeout(() => {
            if (this._isLoading) {
                this._isLoading = false;
                this._isError = true;
            }
        }, this._loadTimeoutDuration);
    }

    ngOnDestroy(): void {
        this._logger.trace('DanceDetailPage - ngOnDestroy ', ['DanceDetailPage']);
        this.unsubscribe();
    }

    // #####################################################################
    // # SUBSCRIPTIONS
    // #####################################################################

    private subscribe() {
        this._logger.trace('DanceDetailPage - subscribe ', ['DanceDetailPage']);

        /* Application Authentication Change */
        this._primaryDanceSubscription = this._danceStore.primaryDance$.subscribe(
            (data) => this.primaryDanceChangedNext(data),
            (err) => this.primaryDanceChangedError(err),
            () => this.primaryDanceChangedComplete()
        );
    }

    private primaryDanceChangedNext(dance: DanceDetailDto) {
        this._logger.trace('DanceDetailPage - primaryDanceChangedNext ', ['DanceDetailPage'], dance);

        if (dance) {
            this.myDance = dance;
            this.danceScores = dance.danceScores;
            this.danceMarkingSheets = dance.danceMarkingSheets;
            this.danceScoresFormGroup = this.toFormControlGroup();
            this.overrun = dance.overrun;

            this.setlockedStatus(dance);

            this._isLoading = false;
        } else {
            this.myDance = null;
            this.danceScores = null;
            this.danceMarkingSheets = null;
            this.scoresLocked = null;
            this.danceScoresFormGroup = null;
            this.overrun = false;

            this._isLoading = false;
        }
    }

    private primaryDanceChangedError(err: any) {
        this._logger.trace('DanceDetailPage - primaryDanceChangedError ', ['DanceDetailPage']);

        if (this._primaryDanceSubscription) {
            this._primaryDanceSubscription.unsubscribe();
        }
    }

    private primaryDanceChangedComplete() {
        this._logger.trace('DanceDetailPage - primaryDanceChangedComplete ', ['DanceDetailPage']);

        if (this._primaryDanceSubscription) {
            this._primaryDanceSubscription.unsubscribe();
        }
    }

    unsubscribe() {
        this._logger.trace('DanceDetailPage - unsubscribe ', ['DanceDetailPage']);

        if (this._primaryDanceSubscription) {
            this._primaryDanceSubscription.unsubscribe();
        }
    }

    // #####################################################################
    // # PRIVATE
    // #####################################################################

    private getDance(danceId: number) {
        this._logger.trace('DanceDetailPage - getDance ', ['DanceDetailPage']);
        this._danceStore.loadDanceDetail(danceId);
    }

    private uploadSucceeded(danceMarkingSheetDto: DanceMarkingSheetDto) {
        this._logger.trace('DanceDetailPage - uploadSucceeded ', ['DanceDetailPage']);

        // On photo successfully uploaded replace the image with the Byte[] and 0 marking sheet Id with saved at the server.
        const filteredSheets = this.danceMarkingSheets.filter((item) => { return item.markingSheetId > 0; });
        filteredSheets.push(danceMarkingSheetDto);
        this.danceMarkingSheets = filteredSheets;

        this.showToast('Photo uploaded');
    }

    private uploadFailed(error: any) {
        this._logger.trace('DanceDetailPage - uploadFailed ', ['DanceDetailPage'], error);

        this.showToast('Photo upload failed');
    }

    private async showToast(message: string) {
        this._logger.trace('DanceDetailPage - showToast ', ['DanceDetailPage']);

        const toast = await this.toastCtrl.create({
            message: message,
            duration: 2000,
            position: 'bottom'
          });
          toast.present();

    }

    // #####################################################################
    // # PUBLIC
    // #####################################################################

    public setSwiperInstance(swiper: any) {
        this._logger.trace('DanceDetailPage - setSwiperInstance ', ['DanceDetailPage']);

        this.swiperInstance = swiper;
      }


    public scoreSegmentChanged() {
        this._logger.trace('DanceDetailPage - scoreSegmentChanged ', ['DanceDetailPage']);
        this._logger.trace('DanceDetailPage - scoreSegmentChanged - this.currentSlide ', ['DanceDetailPage'], this.currentSlide);

        switch(this.currentSlide)
        {
            case "scores":
                this._logger.trace('DanceDetailPage - scoreSegmentChanged  - Scores ', ['DanceDetailPage']);
                this.swiperInstance.slideTo(0)
                break;
            case "camera":
                this._logger.trace('DanceDetailPage - scoreSegmentChanged  - Camera', ['DanceDetailPage']);
                this.swiperInstance.slideTo(1)
                break;
            default:
                throw new Error('DanceDetailPage - scoreSegmentChanged - should always specify slide');
        }

    }

    public onSlideChanged() {
        this._logger.trace('DanceDetailPage - onSlideChanged ', ['DanceDetailPage']);
        //Replace with swiper: const activeIndex = this.scoreEntrySlider.getActiveIndex();
        const activeIndex = this.swiperInstance.activeIndex;

        if (activeIndex === 0) { this.currentSlide = 'scores'; }
        if (activeIndex === 1) { this.currentSlide = 'camera'; }
    }

    public onOverrunIonChange() {
        //console.log('danceid:' + this.danceId);
        this.overrun = !this.overrun;
        for (const control in this.danceScoresFormGroup.controls) {
            if (this.overrun) {
                if (this.danceScoresFormGroup.controls[control]) {
                    this.danceScoresFormGroup.controls[control].setValue(this.danceScoresFormGroup.controls[control].value * 0.9);
                }
            } else {
                if (this.danceScoresFormGroup.controls[control]) {
                    this.danceScoresFormGroup.controls[control].setValue(this.danceScoresFormGroup.controls[control].value / 0.9);
                }

            }
        }

        //console.log('Overrun Button Clicked');
        //console.log(this.overrun);

    }


    public submitScoresForm(value: any) {
        this._logger.trace('DanceDetailPage - submitScoresForm ', ['DanceDetailPage']);

        const danceResultsSubmission: DanceResultsSubmissionDto = {
            danceId: this.danceId,
            danceScores: [],
            overrun: this.overrun
        };

        this.danceScores.forEach((danceScore) => {
            danceResultsSubmission.danceScores.push(
                {
                    danceId: this.danceId,
                    scoreCategoryId: danceScore.scoreCatagoryId,
                    marksGiven: value[danceScore.scoreCatagoryId]
                }
            );
        });

        this._danceStore.submitScores(danceResultsSubmission).subscribe(
            (danceDetailDto: DanceDetailDto) => {
                this.showToast('Scores submitted and recieved');

                // Ionic 7 does not emit ionChange when the segment value is set in code.
                // Setting currentSlide selects the Photos tab. scoreSegmentChanged moves the swiper.
                this.currentSlide = "camera";
                this.scoreSegmentChanged();
            }
        );

    }

    public handlePhotoTaken(base64ImageString: string) {
        this._logger.trace('DanceDetailPage - handlePhotoTaken ', ['DanceDetailPage']);

        const danceImageSubmission: DanceImageSubmissionDto = {
            danceId: this.danceId,
            base64StringImage: base64ImageString
        };

        this._danceStore.uploadDancePhoto(danceImageSubmission).subscribe(
            (danceMarkingSheetDto) => this.uploadSucceeded(danceMarkingSheetDto),
            (error) => this.uploadFailed(error)
        );
    }



    public handlePhotoDeleted(markingSheetId: number) {
        this._logger.trace('DanceDetailPage - handlePhotoDeleted ', ['DanceDetailPage']);

        this._danceStore.removeDancePhoto(this.danceId, markingSheetId).subscribe((danceMarkingSheetDto) => {

            //console.log('DanceDetailPage - handlePhotoDeleted - Notified of removeDancePhoto - changed');

            const filteredSheets = this.danceMarkingSheets.filter((item) => { return item.markingSheetId !== danceMarkingSheetDto.markingSheetId; });
            this.danceMarkingSheets = filteredSheets;

        });
    }

    /**
     * toFormControlGroup
     * Takes the scores against the current dance object and creates a form group for these items with validation.
     */
    toFormControlGroup() {
        this._logger.trace('DanceDetailPage - toFormControlGroup ', ['DanceDetailPage']);

        const sortFunction = (a: DanceScoreDto, b: DanceScoreDto) => { return a.scoreCategorySortOrder - b.scoreCategorySortOrder; };

        const group: any = {};
        this.danceScores.sort(sortFunction).forEach((danceScore) => {

            const rangeValidator = new RangeValidator();
            rangeValidator.initValidationFunction(0, danceScore.scoreCatagoryMaxMarks);
            // Add to the group always with required validation

            const validators = this.scoresLocked ? null : [Validators.required, rangeValidator.validatorFunction];
            //WAS: group[danceScore.scoreCatagoryId] = new FormControl(danceScore.markGiven, validators);
            group[danceScore.scoreCatagoryId] = new UntypedFormControl({value: danceScore.markGiven, disabled: this.scoresLocked}, validators);

        });
        // group['overrun'] = new FormControl(this.overrun);
        return new UntypedFormGroup(group); // return the group.
    }


    private setlockedStatus(dance: DanceDetailDto) {

        this.showLockedByCheckedMessage = false;
        this.showNotPublishedMessage = false;
        this.showScoresNotInMessage = false;

        this.scoresLocked = dance.hasScoresChecked;

        const userData = this._authService.userData()

        if (userData.venueAdmin && userData.venueAdmin.indexOf(this.myDance.venueId) > -1) {
            // This user is admin for this venue
            this.scoresLocked = dance.hasScoresChecked;
            this.showLockedByCheckedMessage = dance.hasScoresChecked;
        } else if (userData.eventAdmin && userData.eventAdmin.indexOf(this._eventStore.currentEventId) > -1) {
            // This user is admin for event
            this.scoresLocked = dance.hasScoresChecked;
            this.showLockedByCheckedMessage = dance.hasScoresChecked;
        } else {
            this.scoresLocked = true;
            const noScoresShown = this.scoresHaveZeroValue(dance);

            if (dance.hasScoresEntered) {
                this.showNotPublishedMessage = noScoresShown ? true : false;
            } else {
                this.showScoresNotInMessage = true;
            }

            // This person is a group member
        }

        // this.scoresHidden = dance.hasScoresEntered && user

    }

    private scoresHaveZeroValue(dance: DanceDetailDto): boolean {

        let zeroValue = true;
        dance.danceScores.forEach((ds) => {
            zeroValue = ds.markGiven > 0 ? false : zeroValue;
        });

        return zeroValue;
    }


}
