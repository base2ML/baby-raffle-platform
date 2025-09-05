import * as Yup from 'yup';

// Subdomain validation
export const subdomainSchema = Yup.object({
  subdomain: Yup.string()
    .required('Subdomain is required')
    .min(3, 'Subdomain must be at least 3 characters')
    .max(63, 'Subdomain must not exceed 63 characters')
    .matches(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Subdomain can only contain lowercase letters, numbers, and hyphens (not at start/end)'
    )
    .test('not-reserved', 'This subdomain is reserved', (value) => {
      const reserved = ['www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog', 'shop', 'mybabyraffle'];
      return !reserved.includes(value?.toLowerCase() || '');
    }),
  site_name: Yup.string()
    .required('Site name is required')
    .min(2, 'Site name must be at least 2 characters')
    .max(255, 'Site name must not exceed 255 characters')
    .trim(),
});

// Parent information validation
export const parentInfoSchema = Yup.object({
  parent1_name: Yup.string()
    .required('Parent 1 name is required')
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters')
    .matches(
      /^[a-zA-Z\s\-']+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    ),
  parent1_email: Yup.string()
    .required('Parent 1 email is required')
    .email('Please enter a valid email address'),
  parent2_name: Yup.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must not exceed 255 characters')
    .matches(
      /^[a-zA-Z\s\-']+$/,
      'Name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .nullable(),
  parent2_email: Yup.string()
    .email('Please enter a valid email address')
    .nullable(),
  due_date: Yup.date()
    .required('Due date is required')
    .min(new Date(), 'Due date must be in the future'),
  baby_name: Yup.string()
    .max(255, 'Baby name must not exceed 255 characters')
    .matches(
      /^[a-zA-Z\s\-']*$/,
      'Baby name can only contain letters, spaces, hyphens, and apostrophes'
    )
    .nullable(),
  hospital: Yup.string()
    .max(255, 'Hospital name must not exceed 255 characters')
    .nullable(),
  doctor: Yup.string()
    .max(255, 'Doctor name must not exceed 255 characters')
    .nullable(),
});

// Venmo configuration validation
export const venmoConfigSchema = Yup.object({
  venmo_username: Yup.string()
    .required('Venmo username is required')
    .min(1, 'Venmo username is required')
    .max(50, 'Venmo username must not exceed 50 characters')
    .matches(
      /^[a-zA-Z0-9_-]+$/,
      'Venmo username can only contain letters, numbers, underscores, and hyphens'
    ),
  venmo_display_name: Yup.string()
    .max(100, 'Display name must not exceed 100 characters')
    .nullable(),
  payment_instructions: Yup.string()
    .max(500, 'Payment instructions must not exceed 500 characters')
    .nullable(),
});

// Admin settings validation
export const adminSettingsSchema = Yup.object({
  admin_password: Yup.string()
    .required('Admin password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .matches(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'
    ),
  confirm_password: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('admin_password')], 'Passwords must match'),
  backup_email: Yup.string()
    .email('Please enter a valid email address')
    .nullable(),
  notification_preferences: Yup.object({
    email_notifications: Yup.boolean(),
    sms_notifications: Yup.boolean(),
    daily_summary: Yup.boolean(),
  }),
});

// Site configuration validation
export const siteConfigSchema = Yup.object({
  site_title: Yup.string()
    .max(100, 'Site title must not exceed 100 characters')
    .nullable(),
  welcome_message: Yup.string()
    .max(500, 'Welcome message must not exceed 500 characters')
    .nullable(),
  description: Yup.string()
    .max(1000, 'Description must not exceed 1000 characters')
    .nullable(),
  contact_email: Yup.string()
    .email('Please enter a valid email address')
    .nullable(),
  primary_color: Yup.string()
    .matches(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color')
    .nullable(),
  secondary_color: Yup.string()
    .matches(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color')
    .nullable(),
  background_color: Yup.string()
    .matches(/^#([0-9A-F]{3}){1,2}$/i, 'Please enter a valid hex color')
    .nullable(),
  max_bets_per_user: Yup.number()
    .min(1, 'Must allow at least 1 bet per user')
    .max(50, 'Cannot exceed 50 bets per user')
    .integer('Must be a whole number')
    .nullable(),
  meta_description: Yup.string()
    .max(160, 'Meta description should not exceed 160 characters')
    .nullable(),
  meta_keywords: Yup.string()
    .max(255, 'Meta keywords should not exceed 255 characters')
    .nullable(),
});

// File validation helpers
export const fileValidation = {
  isValidImageFile: (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    return validTypes.includes(file.type.toLowerCase());
  },

  isValidImageSize: (file: File, maxSizeMB = 10): boolean => {
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    return file.size <= maxSizeBytes;
  },

  validateImageFile: (file: File): { isValid: boolean; error?: string } => {
    if (!fileValidation.isValidImageFile(file)) {
      return {
        isValid: false,
        error: 'Please upload a valid image file (JPEG, PNG, GIF, or WebP)',
      };
    }

    if (!fileValidation.isValidImageSize(file, 10)) {
      return {
        isValid: false,
        error: 'Image file size must not exceed 10MB',
      };
    }

    return { isValid: true };
  },

  validateMultipleImages: (files: File[]): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (files.length === 0) {
      return {
        isValid: false,
        errors: ['Please select at least one image'],
      };
    }

    if (files.length > 20) {
      errors.push('You can upload a maximum of 20 images');
    }

    files.forEach((file, index) => {
      const validation = fileValidation.validateImageFile(file);
      if (!validation.isValid) {
        errors.push(`File ${index + 1} (${file.name}): ${validation.error}`);
      }
    });

    return {
      isValid: errors.length === 0,
      errors,
    };
  },
};

// Form validation helpers
export const formValidation = {
  // Check if form has any errors
  hasErrors: (errors: Record<string, string>): boolean => {
    return Object.values(errors).some(error => error !== '');
  },

  // Get first error message from form
  getFirstError: (errors: Record<string, string>): string | null => {
    const firstError = Object.values(errors).find(error => error !== '');
    return firstError || null;
  },

  // Validate required fields
  validateRequired: (
    values: Record<string, any>,
    requiredFields: string[]
  ): Record<string, string> => {
    const errors: Record<string, string> = {};

    requiredFields.forEach(field => {
      if (!values[field] || (typeof values[field] === 'string' && values[field].trim() === '')) {
        errors[field] = 'This field is required';
      }
    });

    return errors;
  },

  // Sanitize input to prevent XSS
  sanitizeInput: (input: string): string => {
    return input
      .replace(/[<>'"&]/g, (match) => {
        switch (match) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '"': return '&quot;';
          case "'": return '&#x27;';
          case '&': return '&amp;';
          default: return match;
        }
      })
      .trim();
  },
};

// URL validation helpers
export const urlValidation = {
  isValidUrl: (url: string): boolean => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  isValidHttpsUrl: (url: string): boolean => {
    try {
      const urlObj = new URL(url);
      return urlObj.protocol === 'https:';
    } catch {
      return false;
    }
  },

  // Generate subdomain URL
  generateSubdomainUrl: (subdomain: string): string => {
    const baseUrl = process.env.REACT_APP_BASE_DOMAIN || 'base2ml.com';
    return `https://${subdomain}.${baseUrl}`;
  },
};

// Color validation helpers
export const colorValidation = {
  isValidHexColor: (color: string): boolean => {
    return /^#([0-9A-F]{3}){1,2}$/i.test(color);
  },

  hexToRgb: (hex: string): { r: number; g: number; b: number } | null => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
    } : null;
  },

  rgbToHex: (r: number, g: number, b: number): string => {
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
  },

  // Check if color provides enough contrast for accessibility
  hasGoodContrast: (foreground: string, background: string): boolean => {
    const getLuminance = (hex: string): number => {
      const rgb = colorValidation.hexToRgb(hex);
      if (!rgb) return 0;

      const { r, g, b } = rgb;
      const [rs, gs, bs] = [r, g, b].map(c => {
        c = c / 255;
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      });

      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
    };

    const l1 = getLuminance(foreground);
    const l2 = getLuminance(background);
    const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);

    return contrast >= 4.5; // WCAG AA standard
  },
};

export default {
  subdomainSchema,
  parentInfoSchema,
  venmoConfigSchema,
  adminSettingsSchema,
  siteConfigSchema,
  fileValidation,
  formValidation,
  urlValidation,
  colorValidation,
};