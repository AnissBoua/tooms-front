import type { User } from "../user";

export interface RTCStream {
    stream: MediaStream;
    signal: RTCSignal | null;
}