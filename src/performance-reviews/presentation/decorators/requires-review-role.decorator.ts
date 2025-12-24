import { SetMetadata } from '@nestjs/common'

export const REVIEW_ROLES_KEY = 'review_roles'

/**
 * Decorator to specify required roles for review endpoints.
 * Works with ReviewAuthorizationGuard.
 *
 * @example
 * @RequiresReviewRole('HR_ADMIN', 'MANAGER')
 * @Get('team-reviews')
 * async getTeamReviews() { ... }
 */
export const RequiresReviewRole = (...roles: string[]) => SetMetadata(REVIEW_ROLES_KEY, roles)
