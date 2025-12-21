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
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import {
  NominatePeersRequestDto,
  SubmitPeerFeedbackRequestDto,
  PeerNominationResponseDto,
  AggregatedPeerFeedbackResponseDto,
} from '../dto/peer-feedback.dto'
import { NominatePeersUseCase } from '../../application/use-cases/peer-feedback/nominate-peers.use-case'
import { SubmitPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/submit-peer-feedback.use-case'
import { GetAggregatedPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Peer Feedback')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId/peer-feedback')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class PeerFeedbackController {
  constructor(
    private readonly nominatePeersUseCase: NominatePeersUseCase,
    private readonly submitPeerFeedbackUseCase: SubmitPeerFeedbackUseCase,
    private readonly getAggregatedPeerFeedbackUseCase: GetAggregatedPeerFeedbackUseCase,
  ) {}

  @Post('nominations')
  @ApiOperation({ summary: 'Nominate peers for feedback' })
  @ApiResponse({
    status: 201,
    description: 'Peers nominated successfully',
    type: [PeerNominationResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Invalid request or deadline passed' })
  async nominatePeers(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: NominatePeersRequestDto,
  ): Promise<PeerNominationResponseDto[]> {
    const result = await this.nominatePeersUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      nominatorId: UserId.fromString(user.userId),
      nomineeIds: dto.peerIds.map(id => UserId.fromString(id)),
    })

    return result.nominations.map(nom => ({
      id: nom.id,
      cycleId,
      nomineeId: nom.nomineeId,
      peerId: nom.nomineeId,
      peerEmail: 'peer@example.com', // Would need to fetch from user service
      peerName: nom.nomineeName,
      status: nom.status,
      submittedAt: null,
    }))
  }

  @Post('reviewees/:revieweeId/submit')
  @ApiOperation({ summary: 'Submit peer feedback' })
  @ApiResponse({
    status: 201,
    description: 'Peer feedback submitted successfully',
  })
  @ApiResponse({ status: 404, description: 'Reviewee not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed or already submitted' })
  async submitPeerFeedback(
    @Param('cycleId') cycleId: string,
    @Param('revieweeId') revieweeId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubmitPeerFeedbackRequestDto,
  ): Promise<{ id: string; submittedAt: string }> {
    const result = await this.submitPeerFeedbackUseCase.execute({
      revieweeId: UserId.fromString(revieweeId),
      reviewerId: UserId.fromString(user.userId),
      cycleId: ReviewCycleId.fromString(cycleId),
      scores: {
        projectImpact: dto.projectImpact,
        direction: dto.direction,
        engineeringExcellence: dto.engineeringExcellence,
        operationalOwnership: dto.operationalOwnership,
        peopleImpact: dto.peopleImpact,
      },
      generalComments: dto.comments,
    })

    return {
      id: result.id,
      submittedAt: result.submittedAt.toISOString(),
    }
  }

  @Get('aggregated')
  @ApiOperation({ summary: 'Get aggregated peer feedback for current user' })
  @ApiResponse({
    status: 200,
    description: 'Aggregated peer feedback retrieved successfully',
    type: AggregatedPeerFeedbackResponseDto,
  })
  @ApiResponse({ status: 404, description: 'No feedback found' })
  async getAggregatedPeerFeedback(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ): Promise<AggregatedPeerFeedbackResponseDto> {
    const result = await this.getAggregatedPeerFeedbackUseCase.execute(
      user.userId,
      cycleId,
    )

    return {
      avgProjectImpact: result.aggregatedScores.projectImpact,
      avgDirection: result.aggregatedScores.direction,
      avgEngineeringExcellence: result.aggregatedScores.engineeringExcellence,
      avgOperationalOwnership: result.aggregatedScores.operationalOwnership,
      avgPeopleImpact: result.aggregatedScores.peopleImpact,
      totalResponses: result.feedbackCount,
      anonymousComments: result.anonymizedComments.map(c =>
        [c.pillar, c.comment].filter(Boolean).join(': ')
      ),
    }
  }
}
