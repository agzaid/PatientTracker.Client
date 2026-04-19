import apiClient from './apiClient';
import { PaginatedResponse } from '@/interfaces/pagination';

export interface ExtractedLabTestDto {
  testName: string;
  resultValue?: string;
  resultUnit?: string;
  normalRange?: string;
  status?: string;
  confidence?: number;
}

export interface LabTestDocumentDto {
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

export interface LabTestDocumentWithTestsDto {
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
  labTests: LabTestDto[];
}

export interface LabTestDto {
  id: number;
  testName: string;
  testDate?: string;
  testType?: string;
  results?: string;
  resultValue?: string;
  resultUnit?: string;
  normalRange?: string;
  status?: string;
  doctorNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LabTestExtractionResponse {
  document: LabTestDocumentDto;
  extractedTests: ExtractedLabTestDto[];
  needsManualReview: boolean;
  message?: string;
}

export interface UpdateExtractedLabTestRequest {
  id: number;
  testName: string;
  resultValue?: string;
  resultUnit?: string;
  normalRange?: string;
  status?: string;
  notes?: string;
}

const labTestExtractionApi = {
  // Upload a lab test document for extraction
  uploadDocument: async (file: File, testDate?: string): Promise<LabTestExtractionResponse> => {
    const formData = new FormData();
    formData.append('File', file);
    if (testDate) {
      formData.append('TestDate', testDate);
    }
    
    try {
      const response = await apiClient.post<LabTestExtractionResponse>('/LabTestExtraction', formData, {
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
  getStatus: async (documentId: number): Promise<LabTestExtractionResponse> => {
    try {
      const response = await apiClient.get<LabTestExtractionResponse>(`/LabTestExtraction/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to check extraction status' };
    }
  },

  // Retry extraction
  retryExtraction: async (documentId: number): Promise<LabTestExtractionResponse> => {
    try {
      const response = await apiClient.post<LabTestExtractionResponse>(`/LabTestExtraction/${documentId}/retry`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to retry extraction' };
    }
  },

  // Update extracted results
  updateExtractedTests: async (documentId: number, updates: UpdateExtractedLabTestRequest[]): Promise<any> => {
    try {
      const response = await apiClient.put(`/LabTestExtraction/${documentId}/tests`, updates);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to update extracted tests' };
    }
  },

  // Delete lab test document
  deleteDocument: async (documentId: number): Promise<void> => {
    try {
      await apiClient.delete(`/LabTestExtraction/${documentId}`);
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to delete document' };
    }
  },

  // Get all lab test documents for the user
  getLabTestDocuments: async (page: number = 1, pageSize: number = 10): Promise<PaginatedResponse<LabTestDocumentDto>> => {
    try {
      const response = await apiClient.get<PaginatedResponse<LabTestDocumentDto>>(`/LabTests/documents?Page=${page}&PageSize=${pageSize}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch lab test documents' };
    }
  },

  // Get lab test document with tests
  getLabTestDocumentWithTests: async (documentId: number): Promise<LabTestDocumentWithTestsDto> => {
    try {
      const response = await apiClient.get<LabTestDocumentWithTestsDto>(`/LabTests/documents/${documentId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch document' };
    }
  },
};

export { labTestExtractionApi };
