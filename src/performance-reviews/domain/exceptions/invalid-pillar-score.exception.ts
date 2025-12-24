export class InvalidPillarScoreException extends Error {
  constructor(message = 'Pillar score must be between 0 and 4') {
    super(message)
    this.name = 'InvalidPillarScoreException'
  }
}
