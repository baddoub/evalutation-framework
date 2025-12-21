import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
import { Role } from '../../../auth/domain/value-objects/role.vo';
import { SelfReview } from '../entities/self-review.entity';
import { ManagerEvaluation } from '../entities/manager-evaluation.entity';
export interface AuthorizedUser {
    id: UserId;
    roles: Role[];
    managerId?: UserId;
}
export declare class ReviewAuthorizationService {
    canViewSelfReview(user: AuthorizedUser, review: SelfReview): boolean;
    canSubmitPeerFeedback(reviewerId: UserId, revieweeId: UserId, revieweeManagerId?: UserId): boolean;
    canCalibrateScores(user: AuthorizedUser, _evaluation: ManagerEvaluation): boolean;
    canRequestScoreAdjustment(user: AuthorizedUser, employeeManagerId?: UserId): boolean;
    canApproveScoreAdjustment(user: AuthorizedUser): boolean;
    canViewManagerEvaluation(user: AuthorizedUser, evaluation: ManagerEvaluation, allowEmployeeView?: boolean): boolean;
    private hasRole;
}
