import apiClient from './apiClient';
import { PaginatedResponse } from '@/interfaces/pagination';

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
  // Get timeline items for the current user with optional filters and pagination
  getTimeline: async (page: number = 1, pageSize: number = 10, typeFilter?: string, dateRange?: string, search?: string): Promise<PaginatedResponse<TimelineItemDto>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (typeFilter) params.append('typeFilter', typeFilter);
    if (dateRange) params.append('dateRange', dateRange);
    if (search) params.append('search', search);
    
    const response = await apiClient.get<PaginatedResponse<TimelineItemDto>>(`/timeline?${params.toString()}`);
    return response.data;
  },
};

export { timelineApi };
