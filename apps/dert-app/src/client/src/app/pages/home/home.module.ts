import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { HomePageRoutingModule } from './home-routing.module';

import { HomePage } from './home.page';
import { AppSharedModule } from '../../shared/shared.module';
import { ImageSizePipe } from 'src/app/pipes/imagesize.pipe';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HomePageRoutingModule,
    AppSharedModule,
    PipesModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
