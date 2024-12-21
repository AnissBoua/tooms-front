import type { User } from "../user";

export interface RTCSignalRequest {
    ids: string[];
    user: User;
    conversation: number;
}