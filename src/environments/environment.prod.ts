export const environment = {
  production: true,
  awsCognitoSettings: {
    mandatorySignIn: true,
    region: 'us-east-2',
    userPoolId: 'us-east-2_ClDUuWRcR',
    userPoolWebClientId: 'rlbbg9f94vodaj73dpekde4pt',
    authenticationFlowType: 'USER_PASSWORD_AUTH'
  },
  // gatewayAPIRoot: 'http://localhost:5000',
  gatewayAPIRoot: 'http://localhost:8001'
};
