import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common'
import { Observable } from 'rxjs'
import { tap, catchError } from 'rxjs/operators'

/**
 * AuthLoggingInterceptor
 *
 * Logs all authentication events for security monitoring:
 * - Login attempts (success/failure)
 * - Token refresh
 * - Logout events
 * - Protected resource access
 *
 * Includes IP address, user agent, and timestamp
 */
@Injectable()
export class AuthLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuthLoggingInterceptor.name)

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest()
    const { method, url, ip, headers } = request
    const userAgent = headers['user-agent'] || 'unknown'
    const userId = request.user?.id || 'anonymous'

    const logData = {
      method,
      url,
      ip,
      userAgent,
      userId,
      timestamp: new Date().toISOString(),
    }

    return next.handle().pipe(
      tap(() => {
        // Log successful authentication events
        if (url.includes('/auth/callback')) {
          this.logger.log({
            ...logData,
            event: 'authentication_success',
            message: `User ${userId} authenticated successfully`,
          })
        } else if (url.includes('/auth/refresh')) {
          this.logger.log({
            ...logData,
            event: 'token_refresh_success',
            message: `User ${userId} refreshed tokens`,
          })
        } else if (url.includes('/auth/logout')) {
          this.logger.log({
            ...logData,
            event: 'logout_success',
            message: `User ${userId} logged out`,
          })
        }
      }),
      catchError((error) => {
        // Log authentication failures
        if (url.includes('/auth/callback')) {
          this.logger.warn({
            ...logData,
            event: 'authentication_failure',
            message: `Authentication failed: ${error.message}`,
            error: error.name,
          })
        } else if (url.includes('/auth/refresh')) {
          this.logger.warn({
            ...logData,
            event: 'token_refresh_failure',
            message: `Token refresh failed: ${error.message}`,
            error: error.name,
          })
        }
        throw error
      }),
    )
  }
}
