import apiClient from './apiClient';

// Lab test interfaces matching backend DTOs
export interface LabTestDto {
  id: number;
  userId: number;
  testName: string;
  testType?: string;
  testDate: string;
  orderedBy?: string;
  facility?: string;
  results?: string;
  normalRange?: string;
  status: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLabTestRequest {
  testName: string;
  testType?: string;
  testDate: string;
  orderedBy?: string;
  facility?: string;
  results?: string;
  normalRange?: string;
  status?: string;
  notes?: string;
  documentIds?: number[];
}

export interface UpdateLabTestRequest {
  testName?: string;
  testType?: string;
  testDate?: string;
  orderedBy?: string;
  facility?: string;
  results?: string;
  normalRange?: string;
  status?: string;
  notes?: string;
  documentIds?: number[];
}

export interface ApiError {
  error?: string;
  errors?: Array<{
    property?: string;
    message?: string;
  }>;
}

export const labTestApi = {
  async getLabTests(): Promise<LabTestDto[]> {
    try {
      const response = await apiClient.get<LabTestDto[]>('/labtests');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch lab tests' };
    }
  },

  async getLabTest(id: number): Promise<LabTestDto | null> {
    try {
      const response = await apiClient.get<LabTestDto>(`/labtests/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error.response?.data || { error: 'Failed to fetch lab test' };
    }
  },

  async createLabTest(request: CreateLabTestRequest): Promise<LabTestDto> {
    try {
      const response = await apiClient.post<LabTestDto>('/labtests', request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to create lab test' };
    }
  },

  async updateLabTest(id: number, request: UpdateLabTestRequest): Promise<LabTestDto> {
    try {
      const response = await apiClient.put<LabTestDto>(`/labtests/${id}`, request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to update lab test' };
    }
  },

  async deleteLabTest(id: number): Promise<void> {
    try {
      await apiClient.delete(`/labtests/${id}`);
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to delete lab test' };
    }
  }
};
