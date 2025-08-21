import axios from 'axios';
import { BASE_URL } from './config';

export interface ChatMessage {
  message_id: string;
  text: string;
  is_user: boolean;
  timestamp: Date;
  response_type?: string;
  sub_answers?: string[];
  follow_up_questions?: string[];
}

export interface ChatSession {
  session_id: string;
  last_activity: Date;
  total_messages: number;
  status: 'active' | 'closed' | 'archived';
  last_message?: {
    text: string;
    is_user: boolean;
    timestamp: Date;
  };
}

export interface ChatHistoryResponse {
  sessionId: string;
  messages: ChatMessage[];
  totalMessages: number;
  lastActivity: Date;
  status: string;
}

export interface SendMessageResponse {
  message: ChatMessage;
}

export interface ChatSessionsResponse {
  sessions: ChatSession[];
  pagination: {
    current_page: number;
    total_pages: number;
    total_sessions: number;
    has_next: boolean;
    has_prev: boolean;
  };
}

class ChatAPI {
  private baseURL: string;

  constructor() {
    this.baseURL = `${BASE_URL}/api/chat`;
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
        `${this.baseURL}/sessions`,
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
  async getChatHistory(sessionId: string, token: string): Promise<ChatHistoryResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/sessions/${sessionId}`,
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

  // Send a message
  async sendMessage(sessionId: string, message: string, token: string): Promise<SendMessageResponse> {
    try {
      const response = await axios.post(
        `${this.baseURL}/sessions/${sessionId}/messages`,
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
    } catch (error: any) {
      console.error('Error sending message:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to send message'
      );
    }
  }

  // Get all chat sessions for user
  async getChatSessions(token: string, page: number = 1, limit: number = 10): Promise<ChatSessionsResponse> {
    try {
      const response = await axios.get(
        `${this.baseURL}/sessions?page=${page}&limit=${limit}`,
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
        throw new Error(response.data.message || 'Failed to get chat sessions');
      }
    } catch (error: any) {
      console.error('Error getting chat sessions:', error);
      throw new Error(
        error.response?.data?.message || 
        error.message || 
        'Failed to get chat sessions'
      );
    }
  }

  // Close a chat session
  async closeChatSession(sessionId: string, token: string): Promise<void> {
    try {
      const response = await axios.patch(
        `${this.baseURL}/sessions/${sessionId}/close`,
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

export const chatAPI = new ChatAPI();
