import type { UserId } from '../../../auth/domain/value-objects/user-id.vo'
import type { Role } from '../../../auth/domain/value-objects/role.vo'
import type { SelfReview } from '../entities/self-review.entity'
import type { ManagerEvaluation } from '../entities/manager-evaluation.entity'

export interface AuthorizedUser {
  id: UserId
  roles: Role[]
  managerId?: UserId
}

/**
 * ReviewAuthorizationService
 *
 * Responsibilities:
 * - Determine if users can view, edit, or calibrate reviews
 * - Enforce role-based and relationship-based access control
 * - Protect peer feedback anonymity
 *
 * SOLID Principles:
 * - SRP: Only responsible for authorization decisions
 * - Domain Layer: Zero dependencies on frameworks
 */
export class ReviewAuthorizationService {
  /**
   * Check if user can view a self review
   * Rules:
   * - Employee can view their own review
   * - Manager can view their reports' reviews
   * - HR Admin can view all reviews
   * - Calibrators can view reviews in calibration sessions they participate in
   */
  canViewSelfReview(user: AuthorizedUser, review: SelfReview): boolean {
    // Employee can view own review
    if (review.userId.equals(user.id)) {
      return true
    }

    // HR Admin can view all
    if (this.hasRole(user, 'admin')) {
      return true
    }

    // Manager can view reports' reviews (would need to check manager hierarchy)
    // This would typically require querying the user repository to check if
    // the review's userId has the current user as their manager
    // For now, return false (this logic would be in the application layer)

    return false
  }

  /**
   * Check if user can submit peer feedback for a reviewee
   * Rules:
   * - Cannot review self
   * - Cannot review direct manager
   * - Must be nominated (checked in application layer)
   */
  canSubmitPeerFeedback(
    reviewerId: UserId,
    revieweeId: UserId,
    revieweeManagerId?: UserId,
  ): boolean {
    // Cannot review self
    if (revieweeId.equals(reviewerId)) {
      return false
    }

    // Cannot review your manager
    if (revieweeManagerId && revieweeManagerId.equals(reviewerId)) {
      return false
    }

    return true
  }

  /**
   * Check if user can calibrate scores
   * Rules:
   * - HR Admin can calibrate all
   * - Calibrators (senior leadership) can calibrate
   * - Managers can calibrate in their calibration sessions
   */
  canCalibrateScores(user: AuthorizedUser, _evaluation: ManagerEvaluation): boolean {
    // HR Admin can calibrate all
    if (this.hasRole(user, 'admin')) {
      return true
    }

    // Manager role can calibrate (would be further restricted by calibration session participation)
    if (this.hasRole(user, 'manager')) {
      return true
    }

    return false
  }

  /**
   * Check if user can request score adjustment (after calibration)
   * Rules:
   * - Manager can request adjustment for their reports
   */
  canRequestScoreAdjustment(user: AuthorizedUser, employeeManagerId?: UserId): boolean {
    // User must be the employee's manager
    if (employeeManagerId && employeeManagerId.equals(user.id)) {
      return true
    }

    return false
  }

  /**
   * Check if user can approve score adjustment requests
   * Rules:
   * - Only HR Admin can approve
   */
  canApproveScoreAdjustment(user: AuthorizedUser): boolean {
    return this.hasRole(user, 'admin')
  }

  /**
   * Check if user can view manager evaluation
   * Rules:
   * - Manager who wrote it can view
   * - Employee being evaluated can view (after it's submitted/calibrated)
   * - HR Admin can view all
   * - Calibrators can view during calibration
   */
  canViewManagerEvaluation(
    user: AuthorizedUser,
    evaluation: ManagerEvaluation,
    allowEmployeeView: boolean = false,
  ): boolean {
    // Manager who wrote it
    if (evaluation.managerId.equals(user.id)) {
      return true
    }

    // Employee being evaluated (if allowed - typically after submission)
    if (allowEmployeeView && evaluation.employeeId.equals(user.id)) {
      return true
    }

    // HR Admin
    if (this.hasRole(user, 'admin')) {
      return true
    }

    return false
  }

  /**
   * Helper method to check if user has a specific role
   */
  private hasRole(user: AuthorizedUser, roleName: string): boolean {
    return user.roles.some((role) => role.value === roleName)
  }
}
