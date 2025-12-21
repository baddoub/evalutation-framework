export declare class PeerNominationId {
    private readonly _value;
    private constructor();
    get value(): string;
    static generate(): PeerNominationId;
    static fromString(value: string): PeerNominationId;
    static create(value?: string): PeerNominationId;
    equals(other: PeerNominationId): boolean;
    toString(): string;
}
