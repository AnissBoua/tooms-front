import type { User } from '~/types/user'

export interface WSMsg {
    conversation: number;
    content: string;
    user: number;
}