export interface TenantConfig {
  tenantId: string;
  subdomain: string;
  parentInfo: {
    motherName: string;
    fatherName: string;
    dueDate: string;
    city: string;
    state: string;
    babyGender?: 'boy' | 'girl' | 'surprise';
    venmoAccount?: string;
  };
  siteSettings: {
    title: string;
    description: string;
    theme: {
      primaryColor: string;
      secondaryColor: string;
      fontFamily: string;
    };
    features: {
      showLeaderboard: boolean;
      showStats: boolean;
      allowComments: boolean;
    };
  };
  slideshowImages: Array<{
    id: string;
    url: string;
    caption?: string;
    order: number;
  }>;
  categories: Array<{
    id: string;
    name: string;
    description: string;
    odds: Record<string, number>;
    isActive: boolean;
  }>;
}

// Load tenant config from build-time injection or environment
const loadTenantConfig = (): TenantConfig => {
  try {
    // First try build-time injected config
    const buildTimeConfig = (window as any).__TENANT_CONFIG__;
    if (buildTimeConfig) {
      return buildTimeConfig;
    }

    // Fallback to environment variable for development
    const envConfig = import.meta.env.VITE_TENANT_CONFIG;
    if (envConfig && typeof envConfig === 'string') {
      return JSON.parse(envConfig);
    }

    // Development fallback
    return {
      tenantId: 'dev-tenant',
      subdomain: 'example',
      parentInfo: {
        motherName: 'Jane Doe',
        fatherName: 'John Doe',
        dueDate: '2024-12-25',
        city: 'San Francisco',
        state: 'CA',
        babyGender: 'surprise',
        venmoAccount: '@jane-doe'
      },
      siteSettings: {
        title: 'Baby Doe Betting Pool',
        description: 'Place your bets on when Baby Doe will arrive!',
        theme: {
          primaryColor: '#3b82f6',
          secondaryColor: '#f59e0b',
          fontFamily: 'Inter'
        },
        features: {
          showLeaderboard: true,
          showStats: true,
          allowComments: true
        }
      },
      slideshowImages: [
        {
          id: '1',
          url: '/demo-ultrasound.jpg',
          caption: 'First ultrasound!',
          order: 1
        }
      ],
      categories: [
        {
          id: 'birth-date',
          name: 'Birth Date',
          description: 'When will the baby arrive?',
          odds: {},
          isActive: true
        },
        {
          id: 'birth-time',
          name: 'Birth Time',
          description: 'What time will the baby be born?',
          odds: {},
          isActive: true
        },
        {
          id: 'weight',
          name: 'Birth Weight',
          description: 'How much will the baby weigh?',
          odds: {},
          isActive: true
        },
        {
          id: 'length',
          name: 'Birth Length',
          description: 'How long will the baby be?',
          odds: {},
          isActive: true
        }
      ]
    };
  } catch (error) {
    console.error('Failed to load tenant config:', error);
    throw new Error('Invalid tenant configuration');
  }
};

export const tenantConfig: TenantConfig = loadTenantConfig();
export const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'https://api.base2ml.com';