import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular/lazy';

import { AuthRoutingModule } from './auth-routing.module';

import { SignInPage } from './sign-in.page';
import { SignOutPage } from './sign-out.page';
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
    AuthRoutingModule,
    AppSharedModule,
    PipesModule,
    DirectivesModule,
    SwiperModule
  ],
  declarations: [
      SignInPage,
      SignOutPage
  ]
})
export class AuthPagesModule {}
