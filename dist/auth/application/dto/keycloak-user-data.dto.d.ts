export declare class KeycloakUserDataDto {
    readonly keycloakId: string;
    readonly email: string;
    readonly name: string;
    readonly emailVerified?: boolean | undefined;
    readonly preferredUsername?: string | undefined;
    constructor(keycloakId: string, email: string, name: string, emailVerified?: boolean | undefined, preferredUsername?: string | undefined);
    static fromKeycloakUserInfo(userInfo: {
        sub: string;
        email: string;
        name: string;
        email_verified?: boolean;
        preferred_username?: string;
    }): KeycloakUserDataDto;
}
