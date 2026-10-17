// Third Party
import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Modules
import { MaterialLayoutsModule } from 'app/material-bundles/material-layouts.module';
import { NotificationModule } from 'app/modules/notification/notification.module'; // not if independent module
import { FlowBreadcrumbModule } from './components/flow-breadcrumb/flow-breadcrumb.module'; // to fix
import { JudgesSelectModule } from './components/judges-select/judges-select.module'; // to fix
import { MembersSelectModule } from './components/members-select/members-select.module'; // to fix
import { TeamsSelectModule } from './components/teams-select/teams-select.module'; // to fix

// Components
import { AdditionHeaderComponent } from './components/addition-header/addition-header.component';
import { AvatarHeaderComponent } from './components/avatar-header/avatar-header.component';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';
import { CookieConsentComponent } from './components/cookie-consent/cookie-consent.component';
import { CustomizerComponent } from './components/customizer/customizer.component';
import { DodMessageBannerComponent } from './components/dod-message-banner/dod-message-banner.component';
import { DodNavigationCardComponent } from './components/dod-navigation-card/dod-navigation-card.component';
import { FabMenuComponent } from './components/fabmenu/fabmenu.component';
import { FacebookEmbedComponent } from './components/facebook-embed/facebook-embed.component';
import { FoldComponent } from './components/fold/fold.component';
import { ImageRetryComponent } from './components/image-retry/image-retry.component';
// todo - Judges Select As Component
// todo - Members Select As Component
import { MessageBannerComponent } from './components/message-banner/message-banner.component';
import { NavigationComponent } from './components/navigation/navigation.component';
import { ScoreBoxComponent } from './components/scorebox/scorebox.component';
import { ScoreCardComponent } from './components/scorecard/scorecard.component';
import { SpinnerComponent } from './components/spinner/spinner.component';
import { SwitchHeaderComponent } from './components/switch-header/switch-header.component';
// todo - Teams Select As Component
import { SessionAccountMenuComponent } from './components/session-account-menu/session-account-menu.component';
import { TopbarComponent } from './components/topbar/topbar.component';
import { YouTubeEmbedComponent } from './components/youtube-embed/youtube-embed.component';

// Directives
import { AppAccordionDirective } from './directives/app-accordion.directive';
import { PriceDirective } from './directives/di-price-view.directive';
import { EqualValidatorDirective } from './directives/equal-validator.directive';
import { FontSizeDirective } from './directives/font-size.directive';
import { MaintainOriginalDirective } from './directives/maintain-original.directive';
import { RangeValidatorDirective } from './directives/range-validator.directive';
import { ScrollToDirective } from './directives/scroll-to.directive';
import { SideNavAccordionDirective } from './directives/sidenav-accordion.directive';

// Pipes
import { RouterModule } from '@angular/router';
import { DateFormatPipe } from './pipes/date-format.pipe';
import { DateTimeFormatPipe } from './pipes/datetime-format.pipe';
import { DayFormatPipe } from './pipes/day-format.pipe';
import { ExcerptPipe } from './pipes/excerpt.pipe';
import { GravitarPipe } from './pipes/gravitar.pipe';
import { ImageDimensionPipe } from './pipes/image-dimension.pipe';
import { RelativeTimePipe } from './pipes/relative-time.pipe';
import { TimeFormatPipe } from './pipes/time-format.pipe';

// Validators
// check - do we need to do anything here to keep this tidy?

@NgModule({
  imports: [
    RouterModule,
    CommonModule,
    FormsModule,
    FlexLayoutModule,
    MaterialLayoutsModule,
    FlowBreadcrumbModule,
    JudgesSelectModule,
    MembersSelectModule,
    TeamsSelectModule,
    TranslateModule,
    NotificationModule,
  ],
  declarations: [
    AdditionHeaderComponent,
    AvatarHeaderComponent,
    BreadcrumbComponent,
    CookieConsentComponent,
    CustomizerComponent, // todo - can go
    DodMessageBannerComponent,
    DodNavigationCardComponent,
    FabMenuComponent,
    FacebookEmbedComponent,
    FoldComponent,
    ImageRetryComponent,
    MessageBannerComponent,
    NavigationComponent,
    ScoreBoxComponent,
    ScoreCardComponent,
    SpinnerComponent,
    SwitchHeaderComponent,
    SessionAccountMenuComponent,
    TopbarComponent,
    YouTubeEmbedComponent,
    AppAccordionDirective,
    PriceDirective,
    EqualValidatorDirective,
    FontSizeDirective,
    MaintainOriginalDirective,
    RangeValidatorDirective,
    ScrollToDirective,
    SideNavAccordionDirective,
    DateFormatPipe,
    DateTimeFormatPipe,
    DayFormatPipe,
    RelativeTimePipe,
    ExcerptPipe,
    ImageDimensionPipe,
    GravitarPipe,
    TimeFormatPipe
  ],
  exports: [
    FlowBreadcrumbModule,
    AdditionHeaderComponent,
    AvatarHeaderComponent,
    BreadcrumbComponent,
    CookieConsentComponent,
    CustomizerComponent, // todo - can go
    DodMessageBannerComponent,
    DodNavigationCardComponent,
    FabMenuComponent,
    FacebookEmbedComponent,
    FoldComponent,
    ImageRetryComponent,
    MessageBannerComponent,
    NavigationComponent,
    ScoreBoxComponent,
    ScoreCardComponent,
    SpinnerComponent,
    SwitchHeaderComponent,
    SessionAccountMenuComponent,
    TopbarComponent,
    YouTubeEmbedComponent,
    AppAccordionDirective,
    PriceDirective,
    EqualValidatorDirective,
    FontSizeDirective,
    MaintainOriginalDirective,
    RangeValidatorDirective,
    ScrollToDirective,
    SideNavAccordionDirective,
    DateFormatPipe,
    DateTimeFormatPipe,
    DayFormatPipe,
    RelativeTimePipe,
    ExcerptPipe,
    ImageDimensionPipe,
    GravitarPipe,
    TimeFormatPipe
  ],
  providers: []
})
export class AppSharedModule { }
