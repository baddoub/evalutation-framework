import { Test, TestingModule } from '@nestjs/testing'
import { ExecutionContext, CallHandler } from '@nestjs/common'
import { of, throwError } from 'rxjs'
import { AuthLoggingInterceptor } from './auth-logging.interceptor'

describe('AuthLoggingInterceptor', () => {
  let interceptor: AuthLoggingInterceptor

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthLoggingInterceptor],
    }).compile()

    interceptor = module.get<AuthLoggingInterceptor>(AuthLoggingInterceptor)
  })

  const createMockContext = (url: string, userId?: string): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({
          method: 'POST',
          url,
          ip: '127.0.0.1',
          headers: {
            'user-agent': 'test-agent',
          },
          user: userId ? { id: userId } : undefined,
        }),
      }),
    } as any
  }

  const createMockCallHandler = (result?: any): CallHandler => {
    return {
      handle: () => of(result || {}),
    } as any
  }

  it('should log authentication success', (done) => {
    const context = createMockContext('/auth/callback', 'user-123')
    const handler = createMockCallHandler()
    const logSpy = jest.spyOn(interceptor['logger'], 'log')

    interceptor.intercept(context, handler).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'authentication_success',
          userId: 'user-123',
        }),
      )
      done()
    })
  })

  it('should log token refresh success', (done) => {
    const context = createMockContext('/auth/refresh', 'user-123')
    const handler = createMockCallHandler()
    const logSpy = jest.spyOn(interceptor['logger'], 'log')

    interceptor.intercept(context, handler).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'token_refresh_success',
          userId: 'user-123',
        }),
      )
      done()
    })
  })

  it('should log logout success', (done) => {
    const context = createMockContext('/auth/logout', 'user-123')
    const handler = createMockCallHandler()
    const logSpy = jest.spyOn(interceptor['logger'], 'log')

    interceptor.intercept(context, handler).subscribe(() => {
      expect(logSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          event: 'logout_success',
          userId: 'user-123',
        }),
      )
      done()
    })
  })

  it('should log authentication failure', (done) => {
    const context = createMockContext('/auth/callback')
    const handler = {
      handle: () => throwError(() => new Error('Invalid credentials')),
    } as CallHandler
    const warnSpy = jest.spyOn(interceptor['logger'], 'warn')

    interceptor.intercept(context, handler).subscribe({
      error: () => {
        expect(warnSpy).toHaveBeenCalledWith(
          expect.objectContaining({
            event: 'authentication_failure',
            message: 'Authentication failed: Invalid credentials',
          }),
        )
        done()
      },
    })
  })
})
