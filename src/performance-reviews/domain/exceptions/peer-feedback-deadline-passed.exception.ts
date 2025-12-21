export class PeerFeedbackDeadlinePassedException extends Error {
  constructor(message: string = 'Peer feedback deadline has passed') {
    super(message)
    this.name = 'PeerFeedbackDeadlinePassedException'
  }
}
