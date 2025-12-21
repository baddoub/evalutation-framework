import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common'
import { Response } from 'express'
import { AuthenticationFailedException } from '../../application/exceptions/authentication-failed.exception'
import { TokenExpiredException } from '../../application/exceptions/token-expired.exception'
import { UserNotFoundException } from '../../application/exceptions/user-not-found.exception'
import { UserDeactivatedException } from '../../application/exceptions/user-deactivated.exception'
import { TokenTheftDetectedException } from '../../application/exceptions/token-theft-detected.exception'
import { KeycloakIntegrationException } from '../../infrastructure/exceptions/keycloak-integration.exception'
import { InvalidTokenException } from '../../infrastructure/exceptions/invalid-token.exception'

@Catch()
export class AuthExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'Internal Server Error'

    // Map domain/application exceptions to HTTP responses
    if (exception instanceof AuthenticationFailedException) {
      status = HttpStatus.UNAUTHORIZED
      message = exception.message
      error = 'Unauthorized'
    } else if (exception instanceof TokenExpiredException) {
      status = HttpStatus.UNAUTHORIZED
      message = 'Token has expired'
      error = 'Unauthorized'
    } else if (exception instanceof InvalidTokenException) {
      status = HttpStatus.UNAUTHORIZED
      message = 'Invalid token'
      error = 'Unauthorized'
    } else if (exception instanceof UserNotFoundException) {
      status = HttpStatus.UNAUTHORIZED
      message = 'User not found'
      error = 'Unauthorized'
    } else if (exception instanceof UserDeactivatedException) {
      status = HttpStatus.FORBIDDEN
      message = 'User account is deactivated'
      error = 'Forbidden'
    } else if (exception instanceof TokenTheftDetectedException) {
      status = HttpStatus.UNAUTHORIZED
      message = 'Token reuse detected - all sessions revoked'
      error = 'Unauthorized'
    } else if (exception instanceof KeycloakIntegrationException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR
      message =
        'Authentication service is temporarily unavailable. Please try again in a few moments.'
      error = 'Internal Server Error'
    } else if (exception instanceof HttpException) {
      status = exception.getStatus()
      const exceptionResponse = exception.getResponse()
      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse
      } else if (typeof exceptionResponse === 'object') {
        message = (exceptionResponse as any).message || exception.message
        error = (exceptionResponse as any).error || error
      }
    }

    response.status(status).json({
      statusCode: status,
      message,
      error,
      timestamp: new Date().toISOString(),
      path: request.url,
    })
  }
}
