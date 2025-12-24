import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { RequiresReviewRole } from '../decorators/requires-review-role.decorator'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import { RequestScoreAdjustmentDto } from '../dto/requests/request-score-adjustment.dto'
import { ReviewScoreAdjustmentDto } from '../dto/requests/review-score-adjustment.dto'
import { RequestScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/request-score-adjustment.use-case'
import { ReviewScoreAdjustmentUseCase } from '../../application/use-cases/score-adjustments/review-score-adjustment.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Score Adjustments')
@ApiBearerAuth()
@Controller('performance-reviews')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class ScoreAdjustmentsController {
  constructor(
    private readonly requestScoreAdjustmentUseCase: RequestScoreAdjustmentUseCase,
    private readonly reviewScoreAdjustmentUseCase: ReviewScoreAdjustmentUseCase,
  ) {}

  @Post('cycles/:cycleId/employees/:employeeId/adjustment-request')
  @RequiresReviewRole('MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiParam({ name: 'employeeId', description: 'Employee user ID', example: 'user-uuid-456' })
  @ApiOperation({
    summary: 'Request score adjustment',
    description: 'Manager requests adjustment to locked scores with justification',
  })
  @ApiResponse({
    status: 201,
    description: 'Score adjustment request created successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  @ApiResponse({ status: 404, description: 'Employee or cycle not found' })
  @ApiResponse({ status: 400, description: 'Invalid request - scores not locked yet' })
  async requestScoreAdjustment(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @Body() dto: RequestScoreAdjustmentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
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
      employeeId,
      status: result.status,
      reason: result.reason,
      requestedAt: result.requestedAt.toISOString(),
    }
  }

  @Get('adjustment-requests')
  @RequiresReviewRole('HR_ADMIN')
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'APPROVED', 'REJECTED'],
    description: 'Filter by request status',
  })
  @ApiOperation({
    summary: 'Get pending adjustment requests (HR_ADMIN)',
    description: 'Retrieve all score adjustment requests for HR review',
  })
  @ApiResponse({
    status: 200,
    description: 'Adjustment requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  async getPendingAdjustmentRequests() {
    // Note: This would require a GetPendingAdjustmentRequestsUseCase to be implemented
    return {
      requests: [],
    }
  }

  @Post('adjustment-requests/:requestId/review')
  @RequiresReviewRole('HR_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'requestId',
    description: 'Score adjustment request ID',
    example: 'request-uuid-xyz',
  })
  @ApiOperation({
    summary: 'Approve/Reject adjustment request',
    description: "HR Admin approves or rejects a manager's score adjustment request",
  })
  @ApiResponse({
    status: 200,
    description: 'Score adjustment request reviewed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  @ApiResponse({ status: 404, description: 'Request not found' })
  @ApiResponse({ status: 400, description: 'Request already reviewed' })
  async reviewScoreAdjustment(
    @Param('requestId') requestId: string,
    @Body() dto: ReviewScoreAdjustmentDto,
    @CurrentUser() currentUser: CurrentUserData,
  ) {
    const result = await this.reviewScoreAdjustmentUseCase.execute({
      requestId,
      action: dto.action,
      approverId: UserId.fromString(currentUser.userId),
      rejectionReason: dto.rejectionReason,
    })

    return {
      id: result.id,
      status: result.status,
      reviewedAt: result.reviewedAt.toISOString(),
      approvedBy: result.approvedBy,
    }
  }
}
