import type { User } from '~/types/user'
import type { Message } from '~/types/message'

export interface ReadReceipt {
    user: number;
    last_read_at: string;
}

export interface Call {
    id: number;
    initiator: User;
    type: 'audio' | 'video';
    connected: boolean;
    started_at: string;
    ended_at: string | null;
}

export interface Conversation {
    id: number;
    name: string;
    created_at: string;
    participants: User[];
    messages: Message[];
    lastMessage?: Message | null;
    messageCount?: number;
    unread?: number;
    readReceipts?: ReadReceipt[];
    calls?: Call[];
    callCount?: number;
    // Whether the initial message page has ever been fetched for this conversation - distinct
    // from `messages.length`, since a message can arrive live (via the websocket) and get
    // pushed into `messages` before the conversation has ever actually been opened/fetched.
    loaded?: boolean;
    page: number;
}