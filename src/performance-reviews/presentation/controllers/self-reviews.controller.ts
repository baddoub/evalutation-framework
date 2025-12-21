import {
  Controller,
  Get,
  Patch,
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
import {
  UpdateSelfReviewRequestDto,
  SelfReviewResponseDto,
} from '../dto/self-review.dto';
import { GetMySelfReviewUseCase } from '../../application/use-cases/self-reviews/get-my-self-review.use-case';
import { UpdateSelfReviewUseCase } from '../../application/use-cases/self-reviews/update-self-review.use-case';
import { SubmitSelfReviewUseCase } from '../../application/use-cases/self-reviews/submit-self-review.use-case';
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { PillarScore } from '../../domain/value-objects/pillar-score.vo';
import { Narrative } from '../../domain/value-objects/narrative.vo';

@ApiTags('Self Reviews')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId/self-reviews')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class SelfReviewsController {
  constructor(
    private readonly getMySelfReviewUseCase: GetMySelfReviewUseCase,
    private readonly updateSelfReviewUseCase: UpdateSelfReviewUseCase,
    private readonly submitSelfReviewUseCase: SubmitSelfReviewUseCase,
  ) {}

  @Get('me')
  @ApiOperation({ summary: 'Get my self-review for a cycle' })
  @ApiResponse({
    status: 200,
    description: 'Self-review retrieved successfully',
    type: SelfReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Self-review not found' })
  async getMySelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<SelfReviewResponseDto> {
    const result = await this.getMySelfReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
    });

    return {
      id: result.id,
      cycleId: result.cycleId,
      userId: result.userId,
      projectImpact: result.scores.projectImpact,
      direction: result.scores.direction,
      engineeringExcellence: result.scores.engineeringExcellence,
      operationalOwnership: result.scores.operationalOwnership,
      peopleImpact: result.scores.peopleImpact,
      narrative: result.narrative,
      status: result.status,
      submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update my self-review' })
  @ApiResponse({
    status: 200,
    description: 'Self-review updated successfully',
    type: SelfReviewResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Self-review not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed or invalid status' })
  async updateMySelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: UpdateSelfReviewRequestDto,
  ): Promise<SelfReviewResponseDto> {
    const scores: any = {};
    if (dto.projectImpact !== undefined) scores.projectImpact = PillarScore.fromValue(dto.projectImpact);
    if (dto.direction !== undefined) scores.direction = PillarScore.fromValue(dto.direction);
    if (dto.engineeringExcellence !== undefined) scores.engineeringExcellence = PillarScore.fromValue(dto.engineeringExcellence);
    if (dto.operationalOwnership !== undefined) scores.operationalOwnership = PillarScore.fromValue(dto.operationalOwnership);
    if (dto.peopleImpact !== undefined) scores.peopleImpact = PillarScore.fromValue(dto.peopleImpact);

    const result = await this.updateSelfReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
      scores: Object.keys(scores).length > 0 ? scores : undefined,
      narrative: dto.narrative ? Narrative.fromText(dto.narrative) : undefined,
    });

    return {
      id: result.id,
      cycleId: result.cycleId,
      userId: result.userId,
      projectImpact: result.scores.projectImpact,
      direction: result.scores.direction,
      engineeringExcellence: result.scores.engineeringExcellence,
      operationalOwnership: result.scores.operationalOwnership,
      peopleImpact: result.scores.peopleImpact,
      narrative: result.narrative,
      status: result.status,
      submittedAt: result.submittedAt ? result.submittedAt.toISOString() : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post('me/submit')
  @ApiOperation({ summary: 'Submit my self-review' })
  @ApiResponse({
    status: 200,
    description: 'Self-review submitted successfully',
  })
  @ApiResponse({ status: 404, description: 'Self-review not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed' })
  async submitMySelfReview(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<{ id: string; status: string; submittedAt: string }> {
    const result = await this.submitSelfReviewUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      userId: UserId.fromString(user.userId),
    });

    return {
      id: result.id,
      status: result.status,
      submittedAt: result.submittedAt.toISOString(),
    };
  }
}
