import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios';
import { toast } from 'react-hot-toast';
import { 
  ApiResponse, 
  User, 
  Tenant, 
  SubdomainCheck, 
  UploadedFile,
  SlideshowImage,
  SiteConfig,
  PaymentIntent,
  Deployment,
  SitePreviewData,
  PaymentPlan
} from '../types';

// Base API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError<ApiResponse>) => {
        this.handleApiError(error);
        return Promise.reject(error);
      }
    );

    // Load token from localStorage on initialization
    this.loadToken();
  }

  private handleApiError(error: AxiosError<ApiResponse>) {
    const message = error.response?.data?.message || error.message || 'An error occurred';
    const status = error.response?.status;

    // Don't show toast for certain errors that are handled elsewhere
    const silentErrorPaths = ['/api/tenant/validate-subdomain'];
    const issilentError = silentErrorPaths.some(path => error.config?.url?.includes(path));

    if (!issilentError) {
      if (status === 401) {
        toast.error('Authentication required. Please log in.');
        this.clearToken();
      } else if (status === 403) {
        toast.error('Access denied. You do not have permission for this action.');
      } else if (status === 429) {
        toast.error('Too many requests. Please try again later.');
      } else if (status && status >= 500) {
        toast.error('Server error. Please try again later.');
      } else {
        toast.error(message);
      }
    }
  }

  // Token management
  setToken(token: string) {
    this.token = token;
    localStorage.setItem('site_builder_token', token);
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('site_builder_token');
  }

  private loadToken() {
    const token = localStorage.getItem('site_builder_token');
    if (token) {
      this.token = token;
    }
  }

  // Generic API methods
  private async get<T>(url: string, params?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, { params });
    return response.data;
  }

  private async post<T>(url: string, data?: any, config?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  private async put<T>(url: string, data?: any): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data);
    return response.data;
  }

  private async delete<T>(url: string): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url);
    return response.data;
  }

  // Authentication endpoints
  async validateSubdomain(subdomain: string): Promise<SubdomainCheck> {
    try {
      const response = await this.get<{ available: boolean }>(`/api/tenant/validate-subdomain/${subdomain}`);
      return {
        subdomain,
        available: response.available,
      };
    } catch (error) {
      return {
        subdomain,
        available: false,
      };
    }
  }

  async createTenant(data: {
    subdomain: string;
    name: string;
    owner_name: string;
    oauth_provider?: string;
    oauth_id?: string;
  }): Promise<ApiResponse<{ tenant: Tenant; user: User; setup_url: string }>> {
    return this.post('/api/tenant/create', {
      subdomain: data.subdomain,
      name: data.name,
      owner_email: data.owner_name, // This will be set from OAuth
    }, {
      params: {
        owner_name: data.owner_name,
        oauth_provider: data.oauth_provider,
        oauth_id: data.oauth_id,
      }
    });
  }

  // File upload endpoints
  async uploadFile(file: File): Promise<UploadedFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.post('/api/files/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getUploadedFiles(limit = 50, offset = 0): Promise<UploadedFile[]> {
    return this.get('/api/files', { limit, offset });
  }

  async deleteFile(fileId: string): Promise<ApiResponse> {
    return this.delete(`/api/files/${fileId}`);
  }

  // Slideshow management
  async addToSlideshow(data: {
    file_id: string;
    title?: string;
    caption?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<SlideshowImage> {
    const formData = new FormData();
    formData.append('file_id', data.file_id);
    if (data.title) formData.append('title', data.title);
    if (data.caption) formData.append('caption', data.caption);
    formData.append('display_order', (data.display_order || 0).toString());
    formData.append('is_active', (data.is_active !== false).toString());

    return this.post('/api/slideshow/add', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async getSlideshowImages(): Promise<SlideshowImage[]> {
    return this.get('/api/slideshow');
  }

  async updateSlideshowImage(slideshowId: string, data: {
    title?: string;
    caption?: string;
    display_order?: number;
    is_active?: boolean;
  }): Promise<SlideshowImage> {
    const formData = new FormData();
    if (data.title !== undefined) formData.append('title', data.title);
    if (data.caption !== undefined) formData.append('caption', data.caption);
    if (data.display_order !== undefined) formData.append('display_order', data.display_order.toString());
    if (data.is_active !== undefined) formData.append('is_active', data.is_active.toString());

    return this.put(`/api/slideshow/${slideshowId}`, formData);
  }

  async removeFromSlideshow(slideshowId: string): Promise<ApiResponse> {
    return this.delete(`/api/slideshow/${slideshowId}`);
  }

  // Site configuration
  async getSiteConfig(): Promise<SiteConfig> {
    return this.get('/api/site-config');
  }

  async updateSiteConfig(config: Partial<SiteConfig['config']>): Promise<SiteConfig> {
    return this.put('/api/site-config', config);
  }

  async getSitePreview(): Promise<SitePreviewData> {
    return this.get('/api/site-config/preview');
  }

  // Payment and billing
  async getPricingConfig(): Promise<PaymentPlan[]> {
    return this.get('/api/payments/pricing');
  }

  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    description?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    return this.post('/api/payments/create-intent', data);
  }

  async createSubscription(data: {
    plan: string;
    payment_method_id: string;
    trial_days?: number;
  }): Promise<ApiResponse> {
    return this.post('/api/subscriptions/create', data);
  }

  async getCurrentSubscription(): Promise<ApiResponse> {
    return this.get('/api/subscriptions/current');
  }

  // Deployment
  async triggerDeployment(data: {
    force_rebuild?: boolean;
    config_only?: boolean;
  } = {}): Promise<Deployment> {
    return this.post('/api/deploy', data);
  }

  async getDeploymentHistory(limit = 20): Promise<Deployment[]> {
    return this.get('/api/deployments', { limit });
  }

  // Tenant management
  async getTenantInfo(): Promise<Tenant> {
    return this.get('/api/tenant/info');
  }

  async updateTenantSettings(settings: Partial<Tenant['settings']>): Promise<Tenant> {
    return this.put('/api/tenant/settings', settings);
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.get('/health');
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Helper functions for common operations
export const uploadHelpers = {
  async uploadMultipleFiles(files: File[], onProgress?: (progress: number) => void): Promise<UploadedFile[]> {
    const results: UploadedFile[] = [];
    const total = files.length;

    for (let i = 0; i < total; i++) {
      try {
        const result = await apiClient.uploadFile(files[i]);
        results.push(result);
        
        if (onProgress) {
          onProgress(((i + 1) / total) * 100);
        }
      } catch (error) {
        console.error(`Failed to upload file ${files[i].name}:`, error);
        throw error;
      }
    }

    return results;
  },

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  isValidImageType(file: File): boolean {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type);
  },

  resizeImage(file: File, maxWidth: number, maxHeight: number, quality = 0.8): Promise<File> {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const resizedFile = new File([blob], file.name, {
                type: file.type,
                lastModified: Date.now(),
              });
              resolve(resizedFile);
            } else {
              reject(new Error('Failed to resize image'));
            }
          },
          file.type,
          quality
        );
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  },
};

export default apiClient;