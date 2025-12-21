import { IManagerEvaluationRepository } from '../../../domain/repositories/manager-evaluation.repository.interface';
import { ManagerEvaluation, ManagerEvaluationId } from '../../../domain/entities/manager-evaluation.entity';
import { ReviewCycleId } from '../../../domain/value-objects/review-cycle-id.vo';
import { UserId } from '../../../../auth/domain/value-objects/user-id.vo';
import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export declare class PrismaManagerEvaluationRepository implements IManagerEvaluationRepository {
    private readonly prisma;
    constructor(prisma: PrismaService);
    findById(id: ManagerEvaluationId): Promise<ManagerEvaluation | null>;
    findByEmployeeAndCycle(employeeId: UserId, cycleId: ReviewCycleId): Promise<ManagerEvaluation | null>;
    findByManagerAndCycle(managerId: UserId, cycleId: ReviewCycleId): Promise<ManagerEvaluation[]>;
    findByCycle(cycleId: ReviewCycleId): Promise<ManagerEvaluation[]>;
    save(evaluation: ManagerEvaluation): Promise<ManagerEvaluation>;
    delete(id: ManagerEvaluationId): Promise<void>;
}
