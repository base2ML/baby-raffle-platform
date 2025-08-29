import { useMemo } from 'react';
import { AppConfig, loadConfig } from '@/config/app-config';

/**
 * React hook for accessing app configuration
 * This hook loads the configuration and memoizes it for performance
 */
export function useConfig(): AppConfig {
  const config = useMemo(() => {
    return loadConfig();
  }, []);
  
  return config;
}

/**
 * Hook for accessing specific configuration values with type safety
 */
export function useConfigValue<T>(
  selector: (config: AppConfig) => T
): T {
  const config = useConfig();
  return useMemo(() => selector(config), [config, selector]);
}

// Convenience hooks for commonly used config sections
export function useEventConfig() {
  return useConfigValue(config => config.event);
}

export function useBettingConfig() {
  return useConfigValue(config => config.betting);
}

export function usePaymentConfig() {
  return useConfigValue(config => config.payment);
}

export function useSocialConfig() {
  return useConfigValue(config => config.social);
}

export function useImageConfig() {
  return useConfigValue(config => config.images);
}

export function useAdminConfig() {
  return useConfigValue(config => config.admin);
}
