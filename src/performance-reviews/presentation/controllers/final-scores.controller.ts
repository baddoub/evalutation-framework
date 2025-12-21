import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard';
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard';
import { ReviewExceptionFilter } from '../filters/review-exception.filter';
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator';
import { Roles } from '../decorators/roles.decorator';
import {
  DeliverFeedbackRequestDto,
  FinalScoreResponseDto,
  ScoreAdjustmentRequestDto,
  ScoreAdjustmentResponseDto,
} from '../dto/final-score.dto';
import { GetFinalScoreUseCase } from '../../application/use-cases/final-scores/get-final-score.use-case';
import { DeliverFeedbackUseCase } from '../../application/use-cases/final-scores/deliver-feedback.use-case';
import { RequestScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/request-score-adjustment.use-case';
import { ApproveScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/approve-score-adjustment.use-case';
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';

@ApiTags('Final Scores')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId/final-scores')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class FinalScoresController {
  constructor(
    private readonly getFinalScoreUseCase: GetFinalScoreUseCase,
    private readonly deliverFeedbackUseCase: DeliverFeedbackUseCase,
    private readonly requestScoreAdjustmentUseCase: RequestScoreAdjustmentUseCase,
    private readonly approveScoreAdjustmentUseCase: ApproveScoreAdjustmentUseCase,
  ) {}

  @Get('employees/:employeeId')
  @Roles('MANAGER', 'HR_ADMIN')
  @ApiOperation({ summary: 'Get final score for an employee' })
  @ApiResponse({
    status: 200,
    description: 'Final score retrieved successfully',
    type: FinalScoreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Final score not found' })
  async getFinalScore(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
  ): Promise<FinalScoreResponseDto> {
    const result = await this.getFinalScoreUseCase.execute(employeeId, cycleId);

    if (!result) {
      throw new Error('Final score not found');
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      employeeId: result.employeeId,
      weightedScore: result.weightedScore,
      percentageScore: result.percentageScore,
      bonusTier: result.bonusTier,
      feedbackNotes: result.feedbackNotes,
      deliveredAt: result.deliveredAt ? result.deliveredAt.toISOString() : null,
      deliveredBy: result.deliveredBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get my final score' })
  @ApiResponse({
    status: 200,
    description: 'Final score retrieved successfully',
    type: FinalScoreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Final score not found' })
  async getMyFinalScore(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<FinalScoreResponseDto> {
    const result = await this.getFinalScoreUseCase.execute(user.userId, cycleId);

    if (!result) {
      throw new Error('Final score not found');
    }

    return {
      id: result.id,
      cycleId: result.cycleId,
      employeeId: result.employeeId,
      weightedScore: result.weightedScore,
      percentageScore: result.percentageScore,
      bonusTier: result.bonusTier,
      feedbackNotes: result.feedbackNotes,
      deliveredAt: result.deliveredAt ? result.deliveredAt.toISOString() : null,
      deliveredBy: result.deliveredBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post('employees/:employeeId/deliver')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Deliver feedback to employee' })
  @ApiResponse({
    status: 200,
    description: 'Feedback delivered successfully',
    type: FinalScoreResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Final score not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed or already delivered' })
  async deliverFeedback(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: DeliverFeedbackRequestDto,
  ): Promise<FinalScoreResponseDto> {
    // First, get the final score to get the finalScoreId
    const finalScore = await this.getFinalScoreUseCase.execute(employeeId, cycleId);

    if (!finalScore) {
      throw new Error('Final score not found');
    }

    const result = await this.deliverFeedbackUseCase.execute({
      finalScoreId: finalScore.id,
      feedbackNotes: dto.feedbackNotes,
      deliveredBy: user.userId,
    });

    return {
      id: result.id,
      cycleId: result.cycleId,
      employeeId: result.employeeId,
      weightedScore: result.weightedScore,
      percentageScore: result.percentageScore,
      bonusTier: result.bonusTier,
      feedbackNotes: result.feedbackNotes,
      deliveredAt: result.deliveredAt ? result.deliveredAt.toISOString() : null,
      deliveredBy: result.deliveredBy || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post('employees/:employeeId/adjustments')
  @Roles('MANAGER')
  @ApiOperation({ summary: 'Request score adjustment' })
  @ApiResponse({
    status: 201,
    description: 'Score adjustment requested successfully',
    type: ScoreAdjustmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Final score not found' })
  @ApiResponse({ status: 400, description: 'Calibration not locked' })
  async requestScoreAdjustment(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: ScoreAdjustmentRequestDto,
  ): Promise<ScoreAdjustmentResponseDto> {
    const result = await this.requestScoreAdjustmentUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
      proposedScores: dto.proposedScores,
      reason: dto.reason,
    });

    return {
      id: result.id,
      finalScoreId: '',
      previousScore: 0,
      requestedScore: 0,
      reason: result.reason,
      status: result.status,
      requestedBy: user.userId,
      reviewedBy: null,
      reviewNotes: null,
      requestedAt: result.requestedAt.toISOString(),
      reviewedAt: null,
    };
  }

  @Post('adjustments/:adjustmentId/approve')
  @Roles('HR_ADMIN')
  @ApiOperation({ summary: 'Approve score adjustment request' })
  @ApiResponse({
    status: 200,
    description: 'Score adjustment approved successfully',
    type: ScoreAdjustmentResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Adjustment request not found' })
  async approveScoreAdjustment(
    @Param('adjustmentId') adjustmentId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() body: { reviewNotes?: string; approved: boolean },
  ): Promise<ScoreAdjustmentResponseDto> {
    const result = await this.approveScoreAdjustmentUseCase.execute({
      requestId: adjustmentId,
      reviewedBy: user.userId,
      approved: body.approved,
      reviewNotes: body.reviewNotes,
    });

    return {
      id: result.id,
      finalScoreId: '',
      previousScore: 0,
      requestedScore: 0,
      reason: '',
      status: result.status,
      requestedBy: '',
      reviewedBy: result.reviewedBy || null,
      reviewNotes: body.reviewNotes || null,
      requestedAt: new Date().toISOString(),
      reviewedAt: result.reviewedAt.toISOString(),
    };
  }
}
