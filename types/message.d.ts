import type { User } from '~/types/user'
import type { ConversationId } from '~/types/conversationId';

export interface Message {
    id: number;
    content: string;
    user: User;
    conversation: ConversationId;
    created_at: string;
    updated_at: string;
}