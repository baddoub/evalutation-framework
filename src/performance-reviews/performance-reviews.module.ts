import { Module } from '@nestjs/common';
import { PrismaModule } from '../auth/infrastructure/persistence/prisma/prisma.module';

// Domain Services
import { ScoreCalculationService } from './domain/services/score-calculation.service';
import { PeerFeedbackAggregationService } from './domain/services/peer-feedback-aggregation.service';
import { FinalScoreCalculationService } from './domain/services/final-score-calculation.service';

// Infrastructure - Repositories
import { PrismaReviewCycleRepository } from './infrastructure/persistence/repositories/prisma-review-cycle.repository';
import { PrismaSelfReviewRepository } from './infrastructure/persistence/repositories/prisma-self-review.repository';
import { PrismaPeerNominationRepository } from './infrastructure/persistence/repositories/prisma-peer-nomination.repository';
import { PrismaPeerFeedbackRepository } from './infrastructure/persistence/repositories/prisma-peer-feedback.repository';
import { PrismaManagerEvaluationRepository } from './infrastructure/persistence/repositories/prisma-manager-evaluation.repository';
import { PrismaCalibrationSessionRepository } from './infrastructure/persistence/repositories/prisma-calibration-session.repository';
import { PrismaCalibrationAdjustmentRepository } from './infrastructure/persistence/repositories/prisma-calibration-adjustment.repository';
import { PrismaFinalScoreRepository } from './infrastructure/persistence/repositories/prisma-final-score.repository';
import { PrismaScoreAdjustmentRequestRepository } from './infrastructure/persistence/repositories/prisma-score-adjustment-request.repository';

// Application - Use Cases - Review Cycles
import { CreateReviewCycleUseCase } from './application/use-cases/review-cycles/create-review-cycle.use-case';
import { ActivateReviewCycleUseCase } from './application/use-cases/review-cycles/activate-review-cycle.use-case';
import { GetReviewCycleUseCase } from './application/use-cases/review-cycles/get-review-cycle.use-case';

// Application - Use Cases - Self Reviews
import { GetMySelfReviewUseCase } from './application/use-cases/self-reviews/get-my-self-review.use-case';
import { UpdateSelfReviewUseCase } from './application/use-cases/self-reviews/update-self-review.use-case';
import { SubmitSelfReviewUseCase } from './application/use-cases/self-reviews/submit-self-review.use-case';

// Application - Use Cases - Peer Feedback
import { NominatePeersUseCase } from './application/use-cases/peer-feedback/nominate-peers.use-case';
import { SubmitPeerFeedbackUseCase } from './application/use-cases/peer-feedback/submit-peer-feedback.use-case';
import { GetAggregatedPeerFeedbackUseCase } from './application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case';

// Application - Use Cases - Manager Evaluations
import { GetManagerEvaluationUseCase } from './application/use-cases/manager-evaluations/get-manager-evaluation.use-case';
import { UpdateManagerEvaluationUseCase } from './application/use-cases/manager-evaluations/update-manager-evaluation.use-case';
import { SubmitManagerEvaluationUseCase } from './application/use-cases/manager-evaluations/submit-manager-evaluation.use-case';

// Application - Use Cases - Calibration
import { GetCalibrationSessionUseCase } from './application/use-cases/calibration/get-calibration-session.use-case';
import { RecordCalibrationNoteUseCase } from './application/use-cases/calibration/record-calibration-note.use-case';
import { ApplyCalibrationAdjustmentUseCase } from './application/use-cases/calibration/apply-calibration-adjustment.use-case';
import { LockCalibrationUseCase } from './application/use-cases/calibration/lock-calibration.use-case';

// Application - Use Cases - Final Scores
import { GetFinalScoreUseCase } from './application/use-cases/final-scores/get-final-score.use-case';
import { CalculateFinalScoresUseCase } from './application/use-cases/final-scores/calculate-final-scores.use-case';
import { DeliverFeedbackUseCase } from './application/use-cases/final-scores/deliver-feedback.use-case';

// Application - Use Cases - Score Adjustments
import { RequestScoreAdjustmentUseCase } from './application/use-cases/score-adjustments/request-score-adjustment.use-case';
import { ApproveScoreAdjustmentUseCase } from './application/use-cases/score-adjustments/approve-score-adjustment.use-case';

// Presentation - Controllers
import { ReviewCyclesController } from './presentation/controllers/review-cycles.controller';
import { SelfReviewsController } from './presentation/controllers/self-reviews.controller';
import { PeerFeedbackController } from './presentation/controllers/peer-feedback.controller';
import { ManagerEvaluationsController } from './presentation/controllers/manager-evaluations.controller';
import { CalibrationController } from './presentation/controllers/calibration.controller';
import { FinalScoresController } from './presentation/controllers/final-scores.controller';

// Presentation - Guards
import { ReviewAuthorizationGuard } from './presentation/guards/review-authorization.guard';
import { AuthModule } from 'src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [
    ReviewCyclesController,
    SelfReviewsController,
    PeerFeedbackController,
    ManagerEvaluationsController,
    CalibrationController,
    FinalScoresController,
  ],
  providers: [
    // Domain Services
    ScoreCalculationService,
    PeerFeedbackAggregationService,
    FinalScoreCalculationService,

    // Repository Providers (with DI tokens)
    {
      provide: 'IReviewCycleRepository',
      useClass: PrismaReviewCycleRepository,
    },
    {
      provide: 'ISelfReviewRepository',
      useClass: PrismaSelfReviewRepository,
    },
    {
      provide: 'IPeerNominationRepository',
      useClass: PrismaPeerNominationRepository,
    },
    {
      provide: 'IPeerFeedbackRepository',
      useClass: PrismaPeerFeedbackRepository,
    },
    {
      provide: 'IManagerEvaluationRepository',
      useClass: PrismaManagerEvaluationRepository,
    },
    {
      provide: 'ICalibrationSessionRepository',
      useClass: PrismaCalibrationSessionRepository,
    },
    {
      provide: 'ICalibrationAdjustmentRepository',
      useClass: PrismaCalibrationAdjustmentRepository,
    },
    {
      provide: 'IFinalScoreRepository',
      useClass: PrismaFinalScoreRepository,
    },
    {
      provide: 'IScoreAdjustmentRequestRepository',
      useClass: PrismaScoreAdjustmentRequestRepository,
    },

    // Use Cases - Review Cycles
    CreateReviewCycleUseCase,
    ActivateReviewCycleUseCase,
    GetReviewCycleUseCase,

    // Use Cases - Self Reviews
    GetMySelfReviewUseCase,
    UpdateSelfReviewUseCase,
    SubmitSelfReviewUseCase,

    // Use Cases - Peer Feedback
    NominatePeersUseCase,
    SubmitPeerFeedbackUseCase,
    GetAggregatedPeerFeedbackUseCase,

    // Use Cases - Manager Evaluations
    GetManagerEvaluationUseCase,
    UpdateManagerEvaluationUseCase,
    SubmitManagerEvaluationUseCase,

    // Use Cases - Calibration
    GetCalibrationSessionUseCase,
    RecordCalibrationNoteUseCase,
    ApplyCalibrationAdjustmentUseCase,
    LockCalibrationUseCase,

    // Use Cases - Final Scores
    GetFinalScoreUseCase,
    CalculateFinalScoresUseCase,
    DeliverFeedbackUseCase,

    // Use Cases - Score Adjustments
    RequestScoreAdjustmentUseCase,
    ApproveScoreAdjustmentUseCase,

    // Guards
    ReviewAuthorizationGuard,
  ],
  exports: [
    // Export use cases that might be needed by other modules
    GetFinalScoreUseCase,
    CalculateFinalScoresUseCase,
  ],
})
export class PerformanceReviewsModule {}
