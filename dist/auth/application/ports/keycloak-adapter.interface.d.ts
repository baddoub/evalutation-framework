export interface KeycloakTokens {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export interface KeycloakUserInfo {
    sub: string;
    email: string;
    name: string;
    emailVerified?: boolean;
    preferredUsername?: string;
}
export interface IKeycloakAdapter {
    exchangeCodeForTokens(code: string, codeVerifier: string): Promise<KeycloakTokens>;
    validateToken(token: string): Promise<KeycloakUserInfo>;
    refreshTokens(refreshToken: string): Promise<KeycloakTokens>;
    revokeToken(token: string): Promise<void>;
    getUserInfo(accessToken: string): Promise<KeycloakUserInfo>;
}
