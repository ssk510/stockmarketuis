import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MDBBootstrapModule } from 'angular-bootstrap-md';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';
import { NgxSpinnerModule } from "ngx-spinner";
import Amplify, { Auth } from 'aws-amplify';
import {
  ConfirmBoxConfigModule,
  NgxAwesomePopupModule,
  ToastNotificationConfigModule
} from '@costlydeveloper/ngx-awesome-popup';
import { SigninComponent } from './components/auth/signin/signin.component';
import { SignupComponent } from './components/auth/signup/signup.component';
import { HomeComponent } from './components/home/home.component';
import { UnAuthorizedComponent } from './components/un-authorized/un-authorized.component';
import { environment } from 'src/environments/environment';
import { AuthActivateGuardService } from './guards/auth-activate-guard.service';
import { ListCompaniesComponent } from './components/list-companies/list-companies.component';
import { CompanyService } from './services/company.service';
import { JwtInterceptor } from './interceptors/jwt.interceptor';
import { LoaderInterceptor } from './interceptors/loader-interceptor';

Amplify.configure({
  Auth: environment.awsCognitoSettings
});


@NgModule({
  declarations: [
    AppComponent,
    SigninComponent,
    SignupComponent,
    HomeComponent,
    UnAuthorizedComponent,
    ListCompaniesComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    NgxSpinnerModule,
    MDBBootstrapModule.forRoot(),
    NgxAwesomePopupModule.forRoot(),
    ToastNotificationConfigModule.forRoot({
      GlobalSettings: {
        AllowedNotificationsAtOnce: 5
      }
    }),
    ConfirmBoxConfigModule.forRoot()
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  providers: [AuthActivateGuardService, CompanyService,
    { provide: 'gatewayAPIRoot', useValue: environment.gatewayAPIRoot },
    { provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: LoaderInterceptor, multi: true }],
  bootstrap: [AppComponent]
})
export class AppModule { }
