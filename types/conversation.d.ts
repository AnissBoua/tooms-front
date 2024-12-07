import type { User } from '~/types/user'
import type { Message } from '~/types/message'

export interface Conversation {
    id: string;
    participants: User[];
    messages: Message[];
}