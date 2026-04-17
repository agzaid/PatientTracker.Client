import apiClient from './apiClient';

// Document interfaces matching backend DTOs
export interface DocumentDto {
  id: number;
  userId: number;
  fileName: string;
  originalFileName: string;
  contentType: string;
  fileSize: number;
  filePath: string;
  thumbnailPath?: string;
  documentType: DocumentType;
  parentEntityType: ParentEntityType;
  parentEntityId?: number;
  uploadedAt: string;
  url?: string;
  thumbnailUrl?: string;
}

export enum DocumentType {
  General = 0,
  LabReport = 1,
  RadiologyImage = 2,
  Prescription = 3,
  Insurance = 4,
  IDDocument = 5,
  MedicalRecord = 6,
  Invoice = 7,
  Other = 8
}

export enum ParentEntityType {
  None = 0,
  Profile = 1,
  Medication = 2,
  LabTest = 3,
  RadiologyScan = 4,
  Diagnosis = 5,
  Surgery = 6,
  SharedLink = 7
}

export interface ApiError {
  error?: string;
  errors?: Array<{
    property?: string;
    message?: string;
  }>;
}

export const documentApi = {
  async uploadDocument(
    file: File,
    documentType: DocumentType = DocumentType.General,
    parentEntityType: ParentEntityType = ParentEntityType.None,
    parentEntityId?: number,
    maxWidth?: number,
    maxHeight?: number
  ): Promise<DocumentDto> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('documentType', documentType.toString());
    formData.append('parentEntityType', parentEntityType.toString());
    
    if (parentEntityId !== undefined) {
      formData.append('parentEntityId', parentEntityId.toString());
    }
    
    if (maxWidth !== undefined) {
      formData.append('maxWidth', maxWidth.toString());
    }
    
    if (maxHeight !== undefined) {
      formData.append('maxHeight', maxHeight.toString());
    }

    try {
      const response = await apiClient.post<DocumentDto>('/documents', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to upload document' };
    }
  },

  async getUserDocuments(): Promise<DocumentDto[]> {
    try {
      const response = await apiClient.get<DocumentDto[]>('/documents');
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch documents' };
    }
  },

  async getEntityDocuments(entityType: ParentEntityType, entityId: number): Promise<DocumentDto[]> {
    try {
      const response = await apiClient.get<DocumentDto[]>(`/documents/entity/${entityType}/${entityId}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch documents' };
    }
  },

  async getDocument(id: number): Promise<DocumentDto | null> {
    try {
      const response = await apiClient.get<DocumentDto>(`/documents/${id}`);
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error.response?.data || { error: 'Failed to fetch document' };
    }
  },

  async deleteDocument(id: number): Promise<void> {
    try {
      await apiClient.delete(`/documents/${id}`);
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data;
      }
      throw { error: 'Failed to delete document' };
    }
  },

  async downloadDocument(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`/documents/${id}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to download document' };
    }
  },

  async getThumbnail(id: number): Promise<Blob> {
    try {
      const response = await apiClient.get(`/documents/${id}/thumbnail`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch thumbnail' };
    }
  },

  getDownloadUrl(id: number): string {
    // Note: This URL won't work without authentication token
    // Use downloadDocument method for authenticated access
    return `${apiClient.defaults.baseURL}/documents/${id}/download`;
  },

  getThumbnailUrl(id: number): string {
    // Note: This URL won't work without authentication token
    // Use getThumbnail method for authenticated access
    return `${apiClient.defaults.baseURL}/documents/${id}/thumbnail`;
  }
};
