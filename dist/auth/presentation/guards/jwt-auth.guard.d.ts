import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ITokenService } from '../../application/ports/token-service.interface';
import { IUserRepository } from '../../domain/repositories/user.repository.interface';
export declare class JwtAuthGuard implements CanActivate {
    private readonly reflector;
    private readonly tokenService;
    private readonly userRepository;
    constructor(reflector: Reflector, tokenService: ITokenService, userRepository: IUserRepository);
    canActivate(context: ExecutionContext): Promise<boolean>;
    private extractTokenFromHeader;
}
