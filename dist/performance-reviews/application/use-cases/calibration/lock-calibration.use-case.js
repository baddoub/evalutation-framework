"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LockCalibrationUseCase = void 0;
const common_1 = require("@nestjs/common");
let LockCalibrationUseCase = class LockCalibrationUseCase {
    constructor(calibrationSessionRepository) {
        this.calibrationSessionRepository = calibrationSessionRepository;
    }
    async execute(input) {
        const session = await this.calibrationSessionRepository.findById(input.sessionId.value);
        if (!session) {
            throw new Error('Calibration session not found');
        }
        const lockedSession = {
            ...session,
            status: 'COMPLETED',
            completedAt: new Date(),
        };
        const saved = await this.calibrationSessionRepository.save(lockedSession);
        return {
            id: saved.id,
            cycleId: saved.cycleId.value,
            department: saved.department || '',
            status: saved.status,
            notes: saved.notes || '',
            lockedAt: saved.completedAt,
            lockedBy: saved.facilitatorId.value,
            participants: saved.participantIds.map((participantId) => ({
                userId: participantId,
                userName: '',
                role: '',
            })),
            evaluations: [],
            createdAt: saved.scheduledAt,
        };
    }
};
exports.LockCalibrationUseCase = LockCalibrationUseCase;
exports.LockCalibrationUseCase = LockCalibrationUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ICalibrationSessionRepository')),
    __metadata("design:paramtypes", [Object])
], LockCalibrationUseCase);
//# sourceMappingURL=lock-calibration.use-case.js.map