import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { PeerFeedbackId } from '../value-objects/peer-feedback-id.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
import { PillarScores } from '../value-objects/pillar-scores.vo';
export interface CreatePeerFeedbackProps {
    id?: PeerFeedbackId;
    cycleId: ReviewCycleId;
    revieweeId: UserId;
    reviewerId: UserId;
    scores: PillarScores;
    strengths?: string;
    growthAreas?: string;
    generalComments?: string;
}
export declare class PeerFeedback {
    private readonly _id;
    private readonly _cycleId;
    private readonly _revieweeId;
    private readonly _reviewerId;
    private _scores;
    private _strengths?;
    private _growthAreas?;
    private _generalComments?;
    private _submittedAt?;
    private constructor();
    static create(props: CreatePeerFeedbackProps): PeerFeedback;
    get id(): PeerFeedbackId;
    get cycleId(): ReviewCycleId;
    get revieweeId(): UserId;
    get reviewerId(): UserId;
    get scores(): PillarScores;
    get strengths(): string | undefined;
    get growthAreas(): string | undefined;
    get generalComments(): string | undefined;
    get submittedAt(): Date | undefined;
    get isAnonymized(): boolean;
}
