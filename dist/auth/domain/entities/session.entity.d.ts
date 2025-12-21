import { UserId } from '../value-objects/user-id.vo';
export interface SessionProps {
    id: string;
    userId: UserId;
    deviceId: string | null;
    userAgent: string | null;
    ipAddress: string | null;
    expiresAt: Date;
    createdAt: Date;
    lastUsed: Date;
}
export declare class Session {
    private readonly _id;
    private readonly _userId;
    private readonly _deviceId;
    private readonly _userAgent;
    private readonly _ipAddress;
    private readonly _expiresAt;
    private readonly _createdAt;
    private _lastUsed;
    private constructor();
    static create(props: SessionProps): Session;
    isExpired(): boolean;
    updateLastUsed(): void;
    isFromSameDevice(deviceId: string | null): boolean;
    private static isValidIpAddress;
    get id(): string;
    get userId(): UserId;
    get deviceId(): string | null;
    get userAgent(): string | null;
    get ipAddress(): string | null;
    get expiresAt(): Date;
    get createdAt(): Date;
    get lastUsed(): Date;
}
