import { Component, EventEmitter, Input, OnInit, Output, ChangeDetectionStrategy } from '@angular/core';
import { Observable } from 'rxjs';

import { DanceMarkingSheetDto } from '../../models/dto/DanceMarkingSheetDto';
import { ModalController } from '@ionic/angular';
import { PhotoModal } from '../photomodal/photomodal.component';
import { ILogger } from 'src/app/providers/diagnostics/logger';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
    selector: 'photo-widget',
    templateUrl: 'photowidget.component.html',
    styleUrls: ['photowidget.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PhotoWidget implements OnInit {

    public scoresheetImageSize = '480x360';

    private _enableCordovaFeatures = false;

    myId: number;
    myPhoto = '';
    myRawImage = '';
    myMarkingSheetId: number;

    @Output() onPhotoDeleted = new EventEmitter<any>();
    @Input() markingSheet: DanceMarkingSheetDto;
    @Input() isLocked = true;

    isLoadingObs: Observable<boolean>;

    constructor(
        private _logger: ILogger,
        private _modalController: ModalController
    ) { }

    ngOnInit() {
        //console.log('PhotoWidget - ngOnInit');

        if (this.markingSheet) {
            //console.log('PhotoWidget - ngOnInit - markingSheet.imageResourceUri: ' + this.markingSheet.imageResourceUri);
            this.myId = this.markingSheet.markingSheetId;
            this.myPhoto = this.markingSheet.imageResourceUri;
            this.myMarkingSheetId = this.markingSheet.markingSheetId;
            this.isLoadingObs = new Observable<boolean>(observer => observer.next(this.myMarkingSheetId === 0));
        }
    }

    deletePhoto() {

        //console.log('PhotoWidget - deletePhoto');

        /* if the photo is loaded by url then the id should be provided
            - delete is only available when the photo has been saved
            - this is identified by a marking sheet image id
        */
        this.onPhotoDeleted.emit(
            this.myId
        );
    }

    async openPreview(imgUri: string) {
        this._logger.trace('PhotoWidget - openPreview ', ['PhotoWidget']);

        const modal = await this._modalController.create({
            component: PhotoModal,
            cssClass: 'transparent-modal',
            componentProps: {
                img: imgUri
            }
        });
        modal.present();
    }
}
