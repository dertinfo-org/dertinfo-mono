import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { VenuePageRoutingModule } from './venue-routing.module';

import { VenuePage } from './venue.page';
import { AppSharedModule } from '../../shared/shared.module';
import { PipesModule } from 'src/app/pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    VenuePageRoutingModule,
    AppSharedModule,
    PipesModule
  ],
  declarations: [VenuePage]
})
export class VenuePageModule {}
