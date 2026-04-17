import apiClient from './apiClient';

// Profile interfaces matching backend DTOs
export interface ProfileDto {
  id?: number;
  userId: number;
  fullName?: string;
  dateOfBirth?: string; // DateTime in backend, use string in frontend
  gender?: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfileRequest {
  fullName?: string;
  dateOfBirth?: string; // DateTime in backend, use string in frontend
  gender?: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface UpdateProfileRequest {
  fullName?: string;
  dateOfBirth?: string; // DateTime in backend, use string in frontend
  gender?: string;
  bloodType?: string;
  phone?: string;
  email?: string;
  address?: string;
  allergies?: string[];
  chronicDiseases?: string[];
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}

export interface ApiError {
  error?: string;
  errors?: Array<{
    property?: string;
    message?: string;
  }>;
}

export const profileApi = {
  async getProfile(): Promise<ProfileDto | null> {
    try {
      const response = await apiClient.get<ProfileDto>('/profile');
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null; // Profile not found
      }
      throw error.response?.data || { error: 'Failed to fetch profile' };
    }
  },

  async createProfile(request: CreateProfileRequest): Promise<ProfileDto> {
    try {
      const response = await apiClient.post<ProfileDto>('/profile', request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data as ApiError;
      }
      throw { error: 'Failed to create profile' };
    }
  },

  async updateProfile(request: UpdateProfileRequest): Promise<ProfileDto> {
    try {
      const response = await apiClient.put<ProfileDto>('/profile', request);
      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data as ApiError;
      }
      throw { error: 'Failed to update profile' };
    }
  },

  async deleteProfile(): Promise<void> {
    try {
      await apiClient.delete('/profile');
    } catch (error: any) {
      if (error.response?.data) {
        throw error.response.data as ApiError;
      }
      throw { error: 'Failed to delete profile' };
    }
  }
};
