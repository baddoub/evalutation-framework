export declare class TokenPairDto {
    readonly accessToken: string;
    readonly refreshToken: string;
    readonly expiresIn: number;
    constructor(accessToken: string, refreshToken: string, expiresIn: number);
}
