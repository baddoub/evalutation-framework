"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PeerNominationNotFoundException = void 0;
class PeerNominationNotFoundException extends Error {
    constructor(message = 'Peer nomination not found') {
        super(message);
        this.name = 'PeerNominationNotFoundException';
    }
}
exports.PeerNominationNotFoundException = PeerNominationNotFoundException;
//# sourceMappingURL=peer-nomination-not-found.exception.js.map