import { IPeerNominationRepository } from '../../../domain/repositories/peer-nomination.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { NominatePeersInput, NominatePeersOutput } from '../../dto/peer-feedback.dto';
export declare class NominatePeersUseCase {
    private readonly peerNominationRepository;
    private readonly cycleRepository;
    private readonly userRepository;
    constructor(peerNominationRepository: IPeerNominationRepository, cycleRepository: IReviewCycleRepository, userRepository: IUserRepository);
    execute(input: NominatePeersInput): Promise<NominatePeersOutput>;
}
