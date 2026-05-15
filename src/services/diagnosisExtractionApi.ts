import apiClient from './apiClient';
import { PaginatedResponse } from '@/interfaces/pagination';

export interface ExtractedDiagnosisDto {
  diagnosisName: string;
  diagnosisDate?: string;
  severity?: string;
  status?: string;
  notes?: string;
  confidence?: number;
}

export interface DiagnosisDocumentDto {
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

export interface DiagnosisDocumentWithDiagnosesDto {
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
  diagnoses: DiagnosisDto[];
}

export interface DiagnosisDto {
  id: number;
  diagnosisName: string;
  diagnosisDate?: string;
  diagnosedBy?: string;
  severity?: string;
  status?: string;
  hospitalName?: string;
  description?: string;
  treatmentPlan?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DiagnosisExtractionResponse {
  document: DiagnosisDocumentDto;
  extractedDiagnoses: ExtractedDiagnosisDto[];
  needsManualReview: boolean;
  message?: string;
}

export interface UpdateExtractedDiagnosisRequest {
  id: number;
  diagnosisName: string;
  diagnosisDate?: string;
  severity?: string;
  status?: string;
  notes?: string;
}

const diagnosisExtractionApi = {
  // Upload a diagnosis document for extraction
  uploadDocument: async (file: File, diagnosisDate?: string): Promise<DiagnosisExtractionResponse> => {
    const formData = new FormData();
    formData.append('File', file);
    if (diagnosisDate) {
      formData.append('DiagnosisDate', diagnosisDate);
    }
    
    try {
      const response = await apiClient.post<DiagnosisExtractionResponse>('/DiagnosisExtraction', formData, {
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
  getStatus: async (documentId: number): Promise<DiagnosisExtractionResponse> => {
    try {
      const response = await apiClient.get<DiagnosisExtractionResponse>(`/DiagnosisExtraction/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to check extraction status' };
    }
  },

  // Retry extraction
  retryExtraction: async (documentId: number): Promise<DiagnosisExtractionResponse> => {
    try {
      const response = await apiClient.post<DiagnosisExtractionResponse>(`/DiagnosisExtraction/${documentId}/retry`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to retry extraction' };
    }
  },

  // Update extracted results
  updateExtractedDiagnoses: async (documentId: number, updates: UpdateExtractedDiagnosisRequest[]): Promise<any> => {
    try {
      const response = await apiClient.put(`/DiagnosisExtraction/${documentId}/diagnoses`, updates);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to update extracted diagnoses' };
    }
  },

  // Delete diagnosis document
  deleteDocument: async (documentId: number): Promise<void> => {
    try {
      await apiClient.delete(`/DiagnosisExtraction/${documentId}`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete document' };
    }
  },

  // Get all diagnosis documents for the user
  getDiagnosisDocuments: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<DiagnosisDocumentDto>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<DiagnosisDocumentDto>>(`/Diagnoses/documents?Page=${page}&PageSize=${pageSize}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch diagnosis documents' };
    }
  },

  // Get diagnosis document with diagnoses
  getDiagnosisDocumentWithDiagnoses: async (documentId: number): Promise<DiagnosisDocumentWithDiagnosesDto> => {
    try {
      const response = await apiClient.get<DiagnosisDocumentWithDiagnosesDto>(`/Diagnoses/documents/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch document' };
    }
  },
};

export { diagnosisExtractionApi };
