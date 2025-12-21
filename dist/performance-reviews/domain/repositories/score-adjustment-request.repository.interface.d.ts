import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
import { PillarScores } from '../value-objects/pillar-scores.vo';
export interface ScoreAdjustmentRequest {
    id: string;
    cycleId: ReviewCycleId;
    employeeId: UserId;
    requesterId: UserId;
    approverId?: UserId;
    reason: string;
    status: 'PENDING' | 'APPROVED' | 'REJECTED';
    proposedScores: PillarScores;
    requestedAt: Date;
    reviewedAt?: Date;
    rejectionReason?: string;
    approve(reviewedBy: string, reviewNotes?: string): void;
    reject(reviewedBy: string, reviewNotes?: string): void;
}
export interface IScoreAdjustmentRequestRepository {
    findById(id: string): Promise<ScoreAdjustmentRequest | null>;
    findPending(): Promise<ScoreAdjustmentRequest[]>;
    findByEmployee(employeeId: UserId, cycleId: ReviewCycleId): Promise<ScoreAdjustmentRequest[]>;
    save(request: ScoreAdjustmentRequest): Promise<ScoreAdjustmentRequest>;
    delete(id: string): Promise<void>;
}
