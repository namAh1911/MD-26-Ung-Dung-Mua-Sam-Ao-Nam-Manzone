import axios from 'axios';
import { BASE_URL } from './config';

// API endpoints
const API_ENDPOINTS = {
  CHAT: '/api/chat',
  AUTH: '/api/auth',
  PRODUCTS: '/api/products',
  ORDERS: '/api/orders',
  USERS: '/api/users',
  ADMIN: '/api/admin'
};

// Types for chat messages
export interface ChatMessage {
  message_id: string;
  text: string;
  is_user: boolean;
  timestamp: Date;
  response_type?: string;
  sub_answers?: string[];
  follow_up_questions?: string[];
  admin_id?: string;
}

export interface AdminChatMessage {
  message_id: string;
  text: string;
  is_user: boolean;
  timestamp: Date;
  response_type?: string;
  admin_id?: string;
  user_id?: string;
}

// Simple API client for chat operations
class ChatAPIClient {
  private baseURL: string;

  constructor() {
    this.baseURL = BASE_URL;
  }

  // Helper method to get auth headers
  private getAuthHeaders(token: string) {
    return {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    };
  }

  // Create a new chat session
  async createChatSession(token: string): Promise<{ sessionId: string; messages: ChatMessage[] }> {
    try {
      const response = await axios.post(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/sessions`,
        {},
        this.getAuthHeaders(token)
      );

      if (response.data.success) {
        return {
          sessionId: response.data.data.sessionId,
          messages: response.data.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        };
      } else {
        throw new Error(response.data.message || 'Failed to create chat session');
      }
    } catch (error: any) {
      console.error('Error creating chat session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create chat session'
      );
    }
  }

  // Get chat history for a session
  async getChatHistory(sessionId: string, token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/sessions/${sessionId}`,
        this.getAuthHeaders(token)
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          ...data,
          lastActivity: new Date(data.lastActivity),
          messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        };
      } else {
        throw new Error(response.data.message || 'Failed to get chat history');
      }
    } catch (error: any) {
      console.error('Error getting chat history:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get chat history'
      );
    }
  }

  // Send a message - FIXED to handle both bot and admin chat
  async sendMessage(sessionId: string, message: string, token: string): Promise<any> {
    try {
      // Kiểm tra nếu là admin chat session
      if (sessionId.includes('admin_')) {
        // Sử dụng admin chat endpoint
        const response = await axios.post(
          `${this.baseURL}${API_ENDPOINTS.CHAT}/admin/sessions/${sessionId}/messages`,
          { message },
          this.getAuthHeaders(token)
        );
        
        if (response.data.success) {
          return {
            message: {
              ...response.data.data.message,
              timestamp: new Date(response.data.data.message.timestamp),
            },
          };
        } else {
          throw new Error(response.data.message || 'Failed to send admin message');
        }
      } else {
        // Sử dụng bot chat endpoint
        const response = await axios.post(
          `${this.baseURL}${API_ENDPOINTS.CHAT}/sessions/${sessionId}/messages`,
          { message },
          this.getAuthHeaders(token)
        );

        if (response.data.success) {
          return {
            message: {
              ...response.data.data.message,
              timestamp: new Date(response.data.data.message.timestamp),
            },
          };
        } else {
          throw new Error(response.data.message || 'Failed to send message');
        }
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message'
      );
    }
  }

  // Create a new user admin chat session
  async createUserAdminChatSession(token: string): Promise<{ sessionId: string; messages: AdminChatMessage[]; isExisting: boolean }> {
    try {
      const response = await axios.post(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/user-admin-sessions`,
        {},
        this.getAuthHeaders(token)
      );

      if (response.data.success) {
        return {
          sessionId: response.data.data.sessionId,
          messages: response.data.data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
          isExisting: response.data.data.isExisting || false
        };
      } else {
        throw new Error(response.data.message || 'Failed to create user admin chat session');
      }
    } catch (error: any) {
      console.error('Error creating user admin chat session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to create user admin chat session'
      );
    }
  }

  // Get admin chat history for a session
  async getAdminChatHistory(sessionId: string, token: string): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/admin/sessions/${sessionId}`,
        this.getAuthHeaders(token)
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          ...data,
          lastActivity: new Date(data.lastActivity),
          messages: data.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        };
      } else {
        throw new Error(response.data.message || 'Failed to get admin chat history');
      }
    } catch (error: any) {
      console.error('Error getting admin chat history:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get admin chat history'
      );
    }
  }

  // Send a message to admin chat (for users)
  async sendAdminMessage(sessionId: string, message: string, token: string): Promise<any> {
    try {
      const response = await axios.post(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/admin/sessions/${sessionId}/messages`,
        { message },
        this.getAuthHeaders(token)
      );

      if (response.data.success) {
        return {
          message: {
            ...response.data.data.message,
            timestamp: new Date(response.data.data.message.timestamp),
          },
        };
      } else {
        throw new Error(response.data.message || 'Failed to send admin message');
      }
    } catch (error: any) {
      console.error('Error sending admin message:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send admin message'
      );
    }
  }

  // Get all admin chat sessions for user
  async getAdminChatSessions(token: string, page: number = 1, limit: number = 10): Promise<any> {
    try {
      const response = await axios.get(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/admin/sessions?page=${page}&limit=${limit}`,
        this.getAuthHeaders(token)
      );

      if (response.data.success) {
        const data = response.data.data;
        return {
          sessions: data.sessions.map((session: any) => ({
            ...session,
            last_activity: new Date(session.last_activity),
            last_message: session.last_message ? {
              ...session.last_message,
              timestamp: new Date(session.last_message.timestamp),
            } : undefined,
          })),
          pagination: data.pagination,
        };
      } else {
        throw new Error(response.data.message || 'Failed to get admin chat sessions');
      }
    } catch (error: any) {
      console.error('Error getting admin chat sessions:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get admin chat sessions'
      );
    }
  }

  // Close a chat session
  async closeChatSession(sessionId: string, token: string): Promise<void> {
    try {
      const response = await axios.patch(
        `${this.baseURL}${API_ENDPOINTS.CHAT}/sessions/${sessionId}/close`,
        {},
        this.getAuthHeaders(token)
      );

      if (!response.data.success) {
        throw new Error(response.data.message || 'Failed to close chat session');
      }
    } catch (error: any) {
      console.error('Error closing chat session:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to close chat session'
      );
    }
  }
}

export const chatAPI = new ChatAPIClient();
