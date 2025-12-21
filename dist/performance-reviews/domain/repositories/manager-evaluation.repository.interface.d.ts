import { ManagerEvaluation, ManagerEvaluationId } from '../entities/manager-evaluation.entity';
import { ReviewCycleId } from '../value-objects/review-cycle-id.vo';
import { UserId } from '../../../auth/domain/value-objects/user-id.vo';
export interface IManagerEvaluationRepository {
    findById(id: ManagerEvaluationId): Promise<ManagerEvaluation | null>;
    findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<ManagerEvaluation | null>;
    findByManagerAndCycle(managerId: UserId, cycleId: ReviewCycleId): Promise<ManagerEvaluation[]>;
    findByCycle(cycleId: ReviewCycleId): Promise<ManagerEvaluation[]>;
    save(evaluation: ManagerEvaluation): Promise<ManagerEvaluation>;
    delete(id: ManagerEvaluationId): Promise<void>;
}
