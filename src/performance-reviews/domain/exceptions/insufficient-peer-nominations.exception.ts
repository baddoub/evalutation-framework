export class InsufficientPeerNominationsException extends Error {
  constructor(message = 'Must nominate between 3-5 peers') {
    super(message)
    this.name = 'InsufficientPeerNominationsException'
  }
}
