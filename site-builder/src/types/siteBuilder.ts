/**
 * Site Builder TypeScript Types
 * Comprehensive type definitions for the site builder system
 */

export type CustomizationStep = 
  | 'theme'
  | 'content'
  | 'images'
  | 'betting_cards'
  | 'payment_info'
  | 'review';

export type BuilderStatus = 'draft' | 'preview' | 'published' | 'archived';

export type ThemeType = 'classic' | 'modern' | 'playful' | 'elegant' | 'minimalist';

export type PackageTier = 'starter' | 'professional' | 'premium' | 'enterprise';

// Theme and Design Types
export interface ColorPalette {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
}

export interface Typography {
  heading_font: string;
  body_font: string;
  heading_size: string;
  body_size: string;
  line_height: number;
}

export interface ThemeConfig {
  id: string;
  name: string;
  theme_type: ThemeType;
  description: string;
  colors: ColorPalette;
  typography: Typography;
  border_radius: string;
  shadow: string;
  preview_image_url: string;
  is_premium: boolean;
}

export interface CustomTheme {
  base_theme: ThemeType;
  colors?: ColorPalette | null;
  typography?: Typography | null;
  custom_css?: string | null;
}

// Content Types
export interface SiteContent {
  site_title: string;
  welcome_message: string;
  description: string;
  contact_email?: string;
  phone_number?: string;
  address?: string;
  meta_description?: string;
  meta_keywords?: string;
  facebook_url?: string;
  instagram_url?: string;
  twitter_url?: string;
}

// Image Types
export interface ImageAsset {
  id: string;
  url: string;
  alt_text: string;
  caption?: string;
  width: number;
  height: number;
  file_size: number;
  content_type: string;
}

export interface SiteImages {
  logo?: ImageAsset | null;
  hero_image?: ImageAsset | null;
  slideshow_images: ImageAsset[];
  gallery_images: ImageAsset[];
}

// Betting Configuration Types
export interface BettingCategory {
  id?: string;
  category_key: string;
  category_name: string;
  description?: string;
  bet_price: number;
  options: string[];
  is_active: boolean;
  display_order: number;
  icon?: string;
  color?: string;
}

export interface BettingCardStyle {
  layout: 'grid' | 'list' | 'carousel';
  card_style: 'modern' | 'classic' | 'minimal';
  show_price: boolean;
  show_description: boolean;
  show_stats: boolean;
  animation_enabled: boolean;
}

// Payment Types
export interface PaymentInfo {
  venmo_username?: string;
  paypal_email?: string;
  cashapp_username?: string;
  stripe_enabled: boolean;
  payment_instructions?: string;
  minimum_bet_amount: number;
  maximum_bet_amount: number;
}

// Package and Pricing Types
export interface PackageFeature {
  name: string;
  description: string;
  included: boolean;
  limit?: number;
}

export interface HostingPackage {
  id: string;
  tier: PackageTier;
  name: string;
  description: string;
  price_monthly: number;
  price_yearly: number;
  stripe_price_id_monthly: string;
  stripe_price_id_yearly: string;
  features: PackageFeature[];
  popular: boolean;
  is_active: boolean;
  display_order: number;
}

// Main Site Builder Configuration
export interface SiteBuilderConfig {
  id?: string;
  user_id?: string;
  tenant_id?: string;
  status: BuilderStatus;
  current_step: CustomizationStep;
  completed_steps: CustomizationStep[];
  theme?: CustomTheme | null;
  content?: SiteContent | null;
  images?: SiteImages | null;
  betting_cards: BettingCategory[];
  betting_style?: BettingCardStyle | null;
  payment_info?: PaymentInfo | null;
  selected_package?: PackageTier | null;
  billing_cycle: 'monthly' | 'yearly';
  created_at?: string;
  updated_at?: string;
  published_at?: string;
  preview_url?: string;
  live_url?: string;
}

// API Request/Response Types
export interface SiteBuilderCreate {
  theme: CustomTheme;
  content: SiteContent;
}

export interface SiteBuilderUpdate {
  current_step?: CustomizationStep;
  theme?: CustomTheme;
  content?: SiteContent;
  images?: SiteImages;
  betting_cards?: BettingCategory[];
  betting_style?: BettingCardStyle;
  payment_info?: PaymentInfo;
  selected_package?: PackageTier;
  billing_cycle?: 'monthly' | 'yearly';
}

export interface SiteBuilderResponse {
  id: string;
  status: BuilderStatus;
  current_step: CustomizationStep;
  completed_steps: CustomizationStep[];
  config: SiteBuilderConfig;
  preview_url?: string;
  live_url?: string;
  can_publish: boolean;
  created_at: string;
  updated_at: string;
}

export interface SaveSiteRequest {
  site_config: SiteBuilderConfig;
  subdomain: string;
  owner_name: string;
  oauth_provider: string;
  oauth_code: string;
  selected_package: PackageTier;
  billing_cycle: 'monthly' | 'yearly';
}

export interface SaveSiteResponse {
  tenant_id: string;
  site_id: string;
  subdomain: string;
  preview_url: string;
  admin_url: string;
  access_token: string;
  expires_in: number;
}

export interface PreviewResponse {
  preview_url: string;
  expires_at: string;
}

// UI Component Types
export interface StepProgressItem {
  id: CustomizationStep;
  title: string;
  completed: boolean;
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}

// OAuth and Authentication Types
export interface OAuthProvider {
  id: 'google' | 'apple';
  name: string;
  icon: string;
  color: string;
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  tenant_id?: string;
}

// Form Data Types
export interface ThemeSelectionData {
  theme: CustomTheme;
}

export interface ContentFormData {
  site_title: string;
  welcome_message: string;
  description: string;
  contact_email: string;
  phone_number: string;
  address: string;
  meta_description: string;
  meta_keywords: string;
}

export interface ImageUploadData {
  logo?: File;
  hero_image?: File;
  slideshow_images: File[];
  gallery_images: File[];
}

export interface BettingConfigData {
  categories: BettingCategory[];
  style: BettingCardStyle;
}

export interface PaymentConfigData {
  venmo_username: string;
  paypal_email: string;
  cashapp_username: string;
  stripe_enabled: boolean;
  payment_instructions: string;
  minimum_bet_amount: number;
  maximum_bet_amount: number;
}

export interface ReviewData {
  subdomain: string;
  owner_name: string;
  selected_package: PackageTier;
  billing_cycle: 'monthly' | 'yearly';
  terms_accepted: boolean;
}

// Hook Types
export interface UseSiteBuilderReturn {
  builderId: string | null;
  config: SiteBuilderConfig | null;
  currentStep: CustomizationStep;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  
  // Actions
  createBuilder: (data: SiteBuilderCreate) => Promise<void>;
  updateBuilder: (updates: SiteBuilderUpdate) => Promise<void>;
  saveProgress: () => Promise<void>;
  generatePreview: () => Promise<string>;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: CustomizationStep) => void;
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

export type OptionalFields<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

// Default values
export const DEFAULT_BETTING_CATEGORIES: BettingCategory[] = [
  {
    category_key: 'birth_date',
    category_name: 'Birth Date',
    description: 'What date will the baby arrive?',
    bet_price: 5.00,
    options: ['January 15', 'January 16', 'January 17', 'January 18', 'January 19', 'January 20', 'Other date'],
    is_active: true,
    display_order: 1,
    icon: '📅'
  },
  {
    category_key: 'birth_time',
    category_name: 'Birth Time',
    description: 'What time will the baby arrive?',
    bet_price: 5.00,
    options: ['12:00 AM - 3:00 AM', '3:00 AM - 6:00 AM', '6:00 AM - 9:00 AM', '9:00 AM - 12:00 PM', '12:00 PM - 3:00 PM', '3:00 PM - 6:00 PM', '6:00 PM - 9:00 PM', '9:00 PM - 12:00 AM'],
    is_active: true,
    display_order: 2,
    icon: '⏰'
  },
  {
    category_key: 'birth_weight',
    category_name: 'Birth Weight',
    description: 'How much will the baby weigh?',
    bet_price: 5.00,
    options: ['Under 6 lbs', '6-7 lbs', '7-8 lbs', '8-9 lbs', 'Over 9 lbs'],
    is_active: true,
    display_order: 3,
    icon: '⚖️'
  }
];

export const DEFAULT_BETTING_STYLE: BettingCardStyle = {
  layout: 'grid',
  card_style: 'modern',
  show_price: true,
  show_description: true,
  show_stats: true,
  animation_enabled: true
};

export const DEFAULT_PAYMENT_INFO: PaymentInfo = {
  venmo_username: '',
  paypal_email: '',
  cashapp_username: '',
  stripe_enabled: false,
  payment_instructions: 'Please send payment after placing your bets. Thank you!',
  minimum_bet_amount: 5.00,
  maximum_bet_amount: 100.00
};