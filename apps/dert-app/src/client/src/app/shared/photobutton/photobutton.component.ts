import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { ILogger } from '../../providers/diagnostics/logger';
import { Camera, CameraResultType } from '@capacitor/camera';
import { ConfigurationService } from 'src/app/services/configuration.service';

@Component({
    selector: 'photo-button',
    templateUrl: 'photobutton.component.html',
    standalone: false
})
export class PhotoButton implements OnInit {

    myRawImage = '';

    @Output() onPhotoTaken = new EventEmitter<any>();

    constructor(
        private _logger: ILogger,
    ) {

    }

    ngOnInit() {
        this._logger.trace('PhotoButton - ngOnInit ', ['PhotoButton']);
    }


    takePhoto() {
        this._logger.trace('PhotoButton - takePhoto ', ['PhotoButton']);
        this.takePicture();
    }

    private async takePicture() {
        this._logger.trace('PhotoButton - takePicture ', ['PhotoButton']);

        const image = await Camera.getPhoto({
            quality: 90,
            allowEditing: true,
            resultType: CameraResultType.Base64
        });

        this.onPhotoTaken.emit(image.base64String);
    }
}
