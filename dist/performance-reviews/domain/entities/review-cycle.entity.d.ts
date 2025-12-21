import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { CycleDeadlines } from '../value-objects/cycle-deadlines.vo';
export declare class CycleStatus {
    private readonly _value;
    private constructor();
    static readonly DRAFT: CycleStatus;
    static readonly ACTIVE: CycleStatus;
    static readonly CALIBRATION: CycleStatus;
    static readonly COMPLETED: CycleStatus;
    static fromString(status: string): CycleStatus;
    get value(): string;
    equals(other: CycleStatus): boolean;
}
export interface CreateReviewCycleProps {
    id?: ReviewCycleId;
    name: string;
    year: number;
    deadlines: CycleDeadlines;
    startDate?: Date;
}
export declare class ReviewCycle {
    private readonly _id;
    private _name;
    private _year;
    private _status;
    private _deadlines;
    private _startDate;
    private _endDate?;
    private constructor();
    static create(props: CreateReviewCycleProps): ReviewCycle;
    start(): void;
    activate(): void;
    enterCalibration(): void;
    complete(): void;
    hasDeadlinePassed(phase: 'selfReview' | 'peerFeedback' | 'managerEvaluation' | 'calibration' | 'feedbackDelivery'): boolean;
    get id(): ReviewCycleId;
    get name(): string;
    get year(): number;
    get status(): CycleStatus;
    get deadlines(): CycleDeadlines;
    get startDate(): Date;
    get endDate(): Date | undefined;
    get isActive(): boolean;
    get isCompleted(): boolean;
}
