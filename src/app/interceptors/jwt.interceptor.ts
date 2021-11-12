import { Injectable } from "@angular/core";
import { HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from "@angular/common/http";
import { from, Observable } from "rxjs";
import { Auth } from 'aws-amplify';
import { CognitoUser } from "../models/user.model";
import { map, switchMap, tap } from "rxjs/operators";
import { Guid } from 'guid-typescript';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
    private currentUser: CognitoUser = null;

    constructor() {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        let origin = location.origin || location.host;
        let headers = req.headers;
        return from(Auth.currentAuthenticatedUser()).pipe(
            tap(user => this.currentUser = user), switchMap((x: CognitoUser) => {
                if (x && x.signInUserSession && x.signInUserSession.accessToken && x.signInUserSession.accessToken.jwtToken) {
                    headers = headers.set('Authorization', `Bearer ${x.signInUserSession.accessToken.jwtToken}`);
                }
                headers = headers.set('Content-Type', 'application/json');
                headers = headers.set('Accept', 'application/json');
                headers = headers.set('Access-Control-Allow-Origin', origin);
                headers = headers.set('CorrelationId', Guid.create().toString());
                req = req.clone({ headers: headers });
                return next.handle(req);
            }));
    }
}