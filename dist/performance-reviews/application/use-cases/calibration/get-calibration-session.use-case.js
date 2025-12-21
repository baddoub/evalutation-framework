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
exports.GetCalibrationSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
let GetCalibrationSessionUseCase = class GetCalibrationSessionUseCase {
    constructor(calibrationSessionRepository) {
        this.calibrationSessionRepository = calibrationSessionRepository;
    }
    async execute(sessionId) {
        const session = await this.calibrationSessionRepository.findById(sessionId.value);
        if (!session) {
            return null;
        }
        return {
            id: session.id,
            cycleId: session.cycleId.value,
            department: session.department || '',
            status: session.status,
            notes: session.notes || '',
            lockedAt: session.completedAt,
            lockedBy: session.facilitatorId.value,
            participants: session.participantIds.map((participantId) => ({
                userId: participantId,
                userName: '',
                role: '',
            })),
            evaluations: [],
            createdAt: session.scheduledAt,
        };
    }
};
exports.GetCalibrationSessionUseCase = GetCalibrationSessionUseCase;
exports.GetCalibrationSessionUseCase = GetCalibrationSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ICalibrationSessionRepository')),
    __metadata("design:paramtypes", [Object])
], GetCalibrationSessionUseCase);
//# sourceMappingURL=get-calibration-session.use-case.js.map