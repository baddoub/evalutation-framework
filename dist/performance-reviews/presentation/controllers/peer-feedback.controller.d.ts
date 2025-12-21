import { CurrentUserData } from '../decorators/current-user.decorator';
import { NominatePeersRequestDto, SubmitPeerFeedbackRequestDto, PeerNominationResponseDto, AggregatedPeerFeedbackResponseDto } from '../dto/peer-feedback.dto';
import { NominatePeersUseCase } from '../../application/use-cases/peer-feedback/nominate-peers.use-case';
import { SubmitPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/submit-peer-feedback.use-case';
import { GetAggregatedPeerFeedbackUseCase } from '../../application/use-cases/peer-feedback/get-aggregated-peer-feedback.use-case';
export declare class PeerFeedbackController {
    private readonly nominatePeersUseCase;
    private readonly submitPeerFeedbackUseCase;
    private readonly getAggregatedPeerFeedbackUseCase;
    constructor(nominatePeersUseCase: NominatePeersUseCase, submitPeerFeedbackUseCase: SubmitPeerFeedbackUseCase, getAggregatedPeerFeedbackUseCase: GetAggregatedPeerFeedbackUseCase);
    nominatePeers(cycleId: string, user: CurrentUserData, dto: NominatePeersRequestDto): Promise<PeerNominationResponseDto[]>;
    submitPeerFeedback(cycleId: string, revieweeId: string, user: CurrentUserData, dto: SubmitPeerFeedbackRequestDto): Promise<{
        id: string;
        submittedAt: string;
    }>;
    getAggregatedPeerFeedback(cycleId: string, user: CurrentUserData): Promise<AggregatedPeerFeedbackResponseDto>;
}
