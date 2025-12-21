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
exports.LockFinalScoresUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let LockFinalScoresUseCase = class LockFinalScoresUseCase {
    constructor(finalScoreRepository, cycleRepository) {
        this.finalScoreRepository = finalScoreRepository;
        this.cycleRepository = cycleRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        const finalScores = await this.finalScoreRepository.findByCycle(input.cycleId);
        const lockedAt = new Date();
        const lockPromises = finalScores.map(async (score) => {
            if (!score.isLocked) {
                score.lock();
                return this.finalScoreRepository.save(score);
            }
            return score;
        });
        const lockedScores = await Promise.all(lockPromises);
        return {
            cycleId: input.cycleId.value,
            totalScoresLocked: lockedScores.length,
            lockedAt,
        };
    }
};
exports.LockFinalScoresUseCase = LockFinalScoresUseCase;
exports.LockFinalScoresUseCase = LockFinalScoresUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IFinalScoreRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __metadata("design:paramtypes", [Object, Object])
], LockFinalScoresUseCase);
//# sourceMappingURL=lock-final-scores.use-case.js.map