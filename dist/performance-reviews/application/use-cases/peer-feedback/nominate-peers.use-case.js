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
exports.NominatePeersUseCase = void 0;
const common_1 = require("@nestjs/common");
const review_not_found_exception_1 = require("../../../domain/exceptions/review-not-found.exception");
let NominatePeersUseCase = class NominatePeersUseCase {
    constructor(peerNominationRepository, cycleRepository, userRepository) {
        this.peerNominationRepository = peerNominationRepository;
        this.cycleRepository = cycleRepository;
        this.userRepository = userRepository;
    }
    async execute(input) {
        const cycle = await this.cycleRepository.findById(input.cycleId);
        if (!cycle) {
            throw new review_not_found_exception_1.ReviewNotFoundException(`Review cycle with ID ${input.cycleId.value} not found`);
        }
        if (input.nomineeIds.length < 3 || input.nomineeIds.length > 5) {
            throw new Error('Must nominate between 3 and 5 peers');
        }
        const nominator = await this.userRepository.findById(input.nominatorId);
        if (!nominator) {
            throw new Error('Nominator user not found');
        }
        const nominations = [];
        for (const nomineeId of input.nomineeIds) {
            if (nomineeId.equals(input.nominatorId)) {
                throw new Error('Cannot nominate yourself for peer feedback');
            }
            const nominee = await this.userRepository.findById(nomineeId);
            if (!nominee) {
                throw new Error(`Nominee with ID ${nomineeId.value} not found`);
            }
            if (nominator.managerId && nominee.id.value === nominator.managerId) {
                throw new Error('Cannot nominate your manager for peer feedback');
            }
            const existing = await this.peerNominationRepository.findByNominatorAndCycle(input.nominatorId, input.cycleId);
            const alreadyNominated = existing.some((nom) => nom.nomineeId.equals(nomineeId));
            if (alreadyNominated) {
                throw new Error(`Already nominated peer with ID ${nomineeId.value}`);
            }
            const nomination = {
                id: require('crypto').randomUUID(),
                cycleId: input.cycleId,
                nominatorId: input.nominatorId,
                nomineeId,
                status: 'PENDING',
                nominatedAt: new Date(),
            };
            nominations.push(nomination);
        }
        const savedNominations = await Promise.all(nominations.map((nom) => this.peerNominationRepository.save(nom)));
        const nominationDtos = await Promise.all(savedNominations.map(async (nom) => {
            const nominee = await this.userRepository.findById(nom.nomineeId);
            return {
                id: nom.id,
                nomineeId: nom.nomineeId.value,
                nomineeName: nominee?.name || 'Unknown',
                status: nom.status,
                nominatedAt: nom.nominatedAt,
            };
        }));
        return {
            nominations: nominationDtos,
        };
    }
};
exports.NominatePeersUseCase = NominatePeersUseCase;
exports.NominatePeersUseCase = NominatePeersUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IPeerNominationRepository')),
    __param(1, (0, common_1.Inject)('IReviewCycleRepository')),
    __param(2, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object, Object, Object])
], NominatePeersUseCase);
//# sourceMappingURL=nominate-peers.use-case.js.map