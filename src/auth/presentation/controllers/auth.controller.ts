import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Req,
  UseGuards,
  HttpCode,
  HttpStatus,
  Inject,
  UnauthorizedException,
} from '@nestjs/common'
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger'
import { Response, Request } from 'express'
import { AuthCallbackDto } from '../dto/requests/auth-callback.dto'
import { RegisterDto } from '../dto/requests/register.dto'
import { LoginDto } from '../dto/requests/login.dto'
import { AuthorizationUrlResponseDto } from '../dto/responses/authorization-url-response.dto'
import { AuthResponseDto } from '../dto/responses/auth-response.dto'
import { TokenResponseDto } from '../dto/responses/token-response.dto'
import { UserResponseDto } from '../dto/responses/user-response.dto'
import { Public } from '../decorators/public.decorator'
import { CurrentUser } from '../decorators/current-user.decorator'
import { JwtAuthGuard } from '../guards/jwt-auth.guard'
import { AuthenticateUserUseCase } from '../../application/use-cases/authenticate-user/authenticate-user.use-case'
import { RefreshTokensUseCase } from '../../application/use-cases/refresh-tokens/refresh-tokens.use-case'
import { LogoutUserUseCase } from '../../application/use-cases/logout-user/logout-user.use-case'
import { GetCurrentUserUseCase } from '../../application/use-cases/get-current-user/get-current-user.use-case'
import { RegisterUserUseCase } from '../../application/use-cases/register-user/register-user.use-case'
import { LoginUserUseCase } from '../../application/use-cases/login-user/login-user.use-case'
import { KeycloakConfig } from '../../infrastructure/adapters/keycloak/keycloak.config'
import { PkceHelper } from '../utils/pkce.helper'
import { UserId } from '../../domain/value-objects/user-id.vo'

@ApiTags('Authentication')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(
    private readonly authenticateUserUseCase: AuthenticateUserUseCase,
    private readonly refreshTokensUseCase: RefreshTokensUseCase,
    private readonly logoutUserUseCase: LogoutUserUseCase,
    private readonly getCurrentUserUseCase: GetCurrentUserUseCase,
    private readonly registerUserUseCase: RegisterUserUseCase,
    private readonly loginUserUseCase: LoginUserUseCase,
    @Inject(KeycloakConfig)
    private readonly keycloakConfig: KeycloakConfig,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register new user with email and password' })
  @ApiResponse({
    status: 201,
    description: 'User registered successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 409, description: 'User already exists' })
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.registerUserUseCase.execute({
      email: dto.email,
      password: dto.password,
      name: dto.name,
    })

    // Set refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
        isActive: result.user.isActive,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString(),
      },
    }
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    const result = await this.loginUserUseCase.execute({
      email: dto.email,
      password: dto.password,
    })

    // Set refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
        isActive: result.user.isActive,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString(),
      },
    }
  }

  @Public()
  @Get('oauth/login')
  @ApiOperation({ summary: 'Initiate OAuth login' })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL successfully generated',
    type: AuthorizationUrlResponseDto,
  })
  initiateLogin(@Res({ passthrough: true }) response: Response): AuthorizationUrlResponseDto {
    const codeVerifier = PkceHelper.generateCodeVerifier()
    const codeChallenge = PkceHelper.generateCodeChallenge(codeVerifier)
    const state = PkceHelper.generateState()

    // Store state in cookie for CSRF validation
    response.cookie('oauth_state', state, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 5 * 60 * 1000, // 5 minutes
    })

    // Store code verifier in cookie for PKCE
    response.cookie('code_verifier', codeVerifier, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 5 * 60 * 1000, // 5 minutes
    })

    const params = new URLSearchParams({
      client_id: this.keycloakConfig.clientId,
      redirect_uri: this.keycloakConfig.redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: codeChallenge,
      code_challenge_method: 'S256',
      state,
    })

    const authorizationUrl = `${this.keycloakConfig.authorizationEndpoint}?${params.toString()}`

    return {
      authorizationUrl,
      codeVerifier,
      state,
    }
  }

  @Public()
  @Post('callback')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'OAuth callback endpoint' })
  @ApiResponse({
    status: 201,
    description: 'User authenticated successfully',
    type: AuthResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Authentication failed' })
  async handleCallback(
    @Body() dto: AuthCallbackDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthResponseDto> {
    // Validate state (CSRF protection)
    const storedState = request.cookies?.oauth_state
    if (!storedState || storedState !== dto.state) {
      throw new UnauthorizedException('Invalid state parameter - possible CSRF attack')
    }

    // Clear state cookie
    response.clearCookie('oauth_state')

    // Get code verifier from cookie (if stored there)
    const storedCodeVerifier = request.cookies?.code_verifier
    const codeVerifier = storedCodeVerifier || dto.codeVerifier

    // Clear code verifier cookie if it was used
    if (storedCodeVerifier) {
      response.clearCookie('code_verifier')
    }

    const result = await this.authenticateUserUseCase.execute({
      authorizationCode: dto.code,
      codeVerifier,
    })

    // Set refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.expiresIn,
      user: {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        roles: result.user.roles,
        isActive: result.user.isActive,
        createdAt: result.user.createdAt.toISOString(),
        updatedAt: result.user.updatedAt.toISOString(),
      },
    }
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({
    status: 201,
    description: 'Tokens refreshed successfully',
    type: TokenResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Invalid or expired refresh token' })
  async refreshTokens(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<TokenResponseDto> {
    const refreshToken = request.cookies?.refreshToken

    if (!refreshToken) {
      throw new Error('Refresh token not found')
    }

    const result = await this.refreshTokensUseCase.execute({
      refreshToken,
    })

    // Set new refresh token in HTTP-only cookie
    response.cookie('refreshToken', result.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    })

    return {
      accessToken: result.accessToken,
      expiresIn: result.expiresIn,
    }
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  @ApiResponse({ status: 200, description: 'Logout successful' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async logout(
    @CurrentUser() user: { id: string },
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.logoutUserUseCase.execute({
      userId: UserId.fromString(user.id),
    })

    // Clear refresh token cookie
    response.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/auth/refresh',
    })

    return {
      message: 'Logout successful',
    }
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
    type: UserResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'User account is deactivated' })
  async getCurrentUser(@CurrentUser() user: { id: string }): Promise<UserResponseDto> {
    const result = await this.getCurrentUserUseCase.execute({
      userId: UserId.fromString(user.id),
    })

    return {
      id: result.user.id,
      email: result.user.email,
      name: result.user.name,
      roles: result.user.roles,
      isActive: result.user.isActive,
      createdAt: result.user.createdAt.toISOString(),
      updatedAt: result.user.updatedAt.toISOString(),
    }
  }
}
