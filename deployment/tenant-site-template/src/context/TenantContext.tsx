import React, { createContext, useContext, ReactNode } from 'react';
import { TenantConfig } from '../config/tenant-config';

interface TenantContextType {
  config: TenantConfig;
  apiUrl: string;
  getApiUrl: (endpoint: string) => string;
}

const TenantContext = createContext<TenantContextType | undefined>(undefined);

interface TenantProviderProps {
  children: ReactNode;
  config: TenantConfig;
}

export const TenantProvider: React.FC<TenantProviderProps> = ({ children, config }) => {
  const apiUrl = `https://api.base2ml.com`;
  
  const getApiUrl = (endpoint: string) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    return `${apiUrl}${cleanEndpoint}`;
  };

  const value: TenantContextType = {
    config,
    apiUrl,
    getApiUrl,
  };

  return (
    <TenantContext.Provider value={value}>
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};