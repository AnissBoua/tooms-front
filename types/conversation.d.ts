import type { User } from '~/types/user'
import type { Message } from '~/types/message'

export interface Conversation {
    id: number;
    name: string;
    participants: User[];
    messages: Message[];
    page: number;
}