import apiClient from './apiClient';

// Surgery interfaces matching backend DTOs
export interface SurgeryDto {
  id: number;
  userId: number;
  surgeryName: string;
  surgeryDate: string;
  surgeonName?: string;
  hospitalName?: string;
  surgeryType?: string;
  description?: string;
  complications?: string;
  outcome?: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSurgeryRequest {
  surgeryName: string;
  surgeryDate: string;
  surgeonName?: string;
  hospitalName?: string;
  surgeryType?: string;
  description?: string;
  complications?: string;
  outcome?: string;
  followUpDate?: string;
  documentIds?: number[];
}

export interface UpdateSurgeryRequest {
  surgeryName?: string;
  surgeryDate?: string;
  surgeonName?: string;
  hospitalName?: string;
  surgeryType?: string;
  description?: string;
  complications?: string;
  outcome?: string;
  followUpDate?: string;
  documentIds?: number[];
}

const surgeryApi = {
  // Get all surgeries for the current user
  getSurgeries: async (): Promise<SurgeryDto[]> => {
    const response = await apiClient.get<SurgeryDto[]>('/surgeries');
    return response.data;
  },

  // Get a specific surgery by ID
  getSurgery: async (id: number): Promise<SurgeryDto> => {
    const response = await apiClient.get<SurgeryDto>(`/surgeries/${id}`);
    return response.data;
  },

  // Create a new surgery
  createSurgery: async (request: CreateSurgeryRequest): Promise<SurgeryDto> => {
    const response = await apiClient.post<SurgeryDto>('/surgeries', request);
    return response.data;
  },

  // Update an existing surgery
  updateSurgery: async (id: number, request: UpdateSurgeryRequest): Promise<SurgeryDto> => {
    const response = await apiClient.put<SurgeryDto>(`/surgeries/${id}`, request);
    return response.data;
  },

  // Delete a surgery
  deleteSurgery: async (id: number): Promise<void> => {
    await apiClient.delete(`/surgeries/${id}`);
  },
};

export { surgeryApi };
