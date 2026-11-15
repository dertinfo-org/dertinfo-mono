import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { DancesRoutingModule } from './dances-routing.module';

import { DanceListPage } from './dance-list.page';
import { DanceDetailPage } from './dance-detail.page';
import { AppSharedModule } from '../../shared/shared.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DirectivesModule } from 'src/app/directives/directives.module';
import { SwiperModule } from 'swiper/angular';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DancesRoutingModule,
    AppSharedModule,
    PipesModule,
    DirectivesModule,
    SwiperModule
  ],
  declarations: [
      DanceListPage,
      DanceDetailPage
  ]
})
export class DancePagesModule {}
