// User and Authentication Types
export interface User {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'admin' | 'user';
  status: 'active' | 'inactive' | 'suspended';
  oauth_provider?: string;
  created_at: string;
  last_login?: string;
}

export interface AuthState {
  user: User | null;
  tenant: Tenant | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tenant Types
export interface Tenant {
  id: string;
  subdomain: string;
  name: string;
  owner_email: string;
  status: 'active' | 'suspended' | 'trial' | 'inactive';
  subscription_plan: string;
  created_at: string;
  settings: TenantSettings;
}

export interface TenantSettings {
  // Branding
  primary_color?: string;
  secondary_color?: string;
  logo_url?: string;
  favicon_url?: string;
  custom_css?: string;
  
  // Configuration
  site_title?: string;
  welcome_message?: string;
  footer_text?: string;
  
  // Features
  allow_anonymous_betting?: boolean;
  require_email_validation?: boolean;
  max_bets_per_user?: number;
  
  // Notifications
  admin_email_notifications?: boolean;
  user_confirmation_emails?: boolean;
  
  [key: string]: any;
}

// Site Builder Types
export interface SiteBuilderStep {
  id: number;
  title: string;
  description: string;
  component: string;
  isComplete: boolean;
  isActive: boolean;
  data?: any;
}

export interface SubdomainCheck {
  subdomain: string;
  available: boolean;
  suggestions?: string[];
}

export interface ParentInfo {
  parent1_name: string;
  parent1_email: string;
  parent2_name?: string;
  parent2_email?: string;
  due_date: string;
  baby_name?: string;
  hospital?: string;
  doctor?: string;
}

export interface VenmoConfig {
  venmo_username: string;
  venmo_display_name?: string;
  venmo_qr_code?: string;
  payment_instructions?: string;
}

export interface AdminSettings {
  admin_password: string;
  notification_preferences: {
    email_notifications: boolean;
    sms_notifications: boolean;
    daily_summary: boolean;
  };
  backup_email?: string;
}

// File Upload Types
export interface UploadedFile {
  id: string;
  filename: string;
  original_filename: string;
  url: string;
  size: number;
  content_type: string;
  created_at: string;
}

export interface SlideshowImage extends UploadedFile {
  title?: string;
  caption?: string;
  display_order: number;
  is_active: boolean;
}

// Site Configuration Types
export interface SiteConfig {
  id: string;
  tenant_id: string;
  config: {
    // Basic Info
    site_title?: string;
    welcome_message?: string;
    description?: string;
    contact_email?: string;
    
    // Parent Information
    parent_info?: ParentInfo;
    
    // Payment Configuration
    venmo_config?: VenmoConfig;
    
    // Branding
    primary_color?: string;
    secondary_color?: string;
    background_color?: string;
    logo_url?: string;
    favicon_url?: string;
    
    // Features
    enable_slideshow?: boolean;
    enable_social_sharing?: boolean;
    enable_comments?: boolean;
    max_bets_per_user?: number;
    
    // SEO
    meta_description?: string;
    meta_keywords?: string;
    
    // Analytics
    google_analytics_id?: string;
    facebook_pixel_id?: string;
    
    [key: string]: any;
  };
  created_at: string;
  updated_at: string;
}

// Payment Types
export interface PaymentPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  setup_fee?: number;
}

export interface PaymentIntent {
  id: string;
  client_secret: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
}

// Deployment Types
export interface Deployment {
  id: string;
  tenant_id: string;
  status: 'pending' | 'building' | 'success' | 'failed';
  deployment_url?: string;
  build_log?: string;
  created_at: string;
}

// Site Preview Types
export interface SitePreviewData {
  tenant: Tenant;
  config: SiteConfig;
  slideshow_images: SlideshowImage[];
  categories: RaffleCategory[];
}

// Raffle Category Types
export interface RaffleCategory {
  id: string;
  tenant_id: string;
  category_key: string;
  category_name: string;
  description?: string;
  bet_price: number;
  options: string[];
  is_active: boolean;
  display_order: number;
  created_at: string;
  total_amount?: number;
  bet_count?: number;
}

// Form Data Types
export interface StepData {
  step1?: {
    subdomain: string;
    site_name: string;
  };
  step2?: {
    uploaded_files: UploadedFile[];
    slideshow_images: SlideshowImage[];
  };
  step3?: ParentInfo;
  step4?: VenmoConfig;
  step5?: AdminSettings;
  step6?: {
    preview_data: SitePreviewData;
  };
  step7?: {
    selected_plan: PaymentPlan;
    payment_intent: PaymentIntent;
  };
  step8?: {
    deployment: Deployment;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  details?: any;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface FormState<T> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

// Context Types
export interface SiteBuilderContextType {
  steps: SiteBuilderStep[];
  currentStep: number;
  stepData: StepData;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setCurrentStep: (step: number) => void;
  updateStepData: (step: number, data: any) => void;
  nextStep: () => void;
  previousStep: () => void;
  resetBuilder: () => void;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
}

// Stripe Types (extending from @stripe/stripe-js)
export interface StripePaymentElement {
  mount: (element: string | HTMLElement) => void;
  unmount: () => void;
  update: (options: any) => void;
}

export interface StripeElements {
  create: (type: string, options?: any) => StripePaymentElement;
  getElement: (type: string) => StripePaymentElement | null;
}

// Color picker types
export interface ColorResult {
  hex: string;
  rgb: {
    r: number;
    g: number;
    b: number;
    a?: number;
  };
  hsl: {
    h: number;
    s: number;
    l: number;
    a?: number;
  };
}

// Image cropper types
export interface CropperResult {
  canvas: HTMLCanvasElement;
  croppedFile: File;
  croppedDataURL: string;
}

// Notification types
export interface NotificationOptions {
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  position?: 'top-left' | 'top-center' | 'top-right' | 'bottom-left' | 'bottom-center' | 'bottom-right';
}