import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
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
import { CreateReviewCycleDto } from '../dto/requests/create-review-cycle.dto'
import { ReviewCycleResponseDto } from '../dto/responses/review-cycle-response.dto'
import { CreateReviewCycleUseCase } from '../../application/use-cases/review-cycles/create-review-cycle.use-case'
import { StartReviewCycleUseCase } from '../../application/use-cases/review-cycles/start-review-cycle.use-case'
import { GetActiveCycleUseCase } from '../../application/use-cases/review-cycles/get-active-cycle.use-case'

@ApiTags('Review Cycles')
@ApiBearerAuth()
@Controller('performance-reviews/cycles')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class ReviewCyclesController {
  constructor(
    private readonly createReviewCycleUseCase: CreateReviewCycleUseCase,
    private readonly startReviewCycleUseCase: StartReviewCycleUseCase,
    private readonly getActiveCycleUseCase: GetActiveCycleUseCase,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'List review cycles',
    description: 'Retrieve a paginated list of review cycles with optional filters',
  })
  @ApiQuery({
    name: 'year',
    required: false,
    type: Number,
    description: 'Filter by year',
    example: 2025,
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['DRAFT', 'ACTIVE', 'CALIBRATION', 'COMPLETED'],
    description: 'Filter by status',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Offset for pagination',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Review cycles retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async listReviewCycles(@Query('limit') limit = 20, @Query('offset') offset = 0) {
    // Note: This would require a ListReviewCyclesUseCase to be implemented
    // For now, returning mock structure based on contract
    return {
      cycles: [],
      total: 0,
      limit,
      offset,
    }
  }

  @Get('active')
  @ApiOperation({
    summary: 'Get active review cycle',
    description:
      'Retrieve the currently active review cycle with all deadlines and status information',
  })
  @ApiResponse({
    status: 200,
    description: 'Active review cycle retrieved successfully',
    type: ReviewCycleResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No active review cycle' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getActiveReviewCycle(): Promise<ReviewCycleResponseDto> {
    const result = await this.getActiveCycleUseCase.execute()

    if (!result) {
      throw new Error('No active review cycle')
    }

    return {
      id: result.id,
      name: result.name,
      year: result.year,
      status: result.status,
      deadlines: {
        selfReview: result.deadlines.selfReview.toISOString(),
        peerFeedback: result.deadlines.peerFeedback.toISOString(),
        managerEval: result.deadlines.managerEvaluation.toISOString(),
        calibration: result.deadlines.calibration.toISOString(),
        feedbackDelivery: result.deadlines.feedbackDelivery.toISOString(),
      },
      startDate: result.startDate.toISOString(),
      endDate: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Post()
  @RequiresReviewRole('HR_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new review cycle (Admin Only)',
    description: 'Create a new performance review cycle with defined deadlines for each phase',
  })
  @ApiResponse({
    status: 201,
    description: 'Review cycle created successfully',
    type: ReviewCycleResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  async createReviewCycle(@Body() dto: CreateReviewCycleDto): Promise<ReviewCycleResponseDto> {
    const result = await this.createReviewCycleUseCase.execute({
      name: dto.name,
      year: dto.year,
      deadlines: {
        selfReview: new Date(dto.deadlines.selfReview),
        peerFeedback: new Date(dto.deadlines.peerFeedback),
        managerEvaluation: new Date(dto.deadlines.managerEval),
        calibration: new Date(dto.deadlines.calibration),
        feedbackDelivery: new Date(dto.deadlines.feedbackDelivery),
      },
    })

    return {
      id: result.id,
      name: result.name,
      year: result.year,
      status: result.status,
      deadlines: {
        selfReview: result.deadlines.selfReview.toISOString(),
        peerFeedback: result.deadlines.peerFeedback.toISOString(),
        managerEval: result.deadlines.managerEvaluation.toISOString(),
        calibration: result.deadlines.calibration.toISOString(),
        feedbackDelivery: result.deadlines.feedbackDelivery.toISOString(),
      },
      startDate: result.startDate ? result.startDate.toISOString() : '',
      endDate: undefined,
      createdAt: result.createdAt.toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Post(':cycleId/start')
  @RequiresReviewRole('HR_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Start review cycle (Admin Only)',
    description: 'Activates a review cycle, making it available for employees to submit reviews',
  })
  @ApiResponse({
    status: 200,
    description: 'Review cycle started successfully',
  })
  @ApiResponse({ status: 404, description: 'Review cycle not found' })
  @ApiResponse({ status: 400, description: 'Invalid cycle status for start' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - HR Admin only' })
  async startReviewCycle(@Param('cycleId') cycleId: string) {
    const result = await this.startReviewCycleUseCase.execute({ cycleId })

    return {
      id: result.id,
      status: result.status,
      startedAt: result.startedAt.toISOString(),
    }
  }
}
