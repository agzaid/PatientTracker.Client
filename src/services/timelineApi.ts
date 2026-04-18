import apiClient from './apiClient';

// Timeline interfaces matching backend DTOs
export interface TimelineItemDto {
  id: number;
  userId: number;
  type: 'medication' | 'lab_test' | 'radiology' | 'diagnosis' | 'surgery';
  title: string;
  description?: string;
  date: string;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

const timelineApi = {
  // Get timeline items for the current user with optional filters
  getTimeline: async (typeFilter?: string, dateRange?: string): Promise<TimelineItemDto[]> => {
    const params = new URLSearchParams();
    if (typeFilter) params.append('typeFilter', typeFilter);
    if (dateRange) params.append('dateRange', dateRange);
    
    const response = await apiClient.get<TimelineItemDto[]>(`/timeline?${params.toString()}`);
    return response.data;
  },
};

export { timelineApi };
