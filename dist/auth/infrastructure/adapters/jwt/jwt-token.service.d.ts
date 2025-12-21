import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ITokenService, TokenPair, TokenPayload } from '../../../application/ports/token-service.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { Role } from '../../../domain/value-objects/role.vo';
export declare class JwtTokenService implements ITokenService {
    private readonly jwtService;
    private readonly configService;
    private readonly accessTokenSecret;
    private readonly refreshTokenSecret;
    private readonly accessTokenExpiry;
    private readonly refreshTokenExpiry;
    private readonly revokedTokens;
    constructor(jwtService: JwtService, configService: ConfigService);
    generateTokenPair(userId: UserId, roles: Role[]): Promise<TokenPair>;
    validateAccessToken(token: string): Promise<TokenPayload>;
    validateRefreshToken(token: string): Promise<TokenPayload>;
    decodeToken(token: string): TokenPayload;
    revokeToken(tokenId: string): Promise<void>;
    private parseExpiryToSeconds;
}
