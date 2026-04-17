import apiClient from './apiClient';

// Medication interfaces matching backend DTOs
export interface MedicationDto {
  id: number;
  userId: number;
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string; // DateTime in backend, use string in frontend
  endDate?: string;
  isCurrent: boolean;
  notes?: string;
  prescriptionUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateMedicationRequest {
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  isCurrent: boolean;
  notes?: string;
  prescriptionUrl?: string;
  documentIds?: number[];
}

export interface UpdateMedicationRequest {
  name?: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  notes?: string;
  prescriptionUrl?: string;
  documentIds?: number[];
}

export interface ApiError {
  error?: string;
  errors?: Array<{
    property?: string;
    message?: string;
  }>;
}

export const medicationApi = {
  async getMedications(): Promise<MedicationDto[]> {
    try {
      const response = await apiClient.get<MedicationDto[]>('/medications');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch medications' };
    }
  },

  async getMedication(id: number): Promise<MedicationDto | null> {
    try {
      const response = await apiClient.get<MedicationDto>(`/medications/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Medication not found
      }
      throw error.response?.data || { error: 'Failed to fetch medication' };
    }
  },

  async createMedication(request: CreateMedicationRequest): Promise<MedicationDto> {
    try {
      const response = await apiClient.post<MedicationDto>('/medications', request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to create medication' };
    }
  },

  async updateMedication(id: number, request: UpdateMedicationRequest): Promise<MedicationDto> {
    try {
      const response = await apiClient.put<MedicationDto>(`/medications/${id}`, request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to update medication' };
    }
  },

  async deleteMedication(id: number): Promise<void> {
    try {
      await apiClient.delete(`/medications/${id}`);
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to delete medication' };
    }
  }
};
