import { UserId } from '../value-objects/user-id.vo';
export interface RefreshTokenProps {
    id: string;
    userId: UserId;
    tokenHash: string;
    used: boolean;
    expiresAt: Date;
    createdAt: Date;
    revokedAt?: Date;
}
export declare class RefreshToken {
    private readonly _id;
    private readonly _userId;
    private readonly _tokenHash;
    private _used;
    private readonly _expiresAt;
    private readonly _createdAt;
    private _revokedAt?;
    private constructor();
    static create(props: RefreshTokenProps): RefreshToken;
    markAsUsed(): void;
    revoke(): void;
    isExpired(): boolean;
    isValid(): boolean;
    get id(): string;
    get userId(): UserId;
    get tokenHash(): string;
    get used(): boolean;
    get expiresAt(): Date;
    get createdAt(): Date;
    get revokedAt(): Date | undefined;
}
