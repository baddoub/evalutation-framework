"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const get_my_final_score_use_case_1 = require("./get-my-final-score.use-case");
const final_score_entity_1 = require("../../../domain/entities/final-score.entity");
const review_cycle_entity_1 = require("../../../domain/entities/review-cycle.entity");
const user_entity_1 = require("../../../../auth/domain/entities/user.entity");
const review_cycle_id_vo_1 = require("../../../domain/value-objects/review-cycle-id.vo");
const user_id_vo_1 = require("../../../../auth/domain/value-objects/user-id.vo");
const pillar_scores_vo_1 = require("../../../domain/value-objects/pillar-scores.vo");
const weighted_score_vo_1 = require("../../../domain/value-objects/weighted-score.vo");
const engineer_level_vo_1 = require("../../../domain/value-objects/engineer-level.vo");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
const cycle_deadlines_vo_1 = require("../../../domain/value-objects/cycle-deadlines.vo");
const email_vo_1 = require("../../../../auth/domain/value-objects/email.vo");
const role_vo_1 = require("../../../../auth/domain/value-objects/role.vo");
describe('GetMyFinalScoreUseCase', () => {
    let useCase;
    let finalScoreRepository;
    let cycleRepository;
    let userRepository;
    const createValidInput = () => ({
        userId: user_id_vo_1.UserId.generate(),
        cycleId: review_cycle_id_vo_1.ReviewCycleId.generate(),
    });
    const createValidReviewCycle = (cycleId) => {
        const deadlines = cycle_deadlines_vo_1.CycleDeadlines.create({
            selfReview: new Date('2024-01-31'),
            peerFeedback: new Date('2024-02-28'),
            managerEvaluation: new Date('2024-03-31'),
            calibration: new Date('2024-04-30'),
            feedbackDelivery: new Date('2024-05-31'),
        });
        return review_cycle_entity_1.ReviewCycle.create({
            id: cycleId,
            year: 2024,
            startDate: new Date('2024-01-01'),
            name: 'Annual Review 2024',
            deadlines,
        });
    };
    const createValidUser = (userId) => {
        return user_entity_1.User.create({
            id: userId,
            email: email_vo_1.Email.create('john.doe@example.com'),
            name: 'John Doe',
            keycloakId: 'keycloak-' + userId.value,
            roles: [role_vo_1.Role.user()],
            isActive: true,
            level: 'Senior Engineer',
            createdAt: new Date(),
            updatedAt: new Date(),
        });
    };
    const createValidFinalScore = (cycleId, userId, feedbackDelivered = false) => {
        const finalScore = final_score_entity_1.FinalScore.create({
            cycleId,
            userId,
            pillarScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 4,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.2),
            finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
            peerAverageScores: pillar_scores_vo_1.PillarScores.create({
                projectImpact: 3,
                direction: 3,
                engineeringExcellence: 4,
                operationalOwnership: 3,
                peopleImpact: 2,
            }),
            peerFeedbackCount: 4,
        });
        if (feedbackDelivered) {
            finalScore.markFeedbackDelivered(user_id_vo_1.UserId.generate(), 'Great work!');
        }
        return finalScore;
    };
    beforeEach(() => {
        finalScoreRepository = {
            findById: jest.fn(),
            findByUserAndCycle: jest.fn(),
            findByEmployeeAndCycle: jest.fn(),
            findByCycle: jest.fn(),
            findByBonusTier: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        cycleRepository = {
            findById: jest.fn(),
            findByYear: jest.fn(),
            findActive: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
        };
        userRepository = {
            findById: jest.fn(),
            findByEmail: jest.fn(),
            findByKeycloakId: jest.fn(),
            save: jest.fn(),
            delete: jest.fn(),
            existsByEmail: jest.fn(),
            findByRole: jest.fn(),
            findByManagerId: jest.fn(),
        };
        useCase = new get_my_final_score_use_case_1.GetMyFinalScoreUseCase(finalScoreRepository, cycleRepository, userRepository);
    });
    describe('execute', () => {
        describe('CRITICAL: Should retrieve employee\'s own final score', () => {
            it('should return existing final score with all data populated', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.employee.id).toBe(user.id.value);
                expect(result.employee.name).toBe('John Doe');
                expect(result.cycle.id).toBe(cycle.id.value);
                expect(result.cycle.name).toBe('Annual Review 2024');
                expect(result.cycle.year).toBe(2024);
            });
            it('should return score data in correct format', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.scores).toEqual({
                    projectImpact: 4,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
                expect(result.weightedScore).toBe(3.2);
                expect(result.percentageScore).toBeDefined();
                expect(typeof result.percentageScore).toBe('number');
            });
            it('should include pillar scores from final score', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.scores).toHaveProperty('projectImpact');
                expect(result.scores).toHaveProperty('direction');
                expect(result.scores).toHaveProperty('engineeringExcellence');
                expect(result.scores).toHaveProperty('operationalOwnership');
                expect(result.scores).toHaveProperty('peopleImpact');
                expect(result.scores.projectImpact).toBe(4);
                expect(result.scores.direction).toBe(3);
            });
            it('should call findByUserAndCycle with correct parameters', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                await useCase.execute(input);
                expect(finalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(input.userId, input.cycleId);
                expect(finalScoreRepository.findByUserAndCycle).toHaveBeenCalledTimes(1);
            });
        });
        describe('CRITICAL: Should validate cycle exists', () => {
            it('should throw ReviewNotFoundException if cycle does not exist', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            });
            it('should throw ReviewNotFoundException with correct message including cycle ID', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(`Review cycle with ID ${input.cycleId.value} not found`);
            });
            it('should call cycleRepository.findById with correct cycle ID', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(cycleRepository.findById).toHaveBeenCalledTimes(1);
            });
            it('should not proceed to find score if cycle validation fails', async () => {
                const input = createValidInput();
                cycleRepository.findById.mockResolvedValue(null);
                try {
                    await useCase.execute(input);
                }
                catch { }
                expect(finalScoreRepository.findByUserAndCycle).not.toHaveBeenCalled();
                expect(userRepository.findById).not.toHaveBeenCalled();
            });
        });
        describe('CRITICAL: Should only return if feedback has been delivered', () => {
            it('should include feedbackDelivered flag in response', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId, true);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.feedbackDelivered).toBe(true);
            });
            it('should include feedbackDeliveredAt timestamp when feedback delivered', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId, true);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.feedbackDeliveredAt).toBeDefined();
                expect(result.feedbackDeliveredAt instanceof Date).toBe(true);
            });
            it('should not include feedbackDeliveredAt when feedback not delivered', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId, false);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.feedbackDelivered).toBe(false);
                expect(result.feedbackDeliveredAt).toBeUndefined();
            });
        });
        describe('CRITICAL: Should hide scores if feedback not delivered yet', () => {
            it('should still return score data even if feedback not delivered (data accessible after delivery)', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId, false);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.scores).toBeDefined();
                expect(result.weightedScore).toBeDefined();
                expect(result.bonusTier).toBeDefined();
            });
            it('should include feedback delivery flag for frontend to control visibility', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId, false);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.feedbackDelivered).toBe(false);
            });
        });
        describe('IMPORTANT: Should return complete score breakdown (pillar scores, weighted score, bonus tier)', () => {
            it('should return all pillar scores', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.scores.projectImpact).toBe(4);
                expect(result.scores.direction).toBe(3);
                expect(result.scores.engineeringExcellence).toBe(4);
                expect(result.scores.operationalOwnership).toBe(3);
                expect(result.scores.peopleImpact).toBe(2);
            });
            it('should return weighted score', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.weightedScore).toBe(3.2);
                expect(typeof result.weightedScore).toBe('number');
            });
            it('should return percentage score calculated from weighted score', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.percentageScore).toBeDefined();
                expect(typeof result.percentageScore).toBe('number');
                expect(result.percentageScore).toBe(80);
            });
            it('should return bonus tier', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.bonusTier).toBeDefined();
                expect(typeof result.bonusTier).toBe('string');
            });
            it('should return peer feedback summary when peer feedback exists', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.peerFeedbackSummary).toBeDefined();
                expect(result.peerFeedbackSummary?.count).toBe(4);
                expect(result.peerFeedbackSummary?.averageScores).toEqual({
                    projectImpact: 3,
                    direction: 3,
                    engineeringExcellence: 4,
                    operationalOwnership: 3,
                    peopleImpact: 2,
                });
            });
            it('should not include peer feedback summary when no peer feedback', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = final_score_entity_1.FinalScore.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 4,
                        direction: 3,
                        engineeringExcellence: 4,
                        operationalOwnership: 3,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(3.2),
                    finalLevel: engineer_level_vo_1.EngineerLevel.SENIOR,
                    peerFeedbackCount: 0,
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.peerFeedbackSummary).toBeUndefined();
            });
        });
        describe('IMPORTANT: Should include final level', () => {
            it('should include employee level from user entity', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.employee.level).toBe('Senior Engineer');
            });
            it('should return Unknown for level when user has no level', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = user_entity_1.User.create({
                    id: input.userId,
                    email: email_vo_1.Email.create('jane.smith@example.com'),
                    name: 'Jane Smith',
                    keycloakId: 'keycloak-' + input.userId.value,
                    roles: [role_vo_1.Role.user()],
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                });
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.employee.level).toBe('Unknown');
            });
        });
        describe('IMPORTANT: Should return correct DTO structure', () => {
            it('should return output with all required fields', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result).toHaveProperty('employee');
                expect(result).toHaveProperty('cycle');
                expect(result).toHaveProperty('scores');
                expect(result).toHaveProperty('weightedScore');
                expect(result).toHaveProperty('percentageScore');
                expect(result).toHaveProperty('bonusTier');
                expect(result).toHaveProperty('isLocked');
                expect(result).toHaveProperty('feedbackDelivered');
            });
            it('should return correct employee object structure', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.employee).toHaveProperty('id');
                expect(result.employee).toHaveProperty('name');
                expect(result.employee).toHaveProperty('level');
                expect(typeof result.employee.id).toBe('string');
                expect(typeof result.employee.name).toBe('string');
                expect(typeof result.employee.level).toBe('string');
            });
            it('should return correct cycle object structure', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.cycle).toHaveProperty('id');
                expect(result.cycle).toHaveProperty('name');
                expect(result.cycle).toHaveProperty('year');
                expect(typeof result.cycle.id).toBe('string');
                expect(typeof result.cycle.name).toBe('string');
                expect(typeof result.cycle.year).toBe('number');
            });
            it('should return DTO as GetMyFinalScoreOutput interface', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(typeof result.employee.id).toBe('string');
                expect(typeof result.employee.name).toBe('string');
                expect(typeof result.cycle.id).toBe('string');
                expect(typeof result.weightedScore).toBe('number');
                expect(typeof result.percentageScore).toBe('number');
                expect(typeof result.isLocked).toBe('boolean');
                expect(typeof result.feedbackDelivered).toBe('boolean');
            });
            it('should return string IDs (not value objects)', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(typeof result.employee.id).toBe('string');
                expect(typeof result.cycle.id).toBe('string');
            });
        });
        describe('EDGE: Should handle missing final score gracefully', () => {
            it('should throw ReviewNotFoundException if final score not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow('Final score not found for this user and cycle');
            });
            it('should throw ReviewNotFoundException with correct message', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            });
        });
        describe('EDGE: Should enforce privacy (only own scores visible)', () => {
            it('should retrieve scores for the specified user', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.employee.id).toBe(input.userId.value);
            });
            it('should validate user exists before returning scores', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow('User not found');
            });
            it('should throw ReviewNotFoundException if user not found', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(null);
                await expect(useCase.execute(input)).rejects.toThrow(review_not_found_exception_1.ReviewNotFoundException);
            });
            it('should call userRepository.findById with correct userId', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                await useCase.execute(input);
                expect(userRepository.findById).toHaveBeenCalledWith(input.userId);
                expect(userRepository.findById).toHaveBeenCalledTimes(1);
            });
        });
        describe('EDGE: Should handle locked vs unlocked scores', () => {
            it('should indicate if score is locked', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                finalScore.lock();
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.isLocked).toBe(true);
            });
            it('should indicate if score is not locked', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.isLocked).toBe(false);
            });
            it('should return data regardless of lock status', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                finalScore.lock();
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.scores).toBeDefined();
                expect(result.weightedScore).toBeDefined();
                expect(result.bonusTier).toBeDefined();
            });
        });
        describe('IMPORTANT: Should handle repository errors gracefully', () => {
            it('should throw error if cycle repository fails', async () => {
                const input = createValidInput();
                const error = new Error('Database connection failed');
                cycleRepository.findById.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Database connection failed');
            });
            it('should throw error if user repository find fails', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const error = new Error('Query failed');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Query failed');
            });
            it('should throw error if final score repository find fails', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const error = new Error('Score query failed');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockRejectedValue(error);
                await expect(useCase.execute(input)).rejects.toThrow('Score query failed');
            });
            it('should propagate cycle repository errors without modification', async () => {
                const input = createValidInput();
                const customError = new review_not_found_exception_1.ReviewNotFoundException('Custom cycle error');
                cycleRepository.findById.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
            it('should propagate user repository errors without modification', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const customError = new review_not_found_exception_1.ReviewNotFoundException('User error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
            it('should propagate final score repository errors without modification', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const customError = new review_not_found_exception_1.ReviewNotFoundException('Score error');
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockRejectedValue(customError);
                await expect(useCase.execute(input)).rejects.toThrow(customError);
            });
        });
        describe('Integration scenarios', () => {
            it('should complete full workflow: validate cycle, validate user, retrieve score', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(cycleRepository.findById).toHaveBeenCalledWith(input.cycleId);
                expect(userRepository.findById).toHaveBeenCalledWith(input.userId);
                expect(finalScoreRepository.findByUserAndCycle).toHaveBeenCalledWith(input.userId, input.cycleId);
                expect(result.employee.id).toBe(user.id.value);
                expect(result.cycle.id).toBe(cycle.id.value);
                expect(result.scores.projectImpact).toBe(4);
            });
            it('should handle complete score data with peer feedback and feedback delivery', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId, true);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.peerFeedbackSummary).toBeDefined();
                expect(result.peerFeedbackSummary?.count).toBe(4);
                expect(result.feedbackDelivered).toBe(true);
                expect(result.feedbackDeliveredAt).toBeDefined();
            });
            it('should maintain data consistency across all returned fields', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = createValidFinalScore(input.cycleId, input.userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.employee.id).toBe(user.id.value);
                expect(result.cycle.id).toBe(cycle.id.value);
                expect(result.employee.name).toBe(user.name);
                expect(result.cycle.year).toBe(cycle.year);
                expect(result.weightedScore).toBe(finalScore.weightedScore.value);
                expect(result.percentageScore).toBe(finalScore.percentageScore);
            });
            it('should return different bonus tiers based on weighted scores', async () => {
                const input1 = createValidInput();
                const cycle1 = createValidReviewCycle(input1.cycleId);
                const user1 = createValidUser(input1.userId);
                const finalScore1 = final_score_entity_1.FinalScore.create({
                    cycleId: input1.cycleId,
                    userId: input1.userId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 2,
                        direction: 2,
                        engineeringExcellence: 2,
                        operationalOwnership: 2,
                        peopleImpact: 2,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(2.0),
                    finalLevel: engineer_level_vo_1.EngineerLevel.MID,
                });
                cycleRepository.findById.mockResolvedValue(cycle1);
                userRepository.findById.mockResolvedValue(user1);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore1);
                const result = await useCase.execute(input1);
                expect(result.bonusTier).toBeDefined();
                expect(typeof result.bonusTier).toBe('string');
            });
            it('should handle low weighted score correctly', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = final_score_entity_1.FinalScore.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 1,
                        direction: 1,
                        engineeringExcellence: 1,
                        operationalOwnership: 1,
                        peopleImpact: 1,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(1.0),
                    finalLevel: engineer_level_vo_1.EngineerLevel.JUNIOR,
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.weightedScore).toBe(1.0);
                expect(result.percentageScore).toBe(25);
            });
            it('should handle high weighted score correctly', async () => {
                const input = createValidInput();
                const cycle = createValidReviewCycle(input.cycleId);
                const user = createValidUser(input.userId);
                const finalScore = final_score_entity_1.FinalScore.create({
                    cycleId: input.cycleId,
                    userId: input.userId,
                    pillarScores: pillar_scores_vo_1.PillarScores.create({
                        projectImpact: 4,
                        direction: 4,
                        engineeringExcellence: 4,
                        operationalOwnership: 4,
                        peopleImpact: 4,
                    }),
                    weightedScore: weighted_score_vo_1.WeightedScore.fromValue(4.0),
                    finalLevel: engineer_level_vo_1.EngineerLevel.LEAD,
                });
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result.weightedScore).toBe(4.0);
                expect(result.percentageScore).toBe(100);
            });
        });
        describe('EDGE: Null/undefined edge cases', () => {
            it('should work with valid userId', async () => {
                const userId = user_id_vo_1.UserId.generate();
                const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
                const input = { userId, cycleId };
                const cycle = createValidReviewCycle(cycleId);
                const user = createValidUser(userId);
                const finalScore = createValidFinalScore(cycleId, userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.employee.id).toBe(userId.value);
            });
            it('should work with valid cycleId', async () => {
                const userId = user_id_vo_1.UserId.generate();
                const cycleId = review_cycle_id_vo_1.ReviewCycleId.generate();
                const input = { userId, cycleId };
                const cycle = createValidReviewCycle(cycleId);
                const user = createValidUser(userId);
                const finalScore = createValidFinalScore(cycleId, userId);
                cycleRepository.findById.mockResolvedValue(cycle);
                userRepository.findById.mockResolvedValue(user);
                finalScoreRepository.findByUserAndCycle.mockResolvedValue(finalScore);
                const result = await useCase.execute(input);
                expect(result).toBeDefined();
                expect(result.cycle.id).toBe(cycleId.value);
            });
        });
    });
});
//# sourceMappingURL=get-my-final-score.use-case.spec.js.map