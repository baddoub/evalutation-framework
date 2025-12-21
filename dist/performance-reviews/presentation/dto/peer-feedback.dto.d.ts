export declare class NominatePeersRequestDto {
    peerIds: string[];
}
export declare class SubmitPeerFeedbackRequestDto {
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    comments: string;
}
export declare class PeerNominationResponseDto {
    id: string;
    cycleId: string;
    nomineeId: string;
    peerId: string;
    peerEmail: string;
    peerName: string;
    status: string;
    submittedAt: string | null;
}
export declare class PeerFeedbackResponseDto {
    id: string;
    nominationId: string;
    projectImpact: number;
    direction: number;
    engineeringExcellence: number;
    operationalOwnership: number;
    peopleImpact: number;
    comments: string;
    submittedAt: string;
    createdAt: string;
}
export declare class AggregatedPeerFeedbackResponseDto {
    avgProjectImpact: number;
    avgDirection: number;
    avgEngineeringExcellence: number;
    avgOperationalOwnership: number;
    avgPeopleImpact: number;
    totalResponses: number;
    anonymousComments: string[];
}
