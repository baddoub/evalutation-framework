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
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import { RequiresReviewRole } from '../decorators/requires-review-role.decorator'
import { SubmitManagerEvaluationDto } from '../dto/requests/submit-manager-evaluation.dto'
import { GetTeamReviewsUseCase } from '../../application/use-cases/manager-evaluations/get-team-reviews.use-case'
import { GetEmployeeReviewUseCase } from '../../application/use-cases/manager-evaluations/get-employee-review.use-case'
import { SubmitManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/submit-manager-evaluation.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Manager Evaluations')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class ManagerEvaluationsController {
  constructor(
    private readonly getTeamReviewsUseCase: GetTeamReviewsUseCase,
    private readonly getEmployeeReviewUseCase: GetEmployeeReviewUseCase,
    private readonly submitManagerEvaluationUseCase: SubmitManagerEvaluationUseCase,
  ) {}

  @Get('team-reviews')
  @RequiresReviewRole('MANAGER')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get team reviews (Manager Only)',
    description: 'Retrieve all direct reports and their review completion status for the cycle',
  })
  @ApiResponse({
    status: 200,
    description: 'Team reviews retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  async getTeamReviews(@Param('cycleId') cycleId: string, @CurrentUser() user: CurrentUserData) {
    const result = await this.getTeamReviewsUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      managerId: UserId.fromString(user.userId),
    })

    return {
      reviews: result.reviews.map((review) => ({
        employeeId: review.employeeId,
        employeeName: review.employeeName,
        employeeLevel: review.employeeLevel,
        selfReviewStatus: review.selfReviewStatus,
        peerFeedbackCount: review.peerFeedbackCount,
        peerFeedbackStatus: review.peerFeedbackStatus,
        managerEvalStatus: review.managerEvalStatus,
        hasSubmittedEvaluation: review.hasSubmittedEvaluation,
      })),
      total: result.total,
    }
  }

  @Get('employees/:employeeId/review')
  @RequiresReviewRole('MANAGER', 'HR_ADMIN')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiParam({ name: 'employeeId', description: 'Employee user ID', example: 'user-uuid-456' })
  @ApiOperation({
    summary: 'Get employee review details (Manager Only)',
    description:
      'Retrieve comprehensive review data for an employee including self-review, peer feedback, and manager evaluation',
  })
  @ApiResponse({
    status: 200,
    description: 'Employee review details retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager or HR Admin only' })
  @ApiResponse({ status: 404, description: 'Employee review not found' })
  async getEmployeeReview(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.getEmployeeReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
    })

    return {
      employee: {
        id: result.employee.id,
        name: result.employee.name,
        email: result.employee.email,
        level: result.employee.level,
        department: result.employee.department,
      },
      selfReview: result.selfReview
        ? {
            scores: result.selfReview.scores,
            narrative: result.selfReview.narrative,
            submittedAt: result.selfReview.submittedAt,
          }
        : null,
      peerFeedback: {
        count: result.peerFeedback.count,
        aggregatedScores: result.peerFeedback.aggregatedScores,
        attributedFeedback: result.peerFeedback.attributedFeedback,
      },
      managerEvaluation: result.managerEvaluation
        ? {
            id: result.managerEvaluation.id,
            status: result.managerEvaluation.status,
            scores: result.managerEvaluation.scores,
            narrative: result.managerEvaluation.narrative,
          }
        : null,
    }
  }

  @Post('employees/:employeeId/evaluation')
  @RequiresReviewRole('MANAGER')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiParam({ name: 'employeeId', description: 'Employee user ID', example: 'user-uuid-456' })
  @ApiOperation({
    summary: 'Submit manager evaluation',
    description:
      "Submit manager's evaluation of a direct report including scores, strengths, growth areas, and development plan",
  })
  @ApiResponse({
    status: 201,
    description: 'Manager evaluation submitted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Manager only' })
  @ApiResponse({ status: 404, description: 'Employee not found' })
  @ApiResponse({ status: 400, description: 'Validation failed or deadline passed' })
  async submitManagerEvaluation(
    @Param('cycleId') cycleId: string,
    @Param('employeeId') employeeId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubmitManagerEvaluationDto,
  ) {
    const result = await this.submitManagerEvaluationUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      employeeId: UserId.fromString(employeeId),
      managerId: UserId.fromString(user.userId),
      scores: {
        projectImpact: dto.scores.projectImpact,
        direction: dto.scores.direction,
        engineeringExcellence: dto.scores.engineeringExcellence,
        operationalOwnership: dto.scores.operationalOwnership,
        peopleImpact: dto.scores.peopleImpact,
      },
      narrative: dto.narrative,
      strengths: dto.strengths,
      growthAreas: dto.growthAreas,
      developmentPlan: dto.developmentPlan,
    })

    return {
      id: result.id,
      employeeId,
      status: result.status,
      scores: dto.scores,
      submittedAt: result.submittedAt.toISOString(),
    }
  }
}
