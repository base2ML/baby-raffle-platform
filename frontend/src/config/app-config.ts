// Event Details
export interface AppConfig {
  event: {
    parentNames: string;
    eventTitle: string;
    eventSubtitle: string;
    welcomeMessage: string;
    footerMessage: string;
  };
  
  // Betting Configuration
  betting: {
    pricePerBet: number;
    winnerPercentage: number; // e.g., 0.5 for 50%
    currency: string;
    categories: BettingCategory[];
  };
  
  // Payment Configuration
  payment: {
    venmoUsername: string;
    paymentInstructions: string;
    paymentNote: string;
  };
  
  // Social Sharing
  social: {
    shareTitle: string;
    shareText: string;
    shareTextExpanded: string;
  };
  
  // Images
  images: {
    slideshow: SlideImage[];
    logo?: string;
    favicon?: string;
  };
  
  // Admin Configuration
  admin: {
    adminTitle: string;
    supportEmail?: string;
  };
}

export interface BettingCategory {
  categoryKey: string;
  displayName: string;
  description: string;
  placeholder: string;
  betPrice?: number; // Optional override for category-specific pricing
}

export interface SlideImage {
  src: string;
  caption: string;
  subtitle: string;
  alt?: string;
}

// Default configuration that can be overridden
export const defaultConfig: AppConfig = {
  event: {
    parentNames: "Ali & Herb",
    eventTitle: "Join Us in Welcoming Ms. Margo Jones!",
    eventSubtitle: "Make predictions about our little one's arrival",
    welcomeMessage: "Welcome to our baby raffle! We're so excited to share this journey with you.",
    footerMessage: "Can't Wait to Meet You, Little One!"
  },
  
  betting: {
    pricePerBet: 5.00,
    winnerPercentage: 0.5,
    currency: "USD",
    categories: [
      {
        categoryKey: "birth_date",
        displayName: "Birth Date",
        description: "Guess when the baby will arrive",
        placeholder: "e.g., March 15, 2024"
      },
      {
        categoryKey: "birth_weight",
        displayName: "Birth Weight", 
        description: "Guess how much the baby will weigh",
        placeholder: "e.g., 7 lbs 8 oz"
      },
      {
        categoryKey: "birth_length",
        displayName: "Birth Length",
        description: "Guess how long the baby will be",
        placeholder: "e.g., 20 inches"
      },
      {
        categoryKey: "head_circumference",
        displayName: "Head Circumference",
        description: "Guess the baby's head circumference", 
        placeholder: "e.g., 14 inches"
      }
    ]
  },
  
  payment: {
    venmoUsername: "@Christopher-Lindeman-7",
    paymentInstructions: "Send payment via Venmo",
    paymentNote: "Include your name in the Venmo note. Your bets will be verified once payment is received."
  },
  
  social: {
    shareTitle: "Join Our Baby Raffle!",
    shareText: "I just entered a baby raffle! Join me in making predictions about the little one's arrival. Fun prizes await!",
    shareTextExpanded: "I'm joining this baby raffle! Come make predictions about the little one's arrival with me. Amazing prizes await the best guessers!"
  },
  
  images: {
    slideshow: [
      {
        src: "/expecting-couple-baby-shoes.png",
        caption: "Meet the Parents - Our Little One is Almost Here!",
        subtitle: "Join us in celebrating this magical journey",
        alt: "Expecting couple with baby shoes"
      },
      {
        src: "/beautiful-baby-nursery.png", 
        caption: "The Nursery is Ready - Now We Wait!",
        subtitle: "Every detail prepared with love",
        alt: "Beautiful baby nursery"
      },
      {
        src: "/baby-shower-diapers-gifts.png",
        caption: "Join Our Baby Raffle & Birth Predictions!",
        subtitle: "Fun prizes await the best guessers",
        alt: "Baby shower with diapers and gifts"
      }
    ]
  },
  
  admin: {
    adminTitle: "Baby Raffle Admin",
    supportEmail: "admin@example.com"
  }
};

// Function to load configuration for client-side React
export function loadConfig(): AppConfig {
  try {
    // Try to load custom config (will be resolved at build time)
    import('./custom-config').then(module => {
      return { ...defaultConfig, ...module.default };
    }).catch(() => {
      return defaultConfig;
    });
    
    // For now, load synchronously (will be bundled)
    const customConfig = require('./custom-config').default;
    return { ...defaultConfig, ...customConfig };
  } catch {
    // Fall back to default config
    return defaultConfig;
  }
}

// Helper function to get a specific config value with fallback
export function getConfigValue<T>(path: string, fallback: T): T {
  const config = loadConfig();
  const keys = path.split('.');
  let value: any = config;
  
  for (const key of keys) {
    if (value && typeof value === 'object' && key in value) {
      value = value[key];
    } else {
      return fallback;
    }
  }
  
  return value !== undefined ? value : fallback;
}
