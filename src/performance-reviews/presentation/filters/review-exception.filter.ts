import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { ReviewCycleNotFoundException } from '../../domain/exceptions/review-cycle-not-found.exception';
import { SelfReviewNotFoundException } from '../../domain/exceptions/self-review-not-found.exception';
import { PeerNominationNotFoundException } from '../../domain/exceptions/peer-nomination-not-found.exception';
import { ManagerEvaluationNotFoundException } from '../../domain/exceptions/manager-evaluation-not-found.exception';
import { CalibrationSessionNotFoundException } from '../../domain/exceptions/calibration-session-not-found.exception';
import { FinalScoreNotFoundException } from '../../domain/exceptions/final-score-not-found.exception';
import { ScoreAdjustmentRequestNotFoundException } from '../../domain/exceptions/score-adjustment-request-not-found.exception';
import { SelfReviewDeadlinePassedException } from '../../domain/exceptions/self-review-deadline-passed.exception';
import { PeerFeedbackDeadlinePassedException } from '../../domain/exceptions/peer-feedback-deadline-passed.exception';
import { ManagerEvalDeadlinePassedException } from '../../domain/exceptions/manager-eval-deadline-passed.exception';
import { CalibrationDeadlinePassedException } from '../../domain/exceptions/calibration-deadline-passed.exception';
import { InvalidReviewCycleStatusException } from '../../domain/exceptions/invalid-review-cycle-status.exception';
import { InvalidReviewStatusException } from '../../domain/exceptions/invalid-review-status.exception';
import { CalibrationAlreadyLockedException } from '../../domain/exceptions/calibration-already-locked.exception';

@Catch(
  ReviewCycleNotFoundException,
  SelfReviewNotFoundException,
  PeerNominationNotFoundException,
  ManagerEvaluationNotFoundException,
  CalibrationSessionNotFoundException,
  FinalScoreNotFoundException,
  ScoreAdjustmentRequestNotFoundException,
  SelfReviewDeadlinePassedException,
  PeerFeedbackDeadlinePassedException,
  ManagerEvalDeadlinePassedException,
  CalibrationDeadlinePassedException,
  InvalidReviewCycleStatusException,
  InvalidReviewStatusException,
  CalibrationAlreadyLockedException,
)
export class ReviewExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Map domain exceptions to HTTP status codes
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';

    if (
      exception instanceof ReviewCycleNotFoundException ||
      exception instanceof SelfReviewNotFoundException ||
      exception instanceof PeerNominationNotFoundException ||
      exception instanceof ManagerEvaluationNotFoundException ||
      exception instanceof CalibrationSessionNotFoundException ||
      exception instanceof FinalScoreNotFoundException ||
      exception instanceof ScoreAdjustmentRequestNotFoundException
    ) {
      status = HttpStatus.NOT_FOUND;
      errorCode = 'RESOURCE_NOT_FOUND';
    } else if (
      exception instanceof SelfReviewDeadlinePassedException ||
      exception instanceof PeerFeedbackDeadlinePassedException ||
      exception instanceof ManagerEvalDeadlinePassedException ||
      exception instanceof CalibrationDeadlinePassedException
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'DEADLINE_PASSED';
    } else if (
      exception instanceof InvalidReviewCycleStatusException ||
      exception instanceof InvalidReviewStatusException ||
      exception instanceof CalibrationAlreadyLockedException
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_STATE';
    }

    response.status(status).json({
      statusCode: status,
      errorCode,
      message: exception.message,
      timestamp: new Date().toISOString(),
    });
  }
}
