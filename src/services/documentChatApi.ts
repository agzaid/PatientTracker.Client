import apiClient from './apiClient';

export interface SendMessageRequest {
  documentId: number;
  message: string;
  includeHistory?: boolean;
}

export interface ChatMessage {
  id: number;
  documentId: number;
  userId: number;
  message: string;
  response: string;
  timestamp: string;
}

export interface SendMessageResponse {
  answer: string;
  timestamp: string;
  history: ChatMessage[];
}

export interface ChatHistoryResponse {
  messages: ChatMessage[];
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

export const documentChatApi = {
  // Send a message to the AI about a document
  sendMessage: async (request: SendMessageRequest): Promise<SendMessageResponse> => {
    try {
      const response = await apiClient.post<SendMessageResponse>('/documentchat', {
        documentId: request.documentId,
        message: request.message,
        includeHistory: request.includeHistory ?? true
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to send message' };
    }
  },

  // Get chat history for a document
  getHistory: async (documentId: number, pageNumber: number = 1, pageSize: number = 10): Promise<ChatHistoryResponse> => {
    try {
      const response = await apiClient.get<ChatHistoryResponse>(`/documentchat/history`, {
        params: { DocumentId: documentId, Page: pageNumber, PageSize: pageSize }
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch chat history' };
    }
  },

  // Delete chat history for a document
  deleteHistory: async (documentId: number): Promise<void> => {
    try {
      await apiClient.delete(`/documentchat/history`, {
        params: { DocumentId: documentId }
      });
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete chat history' };
    }
  }
};
