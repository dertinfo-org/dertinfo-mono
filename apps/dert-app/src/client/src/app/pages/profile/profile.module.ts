import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { ProfilePageRoutingModule } from './profile-routing.module';

import { ProfilePage } from './profile.page';
import { AppSharedModule } from '../../shared/shared.module';
import { PipesModule } from 'src/app/pipes/pipes.module';
import { DirectivesModule } from 'src/app/directives/directives.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ProfilePageRoutingModule,
    AppSharedModule,
    PipesModule,
    DirectivesModule
  ],
  declarations: [ProfilePage]
})
export class ProfilePageModule {}
