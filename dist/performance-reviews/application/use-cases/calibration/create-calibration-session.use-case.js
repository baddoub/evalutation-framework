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
exports.CreateCalibrationSessionUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let CreateCalibrationSessionUseCase = class CreateCalibrationSessionUseCase {
    constructor(calibrationSessionRepository, cycleRepository) {
        this.calibrationSessionRepository = calibrationSessionRepository;
        this.cycleRepository = cycleRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        const session = {
            id: require('crypto').randomUUID(),
            cycleId: input.cycleId,
            name: input.name,
            facilitatorId: input.facilitatorId,
            participantIds: input.participantIds.map(id => id.value),
            scheduledAt: input.scheduledAt,
            status: 'SCHEDULED',
            department: input.department,
        };
        const savedSession = await this.calibrationSessionRepository.save(session);
        return {
            id: savedSession.id,
            name: savedSession.name,
            status: savedSession.status,
            scheduledAt: savedSession.scheduledAt,
            participantCount: savedSession.participantIds.length,
        };
    }
};
exports.CreateCalibrationSessionUseCase = CreateCalibrationSessionUseCase;
exports.CreateCalibrationSessionUseCase = CreateCalibrationSessionUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('ICalibrationSessionRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object])
], CreateCalibrationSessionUseCase);
//# sourceMappingURL=create-calibration-session.use-case.js.map