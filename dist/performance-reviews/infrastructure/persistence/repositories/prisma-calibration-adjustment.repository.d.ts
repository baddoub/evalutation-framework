import { PrismaService } from '../../../../auth/infrastructure/persistence/prisma/prisma.service';
export interface ICalibrationAdjustmentRepository {
    save(adjustment: any): Promise<any>;
    findById(id: string): Promise<any | null>;
    findBySession(sessionId: string): Promise<any[]>;
}
export declare class PrismaCalibrationAdjustmentRepository implements ICalibrationAdjustmentRepository {
    private readonly _prisma;
    constructor(_prisma: PrismaService);
    save(adjustment: any): Promise<any>;
    findById(_id: string): Promise<any | null>;
    findBySession(_sessionId: string): Promise<any[]>;
}
