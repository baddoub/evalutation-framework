import { ConfigService } from '@nestjs/config';
export declare class KeycloakConfig {
    private readonly configService;
    constructor(configService: ConfigService);
    get url(): string;
    get realm(): string;
    get clientId(): string;
    get clientSecret(): string;
    get redirectUri(): string;
    get tokenEndpoint(): string;
    get userInfoEndpoint(): string;
    get introspectionEndpoint(): string;
    get logoutEndpoint(): string;
    get jwksEndpoint(): string;
    get authorizationEndpoint(): string;
}
