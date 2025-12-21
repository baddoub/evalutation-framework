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
exports.GetCurrentUserUseCase = void 0;
const common_1 = require("@nestjs/common");
const get_current_user_output_1 = require("./get-current-user.output");
const user_dto_1 = require("../../dto/user.dto");
const user_not_found_exception_1 = require("../../exceptions/user-not-found.exception");
const user_deactivated_exception_1 = require("../../exceptions/user-deactivated.exception");
let GetCurrentUserUseCase = class GetCurrentUserUseCase {
    constructor(userRepository) {
        this.userRepository = userRepository;
    }
    async execute(input) {
        const user = await this.userRepository.findById(input.userId);
        if (!user) {
            throw new user_not_found_exception_1.UserNotFoundException(`User with ID ${input.userId.value} not found`);
        }
        if (!user.isActive) {
            throw new user_deactivated_exception_1.UserDeactivatedException('User account is deactivated. Please contact support.');
        }
        return new get_current_user_output_1.GetCurrentUserOutput(user_dto_1.UserDto.fromDomain(user));
    }
};
exports.GetCurrentUserUseCase = GetCurrentUserUseCase;
exports.GetCurrentUserUseCase = GetCurrentUserUseCase = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)('IUserRepository')),
    __metadata("design:paramtypes", [Object])
], GetCurrentUserUseCase);
//# sourceMappingURL=get-current-user.use-case.js.map