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
  Inject,
  BadRequestException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam } from '@nestjs/swagger'
import { validate as isValidUUID } from 'uuid'
import { JwtAuthGuard } from '../../../auth/presentation/guards/jwt-auth.guard'
import { ReviewAuthorizationGuard } from '../guards/review-authorization.guard'
import { ReviewExceptionFilter } from '../filters/review-exception.filter'
import { CurrentUser, CurrentUserData } from '../decorators/current-user.decorator'
import { NominatePeersDto } from '../dto/requests/nominate-peers.dto'
import { SubmitPeerFeedbackDto } from '../dto/requests/submit-peer-feedback.dto'
import { NominatePeersUseCase } from '../../application/use-cases/peer-feedback/nominate-peers.use-case'
import { SubmitPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/submit-peer-feedback.use-case'
import { GetAggregatedPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case'
import { GetPeerFeedbackRequestsUseCase } from '../../application/use-cases/peer-feedback/get-peer-feedback-requests.use-case'
import { GetMyNominationsUseCase } from '../../application/use-cases/peer-feedback/get-my-nominations.use-case'
import { IUserRepository } from '../../../auth/domain/repositories/user.repository.interface'
import { Email } from '../../../auth/domain/value-objects/email.vo'
import { ReviewCycleId } from '../../domain/value-objects/review-cycle-id.vo'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Peer Feedback')
@ApiBearerAuth()
@Controller('performance-reviews/cycles/:cycleId')
@UseGuards(JwtAuthGuard, ReviewAuthorizationGuard)
@UseFilters(ReviewExceptionFilter)
export class PeerFeedbackController {
  constructor(
    private readonly nominatePeersUseCase: NominatePeersUseCase,
    private readonly submitPeerFeedbackUseCase: SubmitPeerFeedbackUseCase,
    private readonly getAggregatedPeerFeedbackUseCase: GetAggregatedPeerFeedbackUseCase,
    private readonly getPeerFeedbackRequestsUseCase: GetPeerFeedbackRequestsUseCase,
    private readonly getMyNominationsUseCase: GetMyNominationsUseCase,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  /**
   * Resolve a nominee identifier (email or UUID) to a UserId
   */
  private async resolveNomineeId(identifier: string): Promise<UserId> {
    // If it's a valid UUID, use it directly
    if (isValidUUID(identifier)) {
      return UserId.fromString(identifier)
    }

    // Otherwise, treat it as an email and look up the user
    const email = Email.create(identifier)
    const user = await this.userRepository.findByEmail(email)

    if (!user) {
      throw new BadRequestException(`User with email '${identifier}' not found`)
    }

    return user.id
  }

  @Post('peer-nominations')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Nominate peers',
    description: 'Nominate colleagues to provide peer feedback on your performance',
  })
  @ApiResponse({
    status: 201,
    description: 'Peers nominated successfully',
  })
  @ApiResponse({ status: 400, description: 'Invalid request or deadline passed' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async nominatePeers(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: NominatePeersDto,
  ) {
    // Resolve all nominee identifiers (emails or UUIDs) to UserIds
    const nomineeIds = await Promise.all(dto.nomineeIds.map((id) => this.resolveNomineeId(id)))

    const result = await this.nominatePeersUseCase.execute({
      cycleId: ReviewCycleId.fromString(cycleId),
      nominatorId: UserId.fromString(user.userId),
      nomineeIds,
    })

    return {
      nominations: result.nominations.map((nom) => ({
        id: nom.id,
        nomineeId: nom.nomineeId,
        nomineeName: nom.nomineeName,
        status: nom.status,
        nominatedAt: new Date().toISOString(),
      })),
    }
  }

  @Get('peer-nominations/mine')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get my peer nominations',
    description: 'Get list of peers you have nominated to provide feedback on you',
  })
  @ApiResponse({
    status: 200,
    description: 'Peer nominations retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getMyNominations(@Param('cycleId') cycleId: string, @CurrentUser() user: CurrentUserData) {
    const result = await this.getMyNominationsUseCase.execute({
      nominatorId: UserId.fromString(user.userId),
      cycleId: ReviewCycleId.fromString(cycleId),
    })

    return {
      nominations: result.nominations.map((nom) => ({
        id: nom.id,
        nomineeId: nom.nomineeId,
        nomineeName: nom.nomineeName,
        nomineeEmail: nom.nomineeEmail,
        status: nom.status,
        nominatedAt: nom.nominatedAt.toISOString(),
      })),
      total: result.total,
    }
  }

  @Get('peer-feedback/requests')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get peer feedback requests (As Reviewer)',
    description: 'Get list of colleagues who have nominated you to provide peer feedback',
  })
  @ApiResponse({
    status: 200,
    description: 'Peer feedback requests retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPeerFeedbackRequests(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.getPeerFeedbackRequestsUseCase.execute({
      reviewerId: UserId.fromString(user.userId),
      cycleId: ReviewCycleId.fromString(cycleId),
    })

    return {
      requests: result.requests.map((req) => ({
        nominationId: req.nominationId,
        nominatorId: req.nominatorId,
        nominatorName: req.nominatorName,
        nominatorEmail: req.nominatorEmail,
        status: req.status,
        nominatedAt: req.nominatedAt.toISOString(),
        feedbackSubmitted: req.feedbackSubmitted,
      })),
      total: result.total,
    }
  }

  @Post('peer-feedback')
  @HttpCode(HttpStatus.CREATED)
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Submit peer feedback',
    description:
      'Provide anonymous feedback and scores for a colleague who nominated you as a peer reviewer',
  })
  @ApiResponse({
    status: 201,
    description: 'Peer feedback submitted successfully',
  })
  @ApiResponse({ status: 404, description: 'Reviewee not found' })
  @ApiResponse({ status: 400, description: 'Deadline passed or already submitted' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitPeerFeedback(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
    @Body() dto: SubmitPeerFeedbackDto,
  ) {
    const result = await this.submitPeerFeedbackUseCase.execute({
      revieweeId: UserId.fromString(dto.revieweeId),
      reviewerId: UserId.fromString(user.userId),
      cycleId: ReviewCycleId.fromString(cycleId),
      scores: {
        projectImpact: dto.scores.projectImpact,
        direction: dto.scores.direction,
        engineeringExcellence: dto.scores.engineeringExcellence,
        operationalOwnership: dto.scores.operationalOwnership,
        peopleImpact: dto.scores.peopleImpact,
      },
      strengths: dto.strengths,
      growthAreas: dto.growthAreas,
      generalComments: dto.generalComments,
    })

    return {
      id: result.id,
      revieweeId: dto.revieweeId,
      submittedAt: result.submittedAt.toISOString(),
      isAnonymized: true,
    }
  }

  @Get('peer-feedback')
  @ApiParam({ name: 'cycleId', description: 'Review cycle ID', example: 'cycle-uuid-123' })
  @ApiOperation({
    summary: 'Get peer feedback (As Reviewee - Anonymized)',
    description: 'View aggregated, anonymized feedback received from peers',
  })
  @ApiResponse({
    status: 200,
    description: 'Aggregated peer feedback retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'No feedback found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAggregatedPeerFeedback(
    @Param('cycleId') cycleId: string,
    @CurrentUser() user: CurrentUserData,
  ) {
    const result = await this.getAggregatedPeerFeedbackUseCase.execute(user.userId, cycleId)

    return {
      aggregatedScores: {
        projectImpact: result.aggregatedScores.projectImpact,
        direction: result.aggregatedScores.direction,
        engineeringExcellence: result.aggregatedScores.engineeringExcellence,
        operationalOwnership: result.aggregatedScores.operationalOwnership,
        peopleImpact: result.aggregatedScores.peopleImpact,
      },
      feedbackCount: result.feedbackCount,
      anonymizedComments: result.anonymizedComments.map((c) => ({
        pillar: c.pillar,
        comment: c.comment,
      })),
    }
  }
}
