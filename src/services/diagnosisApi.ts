import apiClient from './apiClient';
import { PaginatedResponse } from '@/interfaces/pagination';

// Diagnosis interfaces matching backend DTOs
export interface DiagnosisDto {
  id: number;
  userId: number;
  diagnosisName: string;
  diagnosisDate: string;
  diagnosedBy?: string;
  severity?: string;
  status?: string;
  hospitalName?: string;
  description?: string;
  treatmentPlan?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDiagnosisRequest {
  diagnosisName: string;
  diagnosisDate: string;
  description?: string;
  severity?: string;
  status?: string;
  diagnosedBy?: string;
  hospitalName?: string;
  treatmentPlan?: string;
  documentIds?: number[];
}

export interface UpdateDiagnosisRequest {
  diagnosisName?: string;
  diagnosisDate?: string;
  description?: string;
  severity?: string;
  status?: string;
  diagnosedBy?: string;
  hospitalName?: string;
  treatmentPlan?: string;
  documentIds?: number[];
}

const diagnosisApi = {
  // Get diagnoses for the current user with pagination
  getDiagnoses: async (page: number = 1, pageSize: number = 10, search?: string): Promise<PaginatedResponse<DiagnosisDto>> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('pageSize', pageSize.toString());
    if (search) params.append('search', search);
    
    try {
      const response = await apiClient.get<PaginatedResponse<DiagnosisDto>>(`/diagnoses?${params.toString()}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch diagnoses' };
    }
  },

  // Get a specific diagnosis by ID
  getDiagnosis: async (id: number): Promise<DiagnosisDto> => {
    const response = await apiClient.get<DiagnosisDto>(`/diagnoses/${id}`);
    return response.data;
  },

  // Create a new diagnosis
  createDiagnosis: async (request: CreateDiagnosisRequest): Promise<DiagnosisDto> => {
    const response = await apiClient.post<DiagnosisDto>('/diagnoses', request);
    return response.data;
  },

  // Update an existing diagnosis
  updateDiagnosis: async (id: number, request: UpdateDiagnosisRequest): Promise<DiagnosisDto> => {
    const response = await apiClient.put<DiagnosisDto>(`/diagnoses/${id}`, request);
    return response.data;
  },

  // Delete a diagnosis
  deleteDiagnosis: async (id: number): Promise<void> => {
    await apiClient.delete(`/diagnoses/${id}`);
  },
};

export { diagnosisApi };
