"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceReviewsModule = void 0;
const common_1 = require("@nestjs/common");
const prisma_module_1 = require("../auth/infrastructure/persistence/prisma/prisma.module");
const score_calculation_service_1 = require("./domain/services/score-calculation.service");
const peer_feedback_aggregation_service_1 = require("./domain/services/peer-feedback-aggregation.service");
const final_score_calculation_service_1 = require("./domain/services/final-score-calculation.service");
const prisma_review_cycle_repository_1 = require("./infrastructure/persistence/repositories/prisma-review-cycle.repository");
const prisma_self_review_repository_1 = require("./infrastructure/persistence/repositories/prisma-self-review.repository");
const prisma_peer_nomination_repository_1 = require("./infrastructure/persistence/repositories/prisma-peer-nomination.repository");
const prisma_peer_feedback_repository_1 = require("./infrastructure/persistence/repositories/prisma-peer-feedback.repository");
const prisma_manager_evaluation_repository_1 = require("./infrastructure/persistence/repositories/prisma-manager-evaluation.repository");
const prisma_calibration_session_repository_1 = require("./infrastructure/persistence/repositories/prisma-calibration-session.repository");
const prisma_calibration_adjustment_repository_1 = require("./infrastructure/persistence/repositories/prisma-calibration-adjustment.repository");
const prisma_final_score_repository_1 = require("./infrastructure/persistence/repositories/prisma-final-score.repository");
const prisma_score_adjustment_request_repository_1 = require("./infrastructure/persistence/repositories/prisma-score-adjustment-request.repository");
const create_review_cycle_use_case_1 = require("./application/use-cases/review-cycles/create-review-cycle.use-case");
const activate_review_cycle_use_case_1 = require("./application/use-cases/review-cycles/activate-review-cycle.use-case");
const get_review_cycle_use_case_1 = require("./application/use-cases/review-cycles/get-review-cycle.use-case");
const get_my_self_review_use_case_1 = require("./application/use-cases/self-reviews/get-my-self-review.use-case");
const update_self_review_use_case_1 = require("./application/use-cases/self-reviews/update-self-review.use-case");
const submit_self_review_use_case_1 = require("./application/use-cases/self-reviews/submit-self-review.use-case");
const nominate_peers_use_case_1 = require("./application/use-cases/peer-feedback/nominate-peers.use-case");
const submit_peer_feedback_use_case_1 = require("./application/use-cases/peer-feedback/submit-peer-feedback.use-case");
const get_aggregated_peer_feedback_use_case_1 = require("./application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case");
const get_manager_evaluation_use_case_1 = require("./application/use-cases/manager-evaluations/get-manager-evaluation.use-case");
const update_manager_evaluation_use_case_1 = require("./application/use-cases/manager-evaluations/update-manager-evaluation.use-case");
const submit_manager_evaluation_use_case_1 = require("./application/use-cases/manager-evaluations/submit-manager-evaluation.use-case");
const get_calibration_session_use_case_1 = require("./application/use-cases/calibration/get-calibration-session.use-case");
const record_calibration_note_use_case_1 = require("./application/use-cases/calibration/record-calibration-note.use-case");
const apply_calibration_adjustment_use_case_1 = require("./application/use-cases/calibration/apply-calibration-adjustment.use-case");
const lock_calibration_use_case_1 = require("./application/use-cases/calibration/lock-calibration.use-case");
const get_final_score_use_case_1 = require("./application/use-cases/final-scores/get-final-score.use-case");
const calculate_final_scores_use_case_1 = require("./application/use-cases/final-scores/calculate-final-scores.use-case");
const deliver_feedback_use_case_1 = require("./application/use-cases/final-scores/deliver-feedback.use-case");
const request_score_adjustment_use_case_1 = require("./application/use-cases/score-adjustments/request-score-adjustment.use-case");
const approve_score_adjustment_use_case_1 = require("./application/use-cases/score-adjustments/approve-score-adjustment.use-case");
const review_cycles_controller_1 = require("./presentation/controllers/review-cycles.controller");
const self_reviews_controller_1 = require("./presentation/controllers/self-reviews.controller");
const peer_feedback_controller_1 = require("./presentation/controllers/peer-feedback.controller");
const manager_evaluations_controller_1 = require("./presentation/controllers/manager-evaluations.controller");
const calibration_controller_1 = require("./presentation/controllers/calibration.controller");
const final_scores_controller_1 = require("./presentation/controllers/final-scores.controller");
const review_authorization_guard_1 = require("./presentation/guards/review-authorization.guard");
const auth_module_1 = require("../auth/auth.module");
let PerformanceReviewsModule = class PerformanceReviewsModule {
};
exports.PerformanceReviewsModule = PerformanceReviewsModule;
exports.PerformanceReviewsModule = PerformanceReviewsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, auth_module_1.AuthModule],
        controllers: [
            review_cycles_controller_1.ReviewCyclesController,
            self_reviews_controller_1.SelfReviewsController,
            peer_feedback_controller_1.PeerFeedbackController,
            manager_evaluations_controller_1.ManagerEvaluationsController,
            calibration_controller_1.CalibrationController,
            final_scores_controller_1.FinalScoresController,
        ],
        providers: [
            score_calculation_service_1.ScoreCalculationService,
            peer_feedback_aggregation_service_1.PeerFeedbackAggregationService,
            final_score_calculation_service_1.FinalScoreCalculationService,
            {
                provide: 'IReviewCycleRepository',
                useClass: prisma_review_cycle_repository_1.PrismaReviewCycleRepository,
            },
            {
                provide: 'ISelfReviewRepository',
                useClass: prisma_self_review_repository_1.PrismaSelfReviewRepository,
            },
            {
                provide: 'IPeerNominationRepository',
                useClass: prisma_peer_nomination_repository_1.PrismaPeerNominationRepository,
            },
            {
                provide: 'IPeerFeedbackRepository',
                useClass: prisma_peer_feedback_repository_1.PrismaPeerFeedbackRepository,
            },
            {
                provide: 'IManagerEvaluationRepository',
                useClass: prisma_manager_evaluation_repository_1.PrismaManagerEvaluationRepository,
            },
            {
                provide: 'ICalibrationSessionRepository',
                useClass: prisma_calibration_session_repository_1.PrismaCalibrationSessionRepository,
            },
            {
                provide: 'ICalibrationAdjustmentRepository',
                useClass: prisma_calibration_adjustment_repository_1.PrismaCalibrationAdjustmentRepository,
            },
            {
                provide: 'IFinalScoreRepository',
                useClass: prisma_final_score_repository_1.PrismaFinalScoreRepository,
            },
            {
                provide: 'IScoreAdjustmentRequestRepository',
                useClass: prisma_score_adjustment_request_repository_1.PrismaScoreAdjustmentRequestRepository,
            },
            create_review_cycle_use_case_1.CreateReviewCycleUseCase,
            activate_review_cycle_use_case_1.ActivateReviewCycleUseCase,
            get_review_cycle_use_case_1.GetReviewCycleUseCase,
            get_my_self_review_use_case_1.GetMySelfReviewUseCase,
            update_self_review_use_case_1.UpdateSelfReviewUseCase,
            submit_self_review_use_case_1.SubmitSelfReviewUseCase,
            nominate_peers_use_case_1.NominatePeersUseCase,
            submit_peer_feedback_use_case_1.SubmitPeerFeedbackUseCase,
            get_aggregated_peer_feedback_use_case_1.GetAggregatedPeerFeedbackUseCase,
            get_manager_evaluation_use_case_1.GetManagerEvaluationUseCase,
            update_manager_evaluation_use_case_1.UpdateManagerEvaluationUseCase,
            submit_manager_evaluation_use_case_1.SubmitManagerEvaluationUseCase,
            get_calibration_session_use_case_1.GetCalibrationSessionUseCase,
            record_calibration_note_use_case_1.RecordCalibrationNoteUseCase,
            apply_calibration_adjustment_use_case_1.ApplyCalibrationAdjustmentUseCase,
            lock_calibration_use_case_1.LockCalibrationUseCase,
            get_final_score_use_case_1.GetFinalScoreUseCase,
            calculate_final_scores_use_case_1.CalculateFinalScoresUseCase,
            deliver_feedback_use_case_1.DeliverFeedbackUseCase,
            request_score_adjustment_use_case_1.RequestScoreAdjustmentUseCase,
            approve_score_adjustment_use_case_1.ApproveScoreAdjustmentUseCase,
            review_authorization_guard_1.ReviewAuthorizationGuard,
        ],
        exports: [
            get_final_score_use_case_1.GetFinalScoreUseCase,
            calculate_final_scores_use_case_1.CalculateFinalScoresUseCase,
        ],
    })
], PerformanceReviewsModule);
//# sourceMappingURL=performance-reviews.module.js.map