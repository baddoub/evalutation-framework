export declare class PeerFeedbackId {
    private readonly _value;
    private constructor();
    static generate(): PeerFeedbackId;
    static fromString(id: string): PeerFeedbackId;
    get value(): string;
    equals(other: PeerFeedbackId): boolean;
}
