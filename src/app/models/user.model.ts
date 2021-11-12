export interface SignIn {
    email: string;
    password: string;
}

export interface SignUp extends SignIn {
    attributes?: UserAttributes;
}

export interface UserAttributes {
    email: string;
    given_name: string;
    family_name: string;
}

export interface CognitoUser {
    Session?: any,
    attributes?: CognitoUserAttributes,
    authenticationFlowType?: string,
    username?: string,
    signInUserSession?: SignedInUserSession;
}

export interface SignedInUserSession {
    accessToken?: AccessToken,
    idToken?: IdToken,
    refreshToken?: RefreshAccessToken
}

export interface CognitoUserAttributes {
    sub?: string,
    email_verified?: boolean | null,
    given_name?: string,
    family_name?: string,
    email?: string
}

export interface AccessToken {
    jwtToken?: string,
    payload?: any,
}

export interface IdToken extends AccessToken {

}

export interface RefreshAccessToken {
    token?: string
}