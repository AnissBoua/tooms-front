import type { User } from '~/types/user'

export interface Message {
    id: string;
    content: string;
    user: User;
    created_at: string;
    updated_at: string;
}