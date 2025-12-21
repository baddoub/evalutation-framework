import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  UseFilters,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { Roles } from '../decorators/roles.decorator'
import {
  CreateReviewCycleRequestDto,
  ReviewCycleResponseDto,
} from '../dto/review-cycle.dto'
import { CreateReviewCycleUseCase } from '../../application/use-cases/review-cycles/create-review-cycle.use-case'
import { ActivateReviewCycleUseCase } from '../../application/use-cases/review-cycles/activate-review-cycle.use-case'
import { GetReviewCycleUseCase } from '../../application/use-cases/review-cycles/get-review-cycle.use-case'

@ApiTags('Review Cycles')
@ApiBearerAuth()
@Controller('performance-reviews/cycles')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class ReviewCyclesController {
  constructor(
    private readonly createReviewCycleUseCase: CreateReviewCycleUseCase,
    private readonly activateReviewCycleUseCase: ActivateReviewCycleUseCase,
    private readonly getReviewCycleUseCase: GetReviewCycleUseCase,
  ) {}

  @Post()
  @Roles('HR_ADMIN')
  @ApiOperation({ summary: 'Create a new review cycle' })
  @ApiResponse({
    status: 201,
    description: 'Review cycle created successfully',
    type: ReviewCycleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  async createReviewCycle(
    @Body() dto: CreateReviewCycleRequestDto,
  ): Promise<ReviewCycleResponseDto> {
    const result = await this.createReviewCycleUseCase.execute({
      name: dto.name,
      year: dto.year,
      deadlines: {
        selfReview: new Date(dto.selfReviewDeadline),
        peerFeedback: new Date(dto.peerFeedbackDeadline),
        managerEvaluation: new Date(dto.managerEvalDeadline),
        calibration: new Date(dto.calibrationDeadline),
        feedbackDelivery: new Date(dto.feedbackDeliveryDeadline),
      },
    })

    return {
      id: result.id,
      name: result.name,
      year: result.year,
      status: result.status as any,
      selfReviewDeadline: result.deadlines.selfReview.toISOString(),
      peerFeedbackDeadline: result.deadlines.peerFeedback.toISOString(),
      managerEvalDeadline: result.deadlines.managerEvaluation.toISOString(),
      calibrationDeadline: result.deadlines.calibration.toISOString(),
      feedbackDeliveryDeadline: result.deadlines.feedbackDelivery.toISOString(),
      createdAt: result.createdAt.toISOString(),
      updatedAt: result.createdAt.toISOString(),
    }
  }

  @Get(':cycleId')
  @ApiOperation({ summary: 'Get review cycle by ID' })
  @ApiResponse({
    status: 200,
    description: 'Review cycle retrieved successfully',
    type: ReviewCycleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  async getReviewCycle(@Param('cycleId') cycleId: string): Promise<ReviewCycleResponseDto> {
    const result = await this.getReviewCycleUseCase.execute(cycleId)

    return {
      id: result.id,
      name: result.name,
      year: result.year,
      status: result.status as any,
      selfReviewDeadline: result.deadlines.selfReview.toISOString(),
      peerFeedbackDeadline: result.deadlines.peerFeedback.toISOString(),
      managerEvalDeadline: result.deadlines.managerEvaluation.toISOString(),
      calibrationDeadline: result.deadlines.calibration.toISOString(),
      feedbackDeliveryDeadline: result.deadlines.feedbackDelivery.toISOString(),
      createdAt: result.startDate.toISOString(),
      updatedAt: result.startDate.toISOString(),
    }
  }

  @Post(':cycleId/activate')
  @Roles('HR_ADMIN')
  @ApiOperation({ summary: 'Activate a review cycle' })
  @ApiResponse({
    status: 200,
    description: 'Review cycle activated successfully',
    type: ReviewCycleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  @ApiResponse({ status: 400, description: 'Invalid cycle status for activation' })
  async activateReviewCycle(@Param('cycleId') cycleId: string): Promise<ReviewCycleResponseDto> {
    const activateResult = await this.activateReviewCycleUseCase.execute(cycleId)

    // Get full cycle details after activation
    const result = await this.getReviewCycleUseCase.execute(cycleId)

    return {
      id: result.id,
      name: result.name,
      year: result.year,
      status: activateResult.status as any,
      selfReviewDeadline: result.deadlines.selfReview.toISOString(),
      peerFeedbackDeadline: result.deadlines.peerFeedback.toISOString(),
      managerEvalDeadline: result.deadlines.managerEvaluation.toISOString(),
      calibrationDeadline: result.deadlines.calibration.toISOString(),
      feedbackDeliveryDeadline: result.deadlines.feedbackDelivery.toISOString(),
      createdAt: result.startDate.toISOString(),
      updatedAt: activateResult.activatedAt.toISOString(),
    }
  }
}
