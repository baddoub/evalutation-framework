import { ManagerEvaluation as PrismaManagerEvaluation } from '@prisma/client';
import { ManagerEvaluation } from '../../../domain/entities/manager-evaluation.entity';
export declare class ManagerEvaluationMapper {
    static toDomain(prisma: PrismaManagerEvaluation): ManagerEvaluation;
    static toPrisma(domain: ManagerEvaluation): Omit<PrismaManagerEvaluation, 'createdAt' | 'updatedAt' | 'deletedAt'>;
}
