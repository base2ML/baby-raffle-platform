/**
 * Site Builder API Service
 * Handles all communication with the backend APIs
 */

import axios, { AxiosResponse } from 'axios';
import { toast } from 'sonner';

// Types
import {
  SiteBuilderConfig,
  SiteBuilderCreate,
  SiteBuilderUpdate,
  SiteBuilderResponse,
  ThemeConfig,
  SaveSiteRequest,
  SaveSiteResponse,
  PreviewResponse,
  HostingPackage
} from '../types/siteBuilder';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    
    const message = error.response?.data?.message || 
                   error.response?.data?.detail || 
                   error.message || 
                   'An error occurred';
    
    toast.error(message);
    return Promise.reject(error);
  }
);

export class BuilderAPI {
  // Theme Management
  async getAvailableThemes(): Promise<ThemeConfig[]> {
    const response: AxiosResponse<ThemeConfig[]> = await api.get('/api/builder/themes');
    return response.data;
  }

  // Site Builder CRUD
  async createAnonymousBuilder(builderData: SiteBuilderCreate): Promise<SiteBuilderResponse> {
    const response: AxiosResponse<SiteBuilderResponse> = await api.post('/api/builder/create', builderData);
    return response.data;
  }

  async getBuilder(builderId: string): Promise<SiteBuilderResponse> {
    const response: AxiosResponse<SiteBuilderResponse> = await api.get(`/api/builder/${builderId}`);
    return response.data;
  }

  async updateBuilder(builderId: string, updateData: SiteBuilderUpdate): Promise<SiteBuilderResponse> {
    const response: AxiosResponse<SiteBuilderResponse> = await api.put(`/api/builder/${builderId}`, updateData);
    return response.data;
  }

  // Preview Generation
  async generatePreview(builderId: string): Promise<PreviewResponse> {
    const response: AxiosResponse<PreviewResponse> = await api.post(`/api/builder/${builderId}/preview`);
    return response.data;
  }

  // Account Creation and Site Saving
  async saveAndCreateAccount(saveRequest: SaveSiteRequest): Promise<SaveSiteResponse> {
    const response: AxiosResponse<SaveSiteResponse> = await api.post('/api/builder/save-and-create-account', saveRequest);
    return response.data;
  }

  // Package Management
  async getHostingPackages(): Promise<HostingPackage[]> {
    const response: AxiosResponse<HostingPackage[]> = await api.get('/api/packages');
    return response.data;
  }

  async getPackageByTier(tier: string): Promise<HostingPackage> {
    const response: AxiosResponse<HostingPackage> = await api.get(`/api/packages/${tier}`);
    return response.data;
  }

  // File Upload
  async uploadFile(file: File, type: 'logo' | 'hero' | 'slideshow' | 'gallery'): Promise<{
    id: string;
    url: string;
    filename: string;
    size: number;
    content_type: string;
  }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await api.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  }

  // Subdomain validation
  async validateSubdomain(subdomain: string): Promise<{ available: boolean; message?: string }> {
    try {
      const response = await api.get(`/api/tenant/validate-subdomain/${subdomain}`);
      return { available: true };
    } catch (error: any) {
      if (error.response?.status === 409) {
        return { available: false, message: 'Subdomain is already taken' };
      }
      return { available: false, message: 'Unable to validate subdomain' };
    }
  }

  // OAuth URLs
  async getOAuthUrl(provider: 'google' | 'apple', state?: string): Promise<{ url: string }> {
    const response = await api.post('/api/auth/login', {
      provider,
      tenant_subdomain: null,
      state: state || 'site_builder'
    });
    return response.data;
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    const response = await api.get('/health');
    return response.data;
  }
}

// Singleton instance
export const builderAPI = new BuilderAPI();

// Helper functions
export const formatPrice = (price: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(price);
};

export const formatFileSize = (bytes: number): string => {
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 Byte';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + ' ' + sizes[i];
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateSubdomainFormat = (subdomain: string): { valid: boolean; message?: string } => {
  if (!subdomain) {
    return { valid: false, message: 'Subdomain is required' };
  }

  if (subdomain.length < 3) {
    return { valid: false, message: 'Subdomain must be at least 3 characters' };
  }

  if (subdomain.length > 63) {
    return { valid: false, message: 'Subdomain must be less than 63 characters' };
  }

  const validFormat = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
  if (!validFormat.test(subdomain)) {
    return { valid: false, message: 'Subdomain can only contain lowercase letters, numbers, and hyphens' };
  }

  const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'mybabyraffle', 'builder', 'preview'];
  if (reserved.includes(subdomain)) {
    return { valid: false, message: 'This subdomain is reserved' };
  }

  return { valid: true };
};