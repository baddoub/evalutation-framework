import { IKeycloakAdapter, KeycloakTokens, KeycloakUserInfo } from '../../../application/ports/keycloak-adapter.interface';
import { KeycloakConfig } from './keycloak.config';
export declare class KeycloakAdapter implements IKeycloakAdapter {
    private readonly config;
    private readonly jwksClient;
    constructor(config: KeycloakConfig);
    exchangeCodeForTokens(code: string, codeVerifier: string): Promise<KeycloakTokens>;
    validateToken(token: string): Promise<KeycloakUserInfo>;
    refreshTokens(refreshToken: string): Promise<KeycloakTokens>;
    revokeToken(token: string): Promise<void>;
    getUserInfo(accessToken: string): Promise<KeycloakUserInfo>;
    private getSigningKey;
}
