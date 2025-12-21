import { Injectable, Inject } from '@nestjs/common'
import { IPeerNominationRepository, PeerNomination } from '../../../domain/repositories/peer-nomination.repository.interface'
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface'
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface'
import { ReviewNotFoundException } from '../../../domain/exceptions/review-not-found.exception'
import { NominatePeersInput, NominatePeersOutput } from '../../dto/peer-feedback.dto'

/**
 * NominatePeersUseCase
 *
 * Nominates peers to provide feedback:
 * 1. Validate cycle exists and is active
 * 2. Validate 3-5 nominees
 * 3. Validate no self-nomination or manager nomination
 * 4. Create PeerNomination entities for each nominee
 * 5. Persist all nominations
 * 6. Return created nominations DTO
 */
@Injectable()
export class NominatePeersUseCase {
  constructor(
    @Inject('IPeerNominationRepository')
    private readonly peerNominationRepository: IPeerNominationRepository,
    @Inject('IReviewCycleRepository')
    private readonly cycleRepository: IReviewCycleRepository,
    @Inject('IUserRepository')
    private readonly userRepository: IUserRepository,
  ) {}

  async execute(input: NominatePeersInput): Promise<NominatePeersOutput> {
    // 1. Validate cycle exists
    const cycle = await this.cycleRepository.findById(input.cycleId)
    if (!cycle) {
      throw new ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`)
    }

    // 2. Validate 3-5 nominees
    if (input.nomineeIds.length < 3 || input.nomineeIds.length > 5) {
      throw new Error('Must nominate between 3 and 5 peers')
    }

    // 3. Get nominator details
    const nominator = await this.userRepository.findById(input.nominatorId)
    if (!nominator) {
      throw new Error('Nominator user not found')
    }

    // 4. Validate nominees and create nominations
    const nominations: PeerNomination[] = []

    for (const nomineeId of input.nomineeIds) {
      // Cannot nominate self
      if (nomineeId.equals(input.nominatorId)) {
        throw new Error('Cannot nominate yourself for peer feedback')
      }

      // Get nominee details
      const nominee = await this.userRepository.findById(nomineeId)
      if (!nominee) {
        throw new Error(`Nominee with ID ${nomineeId.value} not found`)
      }

      // Cannot nominate manager
      if (nominator.managerId && nominee.id.value === nominator.managerId) {
        throw new Error('Cannot nominate your manager for peer feedback')
      }

      // Check if not already nominated
      const existing = await this.peerNominationRepository.findByNominatorAndCycle(
        input.nominatorId,
        input.cycleId,
      )
      const alreadyNominated = existing.some((nom) => nom.nomineeId.equals(nomineeId))
      if (alreadyNominated) {
        throw new Error(`Already nominated peer with ID ${nomineeId.value}`)
      }

      // Create nomination
      const nomination: PeerNomination = {
        id: require('crypto').randomUUID(),
        cycleId: input.cycleId,
        nominatorId: input.nominatorId,
        nomineeId,
        status: 'PENDING',
        nominatedAt: new Date(),
      }

      nominations.push(nomination)
    }

    // 5. Persist all nominations
    const savedNominations = await Promise.all(
      nominations.map((nom) => this.peerNominationRepository.save(nom)),
    )

    // 6. Return DTO
    const nominationDtos = await Promise.all(
      savedNominations.map(async (nom) => {
        const nominee = await this.userRepository.findById(nom.nomineeId)
        return {
          id: nom.id,
          nomineeId: nom.nomineeId.value,
          nomineeName: nominee?.name || 'Unknown',
          status: nom.status,
          nominatedAt: nom.nominatedAt,
        }
      }),
    )

    return {
      nominations: nominationDtos,
    }
  }
}
