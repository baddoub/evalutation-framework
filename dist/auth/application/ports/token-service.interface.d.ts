import { UserId } from '../../domain/value-objects/user-id.vo';
import { Role } from '../../domain/value-objects/role.vo';
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
}
export interface TokenPayload {
    sub: string;
    email: string;
    roles: string[];
    iat: number;
    exp: number;
    jti: string;
}
export interface ITokenService {
    generateTokenPair(userId: UserId, roles: Role[]): Promise<TokenPair>;
    validateAccessToken(token: string): Promise<TokenPayload>;
    validateRefreshToken(token: string): Promise<TokenPayload>;
    decodeToken(token: string): TokenPayload;
    revokeToken(tokenId: string): Promise<void>;
}
