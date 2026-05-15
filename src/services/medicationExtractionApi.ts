import apiClient from './apiClient';
import { PaginatedResponse } from '@/interfaces/pagination';

export interface ExtractedMedicationDto {
  medicationName: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
  confidence?: number;
}

export interface MedicationDocumentDto {
  id: number;
  documentId?: number;
  fileName: string;
  originalFileName: string;
  contentType?: string;
  fileSize?: number;
  documentUrl?: string;
  thumbnailUrl?: string;
  extractionStatus?: number;
  extractionStatusName?: string;
  extractionError?: string;
  createdAt: string;
}

export interface MedicationDocumentWithMedicationsDto {
  id: number;
  documentId?: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
  documentUrl: string;
  thumbnailUrl?: string;
  extractionStatus?: number;
  extractionStatusName: string;
  extractedAt?: string;
  extractionError?: string;
  retryCount?: number;
  createdAt: string;
  updatedAt: string;
  medications: MedicationDto[];
}

export interface MedicationDto {
  id: number;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicationExtractionResponse {
  document: MedicationDocumentDto;
  extractedMedications: ExtractedMedicationDto[];
  needsManualReview: boolean;
  message?: string;
}

export interface UpdateExtractedMedicationRequest {
  id: number;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  status?: string;
  notes?: string;
}

const medicationExtractionApi = {
  // Upload a medication document for extraction
  uploadDocument: async (file: File, startDate?: string): Promise<MedicationExtractionResponse> => {
    const formData = new FormData();
    formData.append('File', file);
    if (startDate) {
      formData.append('StartDate', startDate);
    }
    
    try {
      const response = await apiClient.post<MedicationExtractionResponse>('/MedicationExtraction', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to upload document' };
    }
  },

  // Check extraction status
  getStatus: async (documentId: number): Promise<MedicationExtractionResponse> => {
    try {
      const response = await apiClient.get<MedicationExtractionResponse>(`/MedicationExtraction/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to check extraction status' };
    }
  },

  // Retry extraction
  retryExtraction: async (documentId: number): Promise<MedicationExtractionResponse> => {
    try {
      const response = await apiClient.post<MedicationExtractionResponse>(`/MedicationExtraction/${documentId}/retry`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to retry extraction' };
    }
  },

  // Update extracted results
  updateExtractedMedications: async (documentId: number, updates: UpdateExtractedMedicationRequest[]): Promise<any> => {
    try {
      const response = await apiClient.put(`/MedicationExtraction/${documentId}/medications`, updates);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to update extracted medications' };
    }
  },

  // Delete medication document
  deleteDocument: async (documentId: number): Promise<void> => {
    try {
      await apiClient.delete(`/MedicationExtraction/${documentId}`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete document' };
    }
  },

  // Get all medication documents for the user
  getMedicationDocuments: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<MedicationDocumentDto>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<MedicationDocumentDto>>(`/Medications/documents?Page=${page}&PageSize=${pageSize}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch medication documents' };
    }
  },

  // Get medication document with medications
  getMedicationDocumentWithMedications: async (id: number): Promise<MedicationDocumentWithMedicationsDto> => {
    try {
      const response = await apiClient.get<MedicationDocumentWithMedicationsDto>(`/Medications/documents/${id}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch document' };
    }
  },
};

export { medicationExtractionApi };
