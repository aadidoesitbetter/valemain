import axios from 'axios';

const API_BASE_URL = 'http://localhost:8001/v1';

export type RoleType = 'core' | 'personal';

export interface ChatResponse {
    role: RoleType;
    reply: str;
    model: str;
    env: str;
    used_web_search: boolean;
}

export const api = {
    chat: async (role: RoleType, message: string, userId?: string): Promise<ChatResponse> => {
        try {
            const response = await axios.post(`${API_BASE_URL}/chat/${role}`, {
                role,
                message,
                user_id: userId,
            });
            return response.data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
};
