import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
export interface GetManagerEvaluationInput {
    cycleId: ReviewCycleId;
    employeeId: UserId;
    managerId: UserId;
}
export interface GetManagerEvaluationOutput {
    id: string;
    employeeId: string;
    managerId: string;
    cycleId: string;
    scores: {
        projectImpact: number;
        direction: number;
        engineeringExcellence: number;
        operationalOwnership: number;
        peopleImpact: number;
    };
    managerComments?: string;
    performanceNarrative?: string;
    growthAreas?: string;
    proposedLevel?: string;
    submittedAt?: Date;
    status: string;
}
export declare class GetManagerEvaluationUseCase {
    private readonly managerEvaluationRepository;
    constructor(managerEvaluationRepository: IManagerEvaluationRepository);
    execute(input: GetManagerEvaluationInput): Promise<GetManagerEvaluationOutput | null>;
}
