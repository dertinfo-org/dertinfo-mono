import { Component, EventEmitter, Input, Output } from '@angular/core';
import { DanceMarkingSheetDto } from '../../models/dto/DanceMarkingSheetDto';

@Component({
    selector: 'photo-reel',
    templateUrl: 'photoreel.component.html',
    styleUrls: ['photoreel.component.scss'],
    standalone: false
})
export class PhotoReel {

    @Output() onPhotoTaken = new EventEmitter();
    @Output() onPhotoDeleted = new EventEmitter();
    @Input() markingSheets: DanceMarkingSheetDto[];
    @Input() isLocked: Boolean;



    photoTaken(base64Image: string) {

        //console.log('PhotoReel - photoTaken Data: ' + base64Image);

        const markingSheet: DanceMarkingSheetDto = {
            markingSheetId: 0,
            danceId: 0,
            imageResourceUri: 'data:image/jpeg;base64,' + base64Image
        };
        this.markingSheets.push(markingSheet);

        // Append the addition
        /*
        let photoWidget = new PhotoWidget(this._zone);
        this.photoWidgets.push(photoWidget);
*/
        this.onPhotoTaken.emit(base64Image);

    }

    photoDeleted(markingSheetId: number) {
        //console.log('PhotoReel - photoDeleted - markingSheetId: ' + markingSheetId);
        this.onPhotoDeleted.emit(markingSheetId);
    }
}
