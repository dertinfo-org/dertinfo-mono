import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppHeaderComponent } from './header/header.component'
import { IonicModule } from '@ionic/angular/lazy';
import { LoaderComponent } from './loader/loader.component';
import { PhotoWidget } from './photowidget/photowidget.component';
import { PhotoReel } from './photoreel/photoreel.component';
import { PhotoButton } from './photobutton/photobutton.component';
import { FormsModule } from '@angular/forms';
import { PipesModule } from '../pipes/pipes.module';
import { DirectivesModule } from '../directives/directives.module';
import { PhotoModal } from './photomodal/photomodal.component';
import { SwiperModule } from 'swiper/angular';
import { NotificationBoxComponent } from './notification-box/notification-box.component';

@NgModule({
  imports: [
    CommonModule,
    IonicModule,
    FormsModule,
    PipesModule,
    DirectivesModule,
    SwiperModule
  ],
  declarations: [
    AppHeaderComponent,
    LoaderComponent,
    PhotoWidget,
    PhotoReel,
    PhotoButton,
    PhotoModal,
    NotificationBoxComponent
  ],
  exports: [
    AppHeaderComponent,
    LoaderComponent,
    PhotoWidget,
    PhotoReel,
    PhotoButton,
    PhotoModal,
    NotificationBoxComponent
  ],
  providers: []
})
export class AppSharedModule {}
