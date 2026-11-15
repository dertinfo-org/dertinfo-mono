import { Component, Input, ChangeDetectionStrategy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ILogger } from 'src/app/providers/diagnostics/logger';
import { SwiperOptions } from 'swiper';
import SwiperCore, {Zoom} from 'swiper';
SwiperCore.use([Zoom]);



@Component({
    selector: 'photo-modal',
    templateUrl: 'photomodal.component.html',
    styleUrls: ['photomodal.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PhotoModal {

    private swiperInstance: any;
    public swiperConfig: SwiperOptions = {
      zoom: true
    };

    @Input('img')img: any;


    sliderOpts = {
      zoom: true
    };

    constructor(
        private _logger: ILogger,
        private modalController: ModalController
    ) { }

    ngOnInit() {
        this._logger.trace('PhotoModal - constructor ', ['PhotoModal']);
        this._logger.trace('PhotoModal - constructor - img', ['PhotoModal'], this.img);
    }

    public setSwiperInstance(swiper: any) {
      this._logger.trace('PhotoModal - setSwiperInstance ', ['PhotoModal']);

      this.swiperInstance = swiper;
    }

    ionViewDidEnter(){
      this.swiperInstance.update();
    }

    async zoom(zoomIn: boolean) {
      const zoom = this.swiperInstance.zoom;
      zoomIn ? zoom.in() : zoom.out();
    }

    close() {
      this.modalController.dismiss();
    }
}
