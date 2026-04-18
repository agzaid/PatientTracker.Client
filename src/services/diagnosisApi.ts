import apiClient from './apiClient';

// Diagnosis interfaces matching backend DTOs
export interface DiagnosisDto {
  id: number;
  userId: number;
  diagnosisName: string;
  diagnosisDate: string;
  description?: string;
  severity?: string;
  status?: string;
  diagnosedBy?: string;
  hospitalName?: string;
  treatmentPlan?: string;
  createdAt: string;
  updatedAt: string;
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
  // Get all diagnoses for the current user
  getDiagnoses: async (): Promise<DiagnosisDto[]> => {
    const response = await apiClient.get<DiagnosisDto[]>('/diagnoses');
    return response.data;
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
