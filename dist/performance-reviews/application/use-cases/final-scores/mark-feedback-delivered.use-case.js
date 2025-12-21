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
exports.MarkFeedbackDeliveredUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let MarkFeedbackDeliveredUseCase = class MarkFeedbackDeliveredUseCase {
    constructor(finalScoreRepository, cycleRepository, userRepository) {
        this.finalScoreRepository = finalScoreRepository;
        this.cycleRepository = cycleRepository;
        this.userRepository = userRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        const employee = await this.userRepository.findById(input.employeeId);
        if (!employee) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Employee not found');
        }
        if (employee.managerId !== input.managerId.value) {
            throw new Error('You can only mark feedback delivered for your direct reports');
        }
        const finalScore = await this.finalScoreRepository.findByUserAndCycle(input.employeeId, input.cycleId);
        if (!finalScore) {
            throw new review_not_found_exception_1.ReviewNotFoundException('Final score not found');
        }
        finalScore.markFeedbackDelivered(input.managerId, input.feedbackNotes);
        const updatedScore = await this.finalScoreRepository.save(finalScore);
        return {
            employeeId: updatedScore.userId.value,
            feedbackDelivered: updatedScore.feedbackDelivered,
            feedbackDeliveredAt: updatedScore.feedbackDeliveredAt,
        };
    }
};
exports.MarkFeedbackDeliveredUseCase = MarkFeedbackDeliveredUseCase;
exports.MarkFeedbackDeliveredUseCase = MarkFeedbackDeliveredUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IFinalScoreRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __param(2, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], MarkFeedbackDeliveredUseCase);
//# sourceMappingURL=mark-feedback-delivered.use-case.js.map