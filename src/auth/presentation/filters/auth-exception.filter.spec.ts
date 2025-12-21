import { Test, TestingModule } from '@nestjs/testing'
import { ArgumentsHost, HttpStatus } from '@nestjs/common'
import { AuthExceptionFilter } from './auth-exception.filter'
import { AuthenticationFailedException } from '../../application/exceptions/authentication-failed.exception'
import { TokenExpiredException } from '../../application/exceptions/token-expired.exception'
import { UserDeactivatedException } from '../../application/exceptions/user-deactivated.exception'

describe('AuthExceptionFilter', () => {
  let filter: AuthExceptionFilter

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuthExceptionFilter],
    }).compile()

    filter = module.get<AuthExceptionFilter>(AuthExceptionFilter)
  })

  const mockResponse = () => {
    const res: any = {}
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
  }

  const mockArgumentsHost = (response: any): ArgumentsHost => {
    return {
      switchToHttp: () => ({
        getResponse: () => response,
        getRequest: () => ({
          url: '/auth/callback',
        }),
      }),
    } as any
  }

  it('should map AuthenticationFailedException to 401', () => {
    const response = mockResponse()
    const host = mockArgumentsHost(response)
    const exception = new AuthenticationFailedException('Invalid credentials')

    filter.catch(exception, host)

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Invalid credentials',
        error: 'Unauthorized',
      }),
    )
  })

  it('should map TokenExpiredException to 401', () => {
    const response = mockResponse()
    const host = mockArgumentsHost(response)
    const exception = new TokenExpiredException('Token expired')

    filter.catch(exception, host)

    expect(response.status).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNAUTHORIZED,
        message: 'Token has expired',
      }),
    )
  })

  it('should map UserDeactivatedException to 403', () => {
    const response = mockResponse()
    const host = mockArgumentsHost(response)
    const exception = new UserDeactivatedException('User deactivated')

    filter.catch(exception, host)

    expect(response.status).toHaveBeenCalledWith(HttpStatus.FORBIDDEN)
    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.FORBIDDEN,
        message: 'User account is deactivated',
        error: 'Forbidden',
      }),
    )
  })

  it('should include timestamp and path', () => {
    const response = mockResponse()
    const host = mockArgumentsHost(response)
    const exception = new AuthenticationFailedException('Test')

    filter.catch(exception, host)

    expect(response.json).toHaveBeenCalledWith(
      expect.objectContaining({
        timestamp: expect.any(String),
        path: '/auth/callback',
      }),
    )
  })
})
