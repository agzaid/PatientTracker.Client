import apiClient from './apiClient';
import { DocumentDto } from './documentApi';

// Shared profile interfaces matching backend DTOs
export interface SharedProfileResponse {
  profile: ProfileDto;
  medications: MedicationDto[];
  labTests: LabTestDto[];
  radiologyScans: RadiologyScanDto[];
  diagnoses: DiagnosisDto[];
  surgeries: SurgeryDto[];
}

export interface ProfileDto {
  id: number;
  userId: number;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  dateOfBirth?: string;
  gender?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  chronicDiseases?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface MedicationDto {
  id: number;
  userId: number;
  name: string;
  dosage?: string;
  frequency?: string;
  startDate?: string;
  endDate?: string;
  isCurrent?: boolean;
  notes?: string;
  prescriptionUrl?: string;
  documents: DocumentDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface LabTestDto {
  id: number;
  userId: number;
  testName: string;
  testDate?: string;
  testType?: string;
  results?: string;
  normalRange?: string;
  status?: string;
  doctorNotes?: string;
  documents: DocumentDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface RadiologyScanDto {
  id: number;
  userId: number;
  scanType?: string;
  scanDate?: string;
  bodyPart?: string;
  description?: string;
  doctorNotes?: string;
  documents: DocumentDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface DiagnosisDto {
  id: number;
  userId: number;
  diagnosisName: string;
  diagnosisDate?: string;
  diagnosedBy?: string;
  severity?: string;
  status?: string;
  hospitalName?: string;
  description?: string;
  treatmentPlan?: string;
  documents: DocumentDto[];
  createdAt?: string;
  updatedAt?: string;
}

export interface SurgeryDto {
  id: number;
  userId: number;
  surgeryName: string;
  surgeryDate?: string;
  hospitalName?: string;
  surgeonName?: string;
  surgeryType?: string;
  description?: string;
  complications?: string;
  outcome?: string;
  followUpDate?: string;
  documents: DocumentDto[];
  createdAt?: string;
  updatedAt?: string;
}

const shareApi = {
  // Get shared profile by token (public endpoint)
  getSharedProfile: async (token: string): Promise<SharedProfileResponse> => {
    try {
      const response = await apiClient.get<SharedProfileResponse>(`/share/${token}`);
      return response.data;
    } catch (error: any) {
      throw error.response?.data || { error: 'Failed to fetch shared profile' };
    }
  },

  // Download document from shared profile (public endpoint)
  downloadSharedDocument: async (token: string, documentId: number): Promise<Blob> => {
    try {
      const response = await apiClient.get(`/share/${token}/documents/${documentId}/download`, {
        responseType: 'blob'
      });
      return response.data;
    } catch (error: any) {
      // Check if the response is JSON (error response)
      if (error.response?.data instanceof Blob && error.response.data.type === 'application/json') {
        const errorText = await error.response.data.text();
        const errorObj = JSON.parse(errorText);
        throw errorObj || { error: 'Failed to download document' };
      }
      throw error.response?.data || { error: 'Failed to download document' };
    }
  },
};

export { shareApi };
