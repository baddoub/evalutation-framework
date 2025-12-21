export declare class AuthenticateUserInput {
    readonly authorizationCode: string;
    readonly codeVerifier: string;
    readonly deviceId?: string | undefined;
    readonly userAgent?: string | undefined;
    readonly ipAddress?: string | undefined;
    constructor(authorizationCode: string, codeVerifier: string, deviceId?: string | undefined, userAgent?: string | undefined, ipAddress?: string | undefined);
}
