"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewAuthorizationService = void 0;
class ReviewAuthorizationService {
    canViewSelfReview(user, review) {
        if (review.userId.equals(user.id)) {
            return true;
        }
        if (this.hasRole(user, 'admin')) {
            return true;
        }
        return false;
    }
    canSubmitPeerFeedback(reviewerId, revieweeId, revieweeManagerId) {
        if (revieweeId.equals(reviewerId)) {
            return false;
        }
        if (revieweeManagerId && revieweeManagerId.equals(reviewerId)) {
            return false;
        }
        return true;
    }
    canCalibrateScores(user, _evaluation) {
        if (this.hasRole(user, 'admin')) {
            return true;
        }
        if (this.hasRole(user, 'manager')) {
            return true;
        }
        return false;
    }
    canRequestScoreAdjustment(user, employeeManagerId) {
        if (employeeManagerId && employeeManagerId.equals(user.id)) {
            return true;
        }
        return false;
    }
    canApproveScoreAdjustment(user) {
        return this.hasRole(user, 'admin');
    }
    canViewManagerEvaluation(user, evaluation, allowEmployeeView = false) {
        if (evaluation.managerId.equals(user.id)) {
            return true;
        }
        if (allowEmployeeView && evaluation.employeeId.equals(user.id)) {
            return true;
        }
        if (this.hasRole(user, 'admin')) {
            return true;
        }
        return false;
    }
    hasRole(user, roleName) {
        return user.roles.some((role) => role.value === roleName);
    }
}
exports.ReviewAuthorizationService = ReviewAuthorizationService;
//# sourceMappingURL=review-authorization.service.js.map