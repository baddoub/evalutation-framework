export declare abstract class BaseException extends Error {
    readonly timestamp: Date;
    readonly code: string;
    constructor(message: string, code: string);
    toJSON(): Record<string, unknown>;
}
