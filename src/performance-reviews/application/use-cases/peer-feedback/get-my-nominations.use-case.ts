import { Injectable, Inject } from '@nestjs/common'
import { IPeerNominationRepository } from '../../../domain/repositories/peer-nomination.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import {
  GetMyNominationsInput,
  GetMyNominationsOutput,
  MyNominationDto,
} from '../../dto/peer-feedback.dto'

/**
 * GetMyNominationsUseCase
 *
 * Retrieves peer nominations made by the current user:
 * 1. Validate cycle exists
 * 2. Find all nominations where user is the nominator
 * 3. Return list of nominations with nominee details
 */
@Injectable()
export class GetMyNominationsUseCase {
  constructor(
    @Inject('IPeerNominationRepository')
    private readonly peerNominationRepository: IPeerNominationRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: GetMyNominationsInput): Promise<GetMyNominationsOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Find all nominations made by this user
    const nominations = await this.peerNominationRepository.findByNominatorAndCycle(
      input.nominatorId,
      input.cycleId,
    )

    // 3. Build the nominations list with nominee details
    const nominationDtos: MyNominationDto[] = await Promise.all(
      nominations.map(async (nomination) => {
        const nominee = await this.userRepository.findById(nomination.nomineeId)

        return {
          id: nomination.id,
          nomineeId: nomination.nomineeId.value,
          nomineeName: nominee?.name || 'Unknown',
          nomineeEmail: nominee?.email.value || '',
          status: nomination.status,
          nominatedAt: nomination.nominatedAt,
        }
      }),
    )

    return {
      nominations: nominationDtos,
      total: nominationDtos.length,
    }
  }
}
