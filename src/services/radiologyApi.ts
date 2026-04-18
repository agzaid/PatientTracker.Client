import apiClient from './apiClient';

// Radiology scan interfaces matching backend DTOs
export interface RadiologyScanDto {
  id: number;
  userId: number;
  scanType: string;
  bodyPart: string;
  scanDate: string;
  description?: string;
  doctorNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRadiologyScanRequest {
  scanType: string;
  bodyPart: string;
  scanDate: string;
  description?: string;
  doctorNotes?: string;
  documentIds?: number[];
}

export interface UpdateRadiologyScanRequest {
  scanType?: string;
  bodyPart?: string;
  scanDate?: string;
  description?: string;
  doctorNotes?: string;
  documentIds?: number[];
}

const radiologyApi = {
  // Get all radiology scans for the current user
  getRadiologyScans: async (): Promise<RadiologyScanDto[]> => {
    const response = await apiClient.get<RadiologyScanDto[]>('/radiology');
    return response.data;
  },

  // Get a specific radiology scan by ID
  getRadiologyScan: async (id: number): Promise<RadiologyScanDto> => {
    const response = await apiClient.get<RadiologyScanDto>(`/radiology/${id}`);
    return response.data;
  },

  // Create a new radiology scan
  createRadiologyScan: async (request: CreateRadiologyScanRequest): Promise<RadiologyScanDto> => {
    const response = await apiClient.post<RadiologyScanDto>('/radiology', request);
    return response.data;
  },

  // Update an existing radiology scan
  updateRadiologyScan: async (id: number, request: UpdateRadiologyScanRequest): Promise<RadiologyScanDto> => {
    const response = await apiClient.put<RadiologyScanDto>(`/radiology/${id}`, request);
    return response.data;
  },

  // Delete a radiology scan
  deleteRadiologyScan: async (id: number): Promise<void> => {
    await apiClient.delete(`/radiology/${id}`);
  },
};

export { radiologyApi };
