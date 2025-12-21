import { PillarScore } from './pillar-score.vo'

/**
 * PillarScores Value Object
 *
 * Responsibilities:
 * - Container for all 5 pillar scores
 * - Immutable after creation
 * - Value equality support
 *
 * SOLID Principles:
 * - SRP: Only responsible for containing and managing the 5 pillar scores
 * - Domain Layer: Zero dependencies on frameworks
 */
export class PillarScores {
  private constructor(
    private readonly _projectImpact: PillarScore,
    private readonly _direction: PillarScore,
    private readonly _engineeringExcellence: PillarScore,
    private readonly _operationalOwnership: PillarScore,
    private readonly _peopleImpact: PillarScore,
  ) {}

  /**
   * Create PillarScores from individual score values
   * @param scores - Object containing all 5 pillar score values
   * @returns PillarScores instance
   */
  static create(scores: {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  }): PillarScores {
    return new PillarScores(
      PillarScore.fromValue(scores.projectImpact),
      PillarScore.fromValue(scores.direction),
      PillarScore.fromValue(scores.engineeringExcellence),
      PillarScore.fromValue(scores.operationalOwnership),
      PillarScore.fromValue(scores.peopleImpact),
    )
  }

  /**
   * Get project impact score
   */
  get projectImpact(): PillarScore {
    return this._projectImpact
  }

  /**
   * Get direction score
   */
  get direction(): PillarScore {
    return this._direction
  }

  /**
   * Get engineering excellence score
   */
  get engineeringExcellence(): PillarScore {
    return this._engineeringExcellence
  }

  /**
   * Get operational ownership score
   */
  get operationalOwnership(): PillarScore {
    return this._operationalOwnership
  }

  /**
   * Get people impact score
   */
  get peopleImpact(): PillarScore {
    return this._peopleImpact
  }

  /**
   * Convert to plain object
   * @returns Object with all pillar scores as numbers
   */
  toObject(): {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  } {
    return {
      projectImpact: this._projectImpact.value,
      direction: this._direction.value,
      engineeringExcellence: this._engineeringExcellence.value,
      operationalOwnership: this._operationalOwnership.value,
      peopleImpact: this._peopleImpact.value,
    }
  }

  /**
   * Alias for toObject() - Convert to plain object
   * @returns Object with all pillar scores as numbers
   */
  toPlainObject(): {
    projectImpact: number
    direction: number
    engineeringExcellence: number
    operationalOwnership: number
    peopleImpact: number
  } {
    return this.toObject()
  }

  /**
   * Check equality with another PillarScores
   * @param other - PillarScores to compare with
   * @returns true if all pillar scores are equal
   */
  equals(other: PillarScores): boolean {
    if (!other) {
      return false
    }

    return (
      this._projectImpact.equals(other._projectImpact) &&
      this._direction.equals(other._direction) &&
      this._engineeringExcellence.equals(other._engineeringExcellence) &&
      this._operationalOwnership.equals(other._operationalOwnership) &&
      this._peopleImpact.equals(other._peopleImpact)
    )
  }
}
