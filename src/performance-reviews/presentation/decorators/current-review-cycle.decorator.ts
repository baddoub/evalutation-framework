import type { ExecutionContext } from '@nestjs/common'
import { createParamDecorator } from '@nestjs/common'

/**
 * Decorator to extract the current review cycle from request.
 * This should be used in conjunction with middleware/interceptor that loads the cycle.
 */
export const CurrentReviewCycle = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest()
  return request.reviewCycle
})
