import { PillarScores } from '../value-objects/pillar-scores.vo'
import { EngineerLevel } from '../value-objects/engineer-level.vo'
import { WeightedScore } from '../value-objects/weighted-score.vo'

export interface PillarWeights {
  projectImpact: number
  direction: number
  engineeringExcellence: number
  operationalOwnership: number
  peopleImpact: number
}

/**
 * ScoreCalculationService
 *
 * Responsibilities:
 * - Calculate weighted scores based on engineer level
 * - Apply level-specific weights to pillar scores
 *
 * SOLID Principles:
 * - SRP: Only responsible for score calculations
 * - Domain Layer: Zero dependencies on frameworks
 */
export class ScoreCalculationService {
  /**
   * Level-specific weights
   * Each level emphasizes different pillars based on role expectations
   * All weights must sum to 1.0
   */
  private static readonly WEIGHTS_BY_LEVEL: Record<string, PillarWeights> = {
    JUNIOR: {
      projectImpact: 0.20,        // Learning and contributing
      direction: 0.10,            // Limited strategic responsibility
      engineeringExcellence: 0.25, // Technical growth and code quality
      operationalOwnership: 0.20,  // Building good habits
      peopleImpact: 0.25,         // Collaboration and learning from others
    },
    MID: {
      projectImpact: 0.25,        // Growing impact
      direction: 0.15,            // Beginning to influence direction
      engineeringExcellence: 0.25, // Strong technical contribution
      operationalOwnership: 0.20,  // More ownership
      peopleImpact: 0.15,         // Mentoring juniors
    },
    SENIOR: {
      projectImpact: 0.30,        // Significant impact on projects
      direction: 0.20,            // Influencing technical direction
      engineeringExcellence: 0.20, // Expertise and best practices
      operationalOwnership: 0.15,  // Systems thinking
      peopleImpact: 0.15,         // Mentoring and leadership
    },
    LEAD: {
      projectImpact: 0.30,        // Strategic impact across teams
      direction: 0.25,            // Leading technical direction
      engineeringExcellence: 0.20, // Setting standards
      operationalOwnership: 0.15,  // Process improvement
      peopleImpact: 0.10,         // Enabling team growth
    },
    MANAGER: {
      projectImpact: 0.35,        // Impact through team delivery
      direction: 0.25,            // Strategic planning
      engineeringExcellence: 0.15, // Enabling excellence
      operationalOwnership: 0.10,  // Process optimization
      peopleImpact: 0.15,         // Team development and growth
    },
  }

  /**
   * Calculate weighted score based on pillar scores and engineer level
   * @param pillarScores - The five pillar scores
   * @param level - Engineer level
   * @returns Weighted score (0-4)
   */
  calculateWeightedScore(
    pillarScores: PillarScores,
    level: EngineerLevel,
  ): WeightedScore {
    const weights = this.getWeightsForLevel(level)
    
    const weighted =
      pillarScores.projectImpact.value * weights.projectImpact +
      pillarScores.direction.value * weights.direction +
      pillarScores.engineeringExcellence.value * weights.engineeringExcellence +
      pillarScores.operationalOwnership.value * weights.operationalOwnership +
      pillarScores.peopleImpact.value * weights.peopleImpact

    return WeightedScore.fromValue(weighted)
  }

  /**
   * Get weights for a specific engineer level
   * @param level - Engineer level
   * @returns Pillar weights
   */
  private getWeightsForLevel(level: EngineerLevel): PillarWeights {
    const weights = ScoreCalculationService.WEIGHTS_BY_LEVEL[level.value]
    if (!weights) {
      throw new Error(`No weights defined for level: ${level.value}`)
    }
    return weights
  }

  /**
   * Get all defined weights (useful for testing and documentation)
   * @returns All level-specific weights
   */
  static getAllWeights(): Record<string, PillarWeights> {
    return { ...ScoreCalculationService.WEIGHTS_BY_LEVEL }
  }
}
