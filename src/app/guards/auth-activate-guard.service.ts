import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { Auth } from 'aws-amplify';


@Injectable()
export class AuthActivateGuardService implements CanActivate {

    constructor(private _router: Router) {
    }

    canActivate(route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot): boolean | Promise<boolean> | Observable<boolean> {

        return Auth.currentAuthenticatedUser().then((x: any) => {
            return true;
        }).catch(err => {
            this._router.navigateByUrl('un-authorized');
            return false;
        });
    }

}