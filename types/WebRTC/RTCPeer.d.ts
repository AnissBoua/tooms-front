import type { User } from "../user";

export interface RTCPeer {
    user: User;
    peer: RTCPeerConnection;
    candidates: RTCIceCandidate[];
}