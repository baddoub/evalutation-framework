"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReviewExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const review_cycle_not_found_exception_1 = require("../../domain/exceptions/review-cycle-not-found.exception");
const self_review_not_found_exception_1 = require("../../domain/exceptions/self-review-not-found.exception");
const peer_nomination_not_found_exception_1 = require("../../domain/exceptions/peer-nomination-not-found.exception");
const manager_evaluation_not_found_exception_1 = require("../../domain/exceptions/manager-evaluation-not-found.exception");
const calibration_session_not_found_exception_1 = require("../../domain/exceptions/calibration-session-not-found.exception");
const final_score_not_found_exception_1 = require("../../domain/exceptions/final-score-not-found.exception");
const score_adjustment_request_not_found_exception_1 = require("../../domain/exceptions/score-adjustment-request-not-found.exception");
const self_review_deadline_passed_exception_1 = require("../../domain/exceptions/self-review-deadline-passed.exception");
const peer_feedback_deadline_passed_exception_1 = require("../../domain/exceptions/peer-feedback-deadline-passed.exception");
const manager_eval_deadline_passed_exception_1 = require("../../domain/exceptions/manager-eval-deadline-passed.exception");
const calibration_deadline_passed_exception_1 = require("../../domain/exceptions/calibration-deadline-passed.exception");
const invalid_review_cycle_status_exception_1 = require("../../domain/exceptions/invalid-review-cycle-status.exception");
const invalid_review_status_exception_1 = require("../../domain/exceptions/invalid-review-status.exception");
const calibration_already_locked_exception_1 = require("../../domain/exceptions/calibration-already-locked.exception");
let ReviewExceptionFilter = class ReviewExceptionFilter {
    catch(exception, host) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        let status = common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        let errorCode = 'INTERNAL_ERROR';
        if (exception instanceof review_cycle_not_found_exception_1.ReviewCycleNotFoundException ||
            exception instanceof self_review_not_found_exception_1.SelfReviewNotFoundException ||
            exception instanceof peer_nomination_not_found_exception_1.PeerNominationNotFoundException ||
            exception instanceof manager_evaluation_not_found_exception_1.ManagerEvaluationNotFoundException ||
            exception instanceof calibration_session_not_found_exception_1.CalibrationSessionNotFoundException ||
            exception instanceof final_score_not_found_exception_1.FinalScoreNotFoundException ||
            exception instanceof score_adjustment_request_not_found_exception_1.ScoreAdjustmentRequestNotFoundException) {
            status = common_1.HttpStatus.NOT_FOUND;
            errorCode = 'RESOURCE_NOT_FOUND';
        }
        else if (exception instanceof self_review_deadline_passed_exception_1.SelfReviewDeadlinePassedException ||
            exception instanceof peer_feedback_deadline_passed_exception_1.PeerFeedbackDeadlinePassedException ||
            exception instanceof manager_eval_deadline_passed_exception_1.ManagerEvalDeadlinePassedException ||
            exception instanceof calibration_deadline_passed_exception_1.CalibrationDeadlinePassedException) {
            status = common_1.HttpStatus.BAD_REQUEST;
            errorCode = 'DEADLINE_PASSED';
        }
        else if (exception instanceof invalid_review_cycle_status_exception_1.InvalidReviewCycleStatusException ||
            exception instanceof invalid_review_status_exception_1.InvalidReviewStatusException ||
            exception instanceof calibration_already_locked_exception_1.CalibrationAlreadyLockedException) {
            status = common_1.HttpStatus.BAD_REQUEST;
            errorCode = 'INVALID_STATE';
        }
        response.status(status).json({
            statusCode: status,
            errorCode,
            message: exception.message,
            timestamp: new Date().toISOString(),
        });
    }
};
exports.ReviewExceptionFilter = ReviewExceptionFilter;
exports.ReviewExceptionFilter = ReviewExceptionFilter = __decorate([
    (0, common_1.Catch)(review_cycle_not_found_exception_1.ReviewCycleNotFoundException, self_review_not_found_exception_1.SelfReviewNotFoundException, peer_nomination_not_found_exception_1.PeerNominationNotFoundException, manager_evaluation_not_found_exception_1.ManagerEvaluationNotFoundException, calibration_session_not_found_exception_1.CalibrationSessionNotFoundException, final_score_not_found_exception_1.FinalScoreNotFoundException, score_adjustment_request_not_found_exception_1.ScoreAdjustmentRequestNotFoundException, self_review_deadline_passed_exception_1.SelfReviewDeadlinePassedException, peer_feedback_deadline_passed_exception_1.PeerFeedbackDeadlinePassedException, manager_eval_deadline_passed_exception_1.ManagerEvalDeadlinePassedException, calibration_deadline_passed_exception_1.CalibrationDeadlinePassedException, invalid_review_cycle_status_exception_1.InvalidReviewCycleStatusException, invalid_review_status_exception_1.InvalidReviewStatusException, calibration_already_locked_exception_1.CalibrationAlreadyLockedException)
], ReviewExceptionFilter);
//# sourceMappingURL=review-exception.filter.js.map