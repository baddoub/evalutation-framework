import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { IReviewCycleRepository } from '../../../domain/repositories/review-cycle.repository.interface';
import { IUserRepository } from '../../../../auth/domain/repositories/user.repository.interface';
import { SubmitManagerEvaluationInput, SubmitManagerEvaluationOutput } from '../../dto/manager-evaluation.dto';
export declare class SubmitManagerEvaluationUseCase {
    private readonly managerEvaluationRepository;
    private readonly cycleRepository;
    private readonly userRepository;
    constructor(managerEvaluationRepository: IManagerEvaluationRepository, cycleRepository: IReviewCycleRepository, userRepository: IUserRepository);
    execute(input: SubmitManagerEvaluationInput): Promise<SubmitManagerEvaluationOutput>;
}
