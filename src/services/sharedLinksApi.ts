import apiClient from './apiClient';

// Shared links interfaces matching backend DTOs
export interface SharedLinkDto {
  id: number;
  token: string;
  expiresAt?: string;
  categories: string[];
  isActive: boolean;
  accessCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSharedLinkRequest {
  categories: string[];
  expiry: string; // 24h, 7d, 30d, never
}

const sharedLinksApi = {
  // Get all shared links for the current user
  getSharedLinks: async (): Promise<SharedLinkDto[]> => {
    try {
      const response = await apiClient.get<SharedLinkDto[]>('/sharedlinks');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch shared links' };
    }
  },

  // Create a new shared link
  createSharedLink: async (request: CreateSharedLinkRequest): Promise<SharedLinkDto> => {
    try {
      const response = await apiClient.post<SharedLinkDto>('/sharedlinks', request);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to create shared link' };
    }
  },

  // Delete a shared link
  deleteSharedLink: async (id: number): Promise<void> => {
    try {
      await apiClient.delete(`/sharedlinks/${id}`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete shared link' };
    }
  },

  // Toggle shared link active status
  toggleSharedLink: async (id: number): Promise<void> => {
    try {
      await apiClient.put(`/sharedlinks/${id}/toggle`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to toggle shared link' };
    }
  },
};

export { sharedLinksApi };
