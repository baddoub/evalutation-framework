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
exports.GetTeamReviewsUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let GetTeamReviewsUseCase = class GetTeamReviewsUseCase {
    constructor(userRepository, cycleRepository, selfReviewRepository, peerFeedbackRepository, managerEvaluationRepository) {
        this.userRepository = userRepository;
        this.cycleRepository = cycleRepository;
        this.selfReviewRepository = selfReviewRepository;
        this.peerFeedbackRepository = peerFeedbackRepository;
        this.managerEvaluationRepository = managerEvaluationRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        const directReports = await this.userRepository.findByManagerId(input.managerId.value);
        const reviews = await Promise.all(directReports.map(async (employee) => {
            const selfReview = await this.selfReviewRepository.findByUserAndCycle(employee.id, input.cycleId);
            const peerFeedback = await this.peerFeedbackRepository.findByRevieweeAndCycle(employee.id, input.cycleId);
            const managerEval = await this.managerEvaluationRepository.findByEmployeeAndCycle(employee.id, input.cycleId);
            return {
                employeeId: employee.id.value,
                employeeName: employee.name,
                employeeLevel: employee.level || 'Unknown',
                selfReviewStatus: selfReview?.status.value || 'NOT_STARTED',
                peerFeedbackCount: peerFeedback.length,
                peerFeedbackStatus: peerFeedback.length >= 3 ? 'COMPLETE' : 'PENDING',
                managerEvalStatus: managerEval?.status.value || 'NOT_STARTED',
                hasSubmittedEvaluation: managerEval?.isSubmitted || false,
            };
        }));
        return {
            reviews,
            total: reviews.length,
        };
    }
};
exports.GetTeamReviewsUseCase = GetTeamReviewsUseCase;
exports.GetTeamReviewsUseCase = GetTeamReviewsUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IUserRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __param(2, (0, common_1.Inject)('ISelfReviewRepository')),
    __param(3, (0, common_1.Inject)('IPeerFeedbackRepository')),
    __param(4, (0, common_1.Inject)('IManagerEvaluationRepository')),
    __metadata("design:paramtypes", [Object, Object, Object, Object, Object])
], GetTeamReviewsUseCase);
//# sourceMappingURL=get-team-reviews.use-case.js.map