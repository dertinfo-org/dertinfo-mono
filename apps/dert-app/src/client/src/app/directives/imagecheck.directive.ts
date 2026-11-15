import { Directive, Input } from '@angular/core';

@Directive({
    selector: '[dertimagecheck]',
    host: {
        '(error)': 'imageLoadError($event)',
        '[src]': 'src'
    },
    standalone: false
})
export class ImageCheckDirective {

    private _hasRun = false;
    private _defaultSize = 'original';
    private _defaultImage = 'assets/icon/broken.png';
    private _loadingImage = 'assets/icon/loading-avatar.gif';
    private _maintainScale = true;

    @Input() set defaultImage(defaultPath: string) {
        this._defaultImage = defaultPath || this._defaultImage;
    }

    @Input() set loadingImage(loadingPath: string) {
        this._loadingImage = loadingPath || this._loadingImage;
    }

    @Input() set maintainScale(maintainScale: boolean) {
        this._maintainScale = maintainScale || true;
    }

    @Input() src: string;
    @Input() dertimagecheck: string;

    constructor() {

        //console.log('ImageCheckDirective - constructor');
    }


    public imageLoadError(ev) {

        const requiredSize = this.dertimagecheck ? this.dertimagecheck : this._defaultSize;

        //console.log('ImageCheckDirective - imageLoadError - imageUrl:' + this.src);
        //console.log('ImageCheckDirective - imageLoadError - requiredSize:' + requiredSize);
        //console.log('ImageCheckDirective - imageLoadError - this._hasRun:' + this._hasRun);

        if (this.src && this.src.length > 0 && !this._hasRun) {
            // There was an error loading the image. This is likely doe to there not being the correct size available.

            // Ensure that we're trying to load the correct size image e.g http://storageaccount/container/480x360/filename.jpg
            if (this.src.indexOf('/' + requiredSize + '/') > 0) {

                // Set the sized image the one we're looking for
                let imgSrc = this.src;

                // Clear any query string parameters - this is a hangover from the previous implementation with ?firsttry
                const queryStringIndex = imgSrc.indexOf('?');
                if (queryStringIndex > -1) {
                    imgSrc = imgSrc.substr(0, queryStringIndex);
                }

                // Set the loading while waiting for the size to be constructed.
                this.src = this._loadingImage;

                setTimeout(() => {
                    this._hasRun = true;
                    this.src = imgSrc;
                    return; // prevent continution
                }, 5000);
            }
        } else {
            // When we hit the function for the second time due to the rezised image still not loading then show the error image.
            this._hasRun = true;
            this.src = this._defaultImage;
        }

    }
}
