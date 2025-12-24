import {
  Controller,
  Get,
  Post,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import { RequiresReviewRole } from '../decorators/requires-review-role.decorator'
import { GetMyFinalScoreUseCase } from '../../application/use-cases/final-scores/get-my-final-score.use-case'
import { GetTeamFinalScoresUseCase } from '../../application/use-cases/final-scores/get-team-final-scores.use-case'
import { MarkFeedbackDeliveredUseCase } from '../../application/use-cases/final-scores/mark-feedback-delivered.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Final Scores')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class FinalScoresController {
  constructor(
    private readonly getMyFinalScoreUseCase: GetMyFinalScoreUseCase,
    private readonly getTeamFinalScoresUseCase: GetTeamFinalScoresUseCase,
    private readonly markFeedbackDeliveredUseCase: MarkFeedbackDeliveredUseCase,
  ) {}

  @Get('my-score')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get my final score',
    description:
      'Retrieve your final performance score, bonus tier, and peer feedback summary after scores are locked',
  })
  @ApiResponse({
    status: 200,
    description: 'Final score retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Final score not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyFinalScore(@Param('cycleId') cycleId: string, @CurrentUser() user: CurrentUserData) {
    const result = await this.getMyFinalScoreUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
    })

    return {
      employee: {
        id: result.employee.id,
        name: result.employee.name,
        level: result.employee.level,
      },
      cycle: {
        id: result.cycle.id,
        name: result.cycle.name,
        year: result.cycle.year,
      },
      scores: result.scores,
      peerFeedbackSummary: result.peerFeedbackSummary
        ? {
            averageScores: result.peerFeedbackSummary.averageScores,
            count: result.peerFeedbackSummary.count,
          }
        : undefined,
      weightedScore: result.weightedScore,
      percentageScore: result.percentageScore,
      bonusTier: result.bonusTier,
      isLocked: result.isLocked,
      feedbackDelivered: result.feedbackDelivered,
      feedbackDeliveredAt: result.feedbackDeliveredAt
        ? result.feedbackDeliveredAt.toISOString()
        : null,
    }
  }

  @Get('team-scores')
  @RequiresReviewRole('MANAGER')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get team final scores (Manager)',
    description: 'View final scores and bonus tiers for all direct reports',
  })
  @ApiResponse({
    status: 200,
    description: 'Team final scores retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  async getTeamFinalScores(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.getTeamFinalScoresUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      managerId: UserId.fromString(user.userId),
    })

    return {
      teamScores: result.teamScores.map((score) => ({
        employeeId: score.employeeId,
        employeeName: score.employeeName,
        level: score.level,
        weightedScore: score.weightedScore,
        percentageScore: score.percentageScore,
        bonusTier: score.bonusTier,
        feedbackDelivered: score.feedbackDelivered,
      })),
    }
  }

  @Post('employees/:employeeId/feedback-delivered')
  @RequiresReviewRole('MANAGER')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiParam({ name: 'employeeId', description: 'Employee user ID', example: 'user-uuid-456' })
  @ApiOperation({
    summary: 'Mark feedback delivered',
    description:
      'Mark that performance feedback has been delivered to the employee in a 1-on-1 meeting',
  })
  @ApiResponse({
    status: 200,
    description: 'Feedback marked as delivered successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  async markFeedbackDelivered(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.markFeedbackDeliveredUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
    })

    return {
      employeeId,
      feedbackDelivered: true,
      feedbackDeliveredAt: result.feedbackDeliveredAt.toISOString(),
    }
  }
}
