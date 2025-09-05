import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';

export interface SiteConfig {
  subdomain: string;
  siteName: string;
  parentNames: string;
  dueDate: string;
  venmoAccount: string;
  adminPassword: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
  slideshowImages: File[];
  logoFile?: File;
}

export interface DeploymentStatus {
  status: 'pending' | 'building' | 'deploying' | 'completed' | 'failed';
  message?: string;
  siteUrl?: string;
  deploymentId?: string;
}

interface SiteBuilderContextType {
  config: SiteConfig;
  updateConfig: (updates: Partial<SiteConfig>) => void;
  currentStep: number;
  setCurrentStep: (step: number) => void;
  isSubdomainAvailable: (subdomain: string) => Promise<boolean>;
  saveProgress: () => Promise<void>;
  loadProgress: () => Promise<void>;
  createPaymentIntent: (months: number) => Promise<{ clientSecret: string; amount: number }>;
  deploymentStatus: DeploymentStatus | null;
  checkDeploymentStatus: (deploymentId: string) => Promise<void>;
}

const defaultConfig: SiteConfig = {
  subdomain: '',
  siteName: '',
  parentNames: '',
  dueDate: '',
  venmoAccount: '',
  adminPassword: '',
  primaryColor: '#ec4899',
  secondaryColor: '#8b5cf6',
  description: '',
  slideshowImages: [],
  logoFile: undefined
};

const SiteBuilderContext = createContext<SiteBuilderContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://api.base2ml.com';

export const SiteBuilderProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig>(defaultConfig);
  const [currentStep, setCurrentStep] = useState(1);
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus | null>(null);

  // Load saved progress on mount
  useEffect(() => {
    loadProgress();
  }, []);

  const updateConfig = (updates: Partial<SiteConfig>) => {
    setConfig(prev => ({
      ...prev,
      ...updates
    }));
    
    // Auto-save progress
    setTimeout(() => saveProgress(), 1000);
  };

  const isSubdomainAvailable = async (subdomain: string): Promise<boolean> => {
    try {
      const response = await axios.get(`${API_BASE}/api/subdomains/check-availability/${subdomain}`);
      return response.data.available;
    } catch (error) {
      console.error('Failed to check subdomain availability:', error);
      return false;
    }
  };

  const saveProgress = async () => {
    try {
      // Save to localStorage for now - could extend to API later
      const progress = {
        config: {
          ...config,
          slideshowImages: [], // Don't save files to localStorage
          logoFile: undefined
        },
        currentStep,
        timestamp: Date.now()
      };
      localStorage.setItem('siteBuilder_progress', JSON.stringify(progress));
    } catch (error) {
      console.error('Failed to save progress:', error);
    }
  };

  const loadProgress = async () => {
    try {
      const saved = localStorage.getItem('siteBuilder_progress');
      if (saved) {
        const progress = JSON.parse(saved);
        // Only restore if saved within last 24 hours
        if (Date.now() - progress.timestamp < 24 * 60 * 60 * 1000) {
          setConfig(prev => ({
            ...prev,
            ...progress.config
          }));
          setCurrentStep(progress.currentStep);
        }
      }
    } catch (error) {
      console.error('Failed to load progress:', error);
    }
  };

  const createPaymentIntent = async (months: number) => {
    try {
      const setupFee = 2000; // $20 in cents
      const monthlyFee = 1000; // $10 in cents
      const totalAmount = setupFee + (monthlyFee * months);

      const response = await axios.post(`${API_BASE}/api/billing/create-payment-intent`, {
        amount: totalAmount,
        currency: 'usd',
        months,
        site_config: {
          subdomain: config.subdomain,
          site_name: config.siteName,
          parent_names: config.parentNames,
          due_date: config.dueDate,
          venmo_account: config.venmoAccount,
          primary_color: config.primaryColor,
          secondary_color: config.secondaryColor,
          description: config.description
        }
      });

      return {
        clientSecret: response.data.client_secret,
        amount: totalAmount
      };
    } catch (error) {
      console.error('Failed to create payment intent:', error);
      throw error;
    }
  };

  const checkDeploymentStatus = async (deploymentId: string) => {
    try {
      const response = await axios.get(`${API_BASE}/api/site/deployment-status/${deploymentId}`);
      setDeploymentStatus(response.data);
    } catch (error) {
      console.error('Failed to check deployment status:', error);
      setDeploymentStatus({
        status: 'failed',
        message: 'Failed to check deployment status'
      });
    }
  };

  const value = {
    config,
    updateConfig,
    currentStep,
    setCurrentStep,
    isSubdomainAvailable,
    saveProgress,
    loadProgress,
    createPaymentIntent,
    deploymentStatus,
    checkDeploymentStatus
  };

  return (
    <SiteBuilderContext.Provider value={value}>
      {children}
    </SiteBuilderContext.Provider>
  );
};

export const useSiteBuilder = (): SiteBuilderContextType => {
  const context = useContext(SiteBuilderContext);
  if (!context) {
    throw new Error('useSiteBuilder must be used within a SiteBuilderProvider');
  }
  return context;
};