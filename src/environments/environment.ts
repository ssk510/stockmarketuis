// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false, 
  awsCognitoSettings: {
    mandatorySignIn: true,
    region: 'us-east-1',
    userPoolId: 'us-east-1_u3t4ChEoU',
    userPoolWebClientId: '1robhrct7t6nb3pa6u97ovv62l',
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  },
  gatewayAPIRoot: 'http://localhost:5000'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
