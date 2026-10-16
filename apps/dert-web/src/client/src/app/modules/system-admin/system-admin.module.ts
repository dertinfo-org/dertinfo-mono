import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { FlexLayoutModule } from '@ngbracket/ngx-layout';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';

import { EmailTestComponent } from './components/email-test/email-test.component';
import { OverviewComponent } from './components/overview/overview.component';
import { EmailTestRepository } from './services/email-test.repository';
import { SystemAdminComponent } from './system-admin.component';
import { SystemAdminRoutes } from './system-admin.routing';

@NgModule({
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatListModule,
        FlexLayoutModule,
        SystemAdminRoutes
    ],
    declarations: [
        OverviewComponent,
        EmailTestComponent,
        SystemAdminComponent
    ],
    providers: [
        EmailTestRepository
    ]
})
export class SystemAdminModule { }
