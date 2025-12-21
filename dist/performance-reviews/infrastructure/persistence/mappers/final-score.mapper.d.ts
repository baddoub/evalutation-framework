import { FinalScore as PrismaFinalScore } from '@prisma/client';
import { FinalScore } from '../../../domain/entities/final-score.entity';
export declare class FinalScoreMapper {
    static toDomain(prisma: PrismaFinalScore): FinalScore;
    static toPrisma(domain: FinalScore): Omit<PrismaFinalScore, 'createdAt' | 'updatedAt' | 'deletedAt'>;
}
