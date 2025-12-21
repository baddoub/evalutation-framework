import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { SelfReviewId } from '../value-objects/self-review-id.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
import { PillarScores } from '../value-objects/pillar-scores.vo';
import { Narrative } from '../value-objects/narrative.vo';
import { ReviewStatus } from '../value-objects/review-status.vo';
export interface CreateSelfReviewProps {
    id?: SelfReviewId;
    cycleId: ReviewCycleId;
    userId: UserId;
    scores: PillarScores;
    narrative: Narrative;
}
export declare class SelfReview {
    private readonly _id;
    private readonly _cycleId;
    private readonly _userId;
    private _scores;
    private _narrative;
    private _status;
    private _submittedAt?;
    private constructor();
    static create(props: CreateSelfReviewProps): SelfReview;
    updateScores(scores: PillarScores): void;
    updateNarrative(narrative: Narrative): void;
    submit(): void;
    get id(): SelfReviewId;
    get cycleId(): ReviewCycleId;
    get userId(): UserId;
    get scores(): PillarScores;
    get narrative(): Narrative;
    get status(): ReviewStatus;
    get submittedAt(): Date | undefined;
    get isSubmitted(): boolean;
}
