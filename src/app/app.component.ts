import { Component, OnInit, ViewChild } from '@angular/core';
import { NavigationStart, Router, RouterEvent } from '@angular/router';
import { ModalDirective } from 'angular-bootstrap-md';
import { Auth } from 'aws-amplify';
import { from, interval } from 'rxjs';
import { AuthService } from './services/auth.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  public loggerUser: any = null;
  public isUserLoggedIn: boolean = false;
  public expireSeconds: number = 120000 / 1000;
  @ViewChild('sessionExpiryModal', { static: false, read: ModalDirective }) sessionExpiryModal: ModalDirective;

  constructor(private authService: AuthService,
    private router: Router) {

    this.router.events
      .subscribe(
        (event: RouterEvent) => {
          if (event instanceof NavigationStart) {
            Auth.currentUserInfo().then((x: any) => {
              this.loggerUser = x;
            });
            Auth.currentAuthenticatedUser().then((x: any) => {
              this.isUserLoggedIn = true;
            }).catch(err => { this.isUserLoggedIn = false; });
          }
        });
  }

  ngOnInit() {
    this.authService.startRefreshTokenTimer();
    this.authService.sessionExpiryAlertSubOb.subscribe((res: boolean) => {
      if (res) {
        this.sessionExpiryModal.show();
        let expireInterval = interval(1000).subscribe(() => {
          if (this.expireSeconds > 0)
            this.expireSeconds = this.expireSeconds - 1;
        });
        setTimeout(() => {
          expireInterval.unsubscribe();
          this.sessionExpiryModal.hide();
          this.signout(null);
        }, 120000);
      }
    });
  }

  continue(event: Event) {
    event.preventDefault();
    from(this.authService.refreshToken()).subscribe();
    this.authService.sessionExpiryAlertSubVal(false);
    this.sessionExpiryModal.hide();
  }

  signout(event: Event) {
    if (event)
      event.preventDefault();
    this.authService.signOut().then((res: boolean) => {
      if (res) {
        this.loggerUser = null;
        this.router.navigate(['signin']);
      }
    });
  }
}
