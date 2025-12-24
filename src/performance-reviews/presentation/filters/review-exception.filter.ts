import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus, Logger } from '@nestjs/common'
import { Response } from 'express'
import {
  ReviewNotFoundException,
  ReviewCycleNotFoundException,
  DeadlinePassedException,
  InvalidPillarScoreException,
  NarrativeExceedsWordLimitException,
  InsufficientPeerNominationsException,
  CannotNominateSelfException,
  CannotNominateManagerException,
  ReviewAlreadySubmittedException,
  IncompleteReviewException,
  UnauthorizedAccessException,
} from '../../domain/exceptions'

@Catch()
export class ReviewExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(ReviewExceptionFilter.name)

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()
    const request = ctx.getRequest<Request>()

    // Log all exceptions for debugging
    this.logger.error('Exception caught in ReviewExceptionFilter:', exception)
    if (exception instanceof Error) {
      this.logger.error('Stack trace:', exception.stack)
    }

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let message = 'Internal server error'
    let error = 'Internal Server Error'
    let additionalData: Record<string, unknown> = {}

    // Map domain exceptions to HTTP responses
    if (exception instanceof ReviewNotFoundException) {
      status = HttpStatus.NOT_FOUND
      message = exception.message
      error = 'Not Found'
    } else if (exception instanceof ReviewCycleNotFoundException) {
      status = HttpStatus.NOT_FOUND
      message = exception.message
      error = 'Not Found'
    } else if (exception instanceof DeadlinePassedException) {
      status = HttpStatus.FORBIDDEN
      message = exception.message
      error = 'Forbidden'
      additionalData = { deadline: exception.deadline.toISOString() }
    } else if (exception instanceof InvalidPillarScoreException) {
      status = HttpStatus.BAD_REQUEST
      message = exception.message
      error = 'Bad Request'
    } else if (exception instanceof NarrativeExceedsWordLimitException) {
      status = HttpStatus.BAD_REQUEST
      message = exception.message
      error = 'Bad Request'
      additionalData = { wordCount: exception.wordCount, maxWords: exception.maxWords }
    } else if (exception instanceof InsufficientPeerNominationsException) {
      status = HttpStatus.BAD_REQUEST
      message = exception.message
      error = 'Bad Request'
    } else if (exception instanceof CannotNominateSelfException) {
      status = HttpStatus.BAD_REQUEST
      message = exception.message
      error = 'Bad Request'
    } else if (exception instanceof CannotNominateManagerException) {
      status = HttpStatus.BAD_REQUEST
      message = exception.message
      error = 'Bad Request'
    } else if (exception instanceof ReviewAlreadySubmittedException) {
      status = HttpStatus.CONFLICT
      message = exception.message
      error = 'Conflict'
    } else if (exception instanceof IncompleteReviewException) {
      status = HttpStatus.BAD_REQUEST
      message = exception.message
      error = 'Bad Request'
    } else if (exception instanceof UnauthorizedAccessException) {
      status = HttpStatus.FORBIDDEN
      message = exception.message
      error = 'Forbidden'
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
      ...additionalData,
    })
  }
}
