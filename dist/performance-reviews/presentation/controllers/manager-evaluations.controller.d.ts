import { CurrentUserData } from '../decorators/current-user.decorator';
import { UpdateManagerEvaluationRequestDto, SubmitManagerEvaluationRequestDto, ManagerEvaluationResponseDto } from '../dto/manager-evaluation.dto';
import { GetManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/get-manager-evaluation.use-case';
import { UpdateManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/update-manager-evaluation.use-case';
import { SubmitManagerEvaluationUseCase } from '../../application/use-cases/manager-evaluations/submit-manager-evaluation.use-case';
export declare class ManagerEvaluationsController {
    private readonly getManagerEvaluationUseCase;
    private readonly updateManagerEvaluationUseCase;
    private readonly submitManagerEvaluationUseCase;
    constructor(getManagerEvaluationUseCase: GetManagerEvaluationUseCase, updateManagerEvaluationUseCase: UpdateManagerEvaluationUseCase, submitManagerEvaluationUseCase: SubmitManagerEvaluationUseCase);
    getManagerEvaluation(cycleId: string, employeeId: string, user: CurrentUserData): Promise<ManagerEvaluationResponseDto>;
    updateManagerEvaluation(cycleId: string, employeeId: string, user: CurrentUserData, dto: UpdateManagerEvaluationRequestDto): Promise<ManagerEvaluationResponseDto>;
    submitManagerEvaluation(cycleId: string, employeeId: string, user: CurrentUserData, dto: SubmitManagerEvaluationRequestDto): Promise<{
        id: string;
        status: string;
        submittedAt: string;
    }>;
}
