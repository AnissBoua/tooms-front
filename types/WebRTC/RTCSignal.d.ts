import type { User } from "../user";

export interface RTCSignal {
    stream_id: string;
    user: User;
    conversation: number;
    data: RTCSessionDescriptionInit;
    audio: boolean;
    video: boolean;
    screen: boolean;
    negotiation: boolean;
}