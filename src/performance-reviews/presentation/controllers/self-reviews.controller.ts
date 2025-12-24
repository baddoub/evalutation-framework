import {
  Controller,
  Get,
  Put,
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
import { UpdateSelfReviewDto } from '../dto/requests/update-self-review.dto'
import { SelfReviewResponseDto } from '../dto/responses/self-review-response.dto'
import { GetMySelfReviewUseCase } from '../../application/use-cases/self-reviews/get-my-self-review.use-case'
import { UpdateSelfReviewUseCase } from '../../application/use-cases/self-reviews/update-self-review.use-case'
import { SubmitSelfReviewUseCase } from '../../application/use-cases/self-reviews/submit-self-review.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'
import { Narrative } from '../../domain/value-objects/narrative.vo'

@ApiTags('Self Reviews')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class SelfReviewsController {
  constructor(
    private readonly getMySelfReviewUseCase: GetMySelfReviewUseCase,
    private readonly updateSelfReviewUseCase: UpdateSelfReviewUseCase,
    private readonly submitSelfReviewUseCase: SubmitSelfReviewUseCase,
  ) {}

  @Get('self-review')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get my self-review for a cycle',
    description:
      "Retrieve the current user's self-review for a specific review cycle, including scores and narrative",
  })
  @ApiResponse({
    status: 200,
    description: 'Self-review retrieved successfully',
    type: SelfReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Self-review not found for this cycle' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMySelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SelfReviewResponseDto> {
    const result = await this.getMySelfReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
    })

    return {
      id: result.id,
      cycleId: result.cycleId,
      status: result.status,
      scores: {
        projectImpact: result.scores.projectImpact,
        direction: result.scores.direction,
        engineeringExcellence: result.scores.engineeringExcellence,
        operationalOwnership: result.scores.operationalOwnership,
        peopleImpact: result.scores.peopleImpact,
      },
      narrative: result.narrative,
      wordCount: result.narrative ? result.narrative.split(' ').length : 0,
      submittedAt: result.submittedAt ? result.submittedAt.toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Put('self-review')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Create/Update self-review',
    description:
      "Create or update a self-review with scores for Meta's 5 pillars and a narrative describing accomplishments",
  })
  @ApiResponse({
    status: 200,
    description: 'Self-review updated successfully',
    type: SelfReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Self-review not found' })
  @ApiResponse({ status: 400, description: 'Validation failed or deadline passed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateMySelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateSelfReviewDto,
  ): Promise<SelfReviewResponseDto> {
    // Pass raw numbers to use case - it will create value objects
    const scores: any = {}
    if (dto.scores.projectImpact !== undefined)
      scores.projectImpact = dto.scores.projectImpact
    if (dto.scores.direction !== undefined)
      scores.direction = dto.scores.direction
    if (dto.scores.engineeringExcellence !== undefined)
      scores.engineeringExcellence = dto.scores.engineeringExcellence
    if (dto.scores.operationalOwnership !== undefined)
      scores.operationalOwnership = dto.scores.operationalOwnership
    if (dto.scores.peopleImpact !== undefined)
      scores.peopleImpact = dto.scores.peopleImpact

    const result = await this.updateSelfReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
      scores: Object.keys(scores).length > 0 ? scores : undefined,
      narrative: dto.narrative ? Narrative.fromText(dto.narrative) : undefined,
    })

    return {
      id: result.id,
      cycleId: result.cycleId,
      status: result.status,
      scores: {
        projectImpact: result.scores.projectImpact,
        direction: result.scores.direction,
        engineeringExcellence: result.scores.engineeringExcellence,
        operationalOwnership: result.scores.operationalOwnership,
        peopleImpact: result.scores.peopleImpact,
      },
      narrative: result.narrative,
      wordCount: result.narrative ? result.narrative.split(' ').length : 0,
      submittedAt: result.submittedAt ? result.submittedAt.toISOString() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  @Post('self-review/submit')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Submit self-review',
    description:
      'Submit the self-review for final processing. Once submitted, the review cannot be edited unless deadline allows',
  })
  @ApiResponse({
    status: 200,
    description: 'Self-review submitted successfully',
  })
  @ApiResponse({ status: 404, description: 'Self-review not found' })
  @ApiResponse({ status: 400, description: 'Cannot submit incomplete self-review' })
  @ApiResponse({ status: 403, description: 'Self-review deadline has passed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitMySelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ id: string; status: string; submittedAt: string }> {
    const result = await this.submitSelfReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
    })

    return {
      id: result.id,
      status: result.status,
      submittedAt: result.submittedAt.toISOString(),
    }
  }
}
