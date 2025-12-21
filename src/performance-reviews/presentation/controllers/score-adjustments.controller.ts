import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  UseFilters,
  HttpCode,
  HttpStatus,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { Roles } from '../decorators/roles.decorator'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import {
  ScoreAdjustmentRequestDto,
  ScoreAdjustmentResponseDto,
} from '../dto/final-score.dto'
import { RequestScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/request-score-adjustment.use-case'
import { ReviewScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/review-score-adjustment.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../../auth/domain/value-objects/user-id.vo'

@ApiTags('Score Adjustments')
@ApiBearerAuth()
@Controller('performance-reviews/score-adjustments')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class ScoreAdjustmentsController {
  constructor(
    private readonly requestScoreAdjustmentUseCase: RequestScoreAdjustmentUseCase,
    private readonly reviewScoreAdjustmentUseCase: ReviewScoreAdjustmentUseCase,
  ) {}

  @Post(':cycleId/employees/:employeeId/request')
  @Roles('MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Request a score adjustment for an employee' })
  @ApiResponse({
    status: 201,
    description: 'Score adjustment request created successfully',
    type: ScoreAdjustmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  @ApiResponse({ status: 404, description: 'Employee or cycle not found' })
  @ApiResponse({ status: 400, description: 'Invalid request - scores not locked yet' })
  async requestScoreAdjustment(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: ScoreAdjustmentRequestDto,
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<ScoreAdjustmentResponseDto> {
    const result = await this.requestScoreAdjustmentUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(currentUser.userId),
      reason: dto.reason,
      proposedScores: {
        projectImpact: dto.proposedScores.projectImpact,
        direction: dto.proposedScores.direction,
        engineeringExcellence: dto.proposedScores.engineeringExcellence,
        operationalOwnership: dto.proposedScores.operationalOwnership,
        peopleImpact: dto.proposedScores.peopleImpact,
      },
    })

    return {
      id: result.id,
      finalScoreId: employeeId, // The final score ID would be the same as employee ID in the context
      previousScore: 0, // Would need to be fetched from the use case
      requestedScore: dto.newWeightedScore,
      reason: result.reason,
      status: result.status,
      requestedBy: currentUser.userId,
      requestedAt: result.requestedAt.toISOString(),
      reviewedAt: null,
      reviewNotes: null,
      reviewedBy: null,
    }
  }

  @Post(':requestId/review')
  @Roles('HR_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Approve or reject a score adjustment request' })
  @ApiResponse({
    status: 200,
    description: 'Score adjustment request reviewed successfully',
    type: ScoreAdjustmentResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async reviewScoreAdjustment(
    @Param('requestId') requestId: string,
    @Body() dto: { action: 'APPROVED' | 'REJECTED'; rejectionReason?: string },
    @CurrentUser() currentUser: CurrentUserData,
  ): Promise<ScoreAdjustmentResponseDto> {
    const result = await this.reviewScoreAdjustmentUseCase.execute({
      requestId,
      action: dto.action,
      approverId: UserId.fromString(currentUser.userId),
      rejectionReason: dto.rejectionReason,
    })

    return {
      id: result.id,
      finalScoreId: '', // Would need to be fetched from the request
      previousScore: 0, // Would need to be fetched
      requestedScore: 0, // Would need to be fetched
      reason: '', // Would need to be fetched
      status: result.status,
      requestedBy: '', // Would need to be fetched
      requestedAt: '', // Would need to be fetched
      reviewedAt: result.reviewedAt.toISOString(),
      reviewNotes: dto.rejectionReason || 'Approved',
      reviewedBy: result.approvedBy,
    }
  }
}
