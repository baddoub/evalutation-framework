export class PeerNominationNotFoundException extends Error {
  constructor(message: string = 'Peer nomination not found') {
    super(message)
    this.name = 'PeerNominationNotFoundException'
  }
}
