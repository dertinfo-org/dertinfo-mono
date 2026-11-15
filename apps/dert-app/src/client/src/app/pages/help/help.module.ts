import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { HelpPageRoutingModule } from './help-routing.module';

import { HelpPage } from './help.page';
import { AppSharedModule } from '../../shared/shared.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    HelpPageRoutingModule,
    AppSharedModule
  ],
  declarations: [HelpPage]
})
export class HelpPageModule {}
