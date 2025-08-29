import { useState, useEffect } from 'react';
import { getStats } from '@/lib/utils';

export interface CategoryStats {
  categoryKey: string;
  displayName: string;
  totalAmount: number;
  betCount: number;
  betPrice: number;
  winnerPrize: number;
}

export interface LiveStats {
  totals: {
    totalBets: number;
    validatedBets: number;
    totalAmount: number;
    validatedAmount: number;
  };
  categories: CategoryStats[];
}

export function useLiveStats() {
  const [stats, setStats] = useState<LiveStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Calculate maximum possible prize from any category
  const maxPossiblePrize = stats?.categories?.length 
    ? Math.max(...stats.categories.map(cat => cat.winnerPrize))
    : 0;

  // Format the max prize for display
  const formatMaxPrize = () => {
    if (loading) {
      return "Loading...";
    }
    if (error || maxPossiblePrize === 0) {
      return "Up to $200+ in prizes!"; // Fallback for dev/no data
    }
    return `Up to $${Math.round(maxPossiblePrize)} in prizes!`;
  };

  // Get the category with the highest prize
  const topPrizeCategory = stats?.categories?.length
    ? stats.categories.reduce((max, cat) => 
        cat.winnerPrize > max.winnerPrize ? cat : max
      )
    : null;

  const fetchStats = async () => {
    try {
      setLoading(true);
      const data = await getStats();
      setStats(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch live stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      // For development, don't spam the console if API is unavailable
      if (process.env.NODE_ENV === 'development') {
        console.log('💡 API not available - using fallback data for development');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Refresh stats every 30 seconds for live updates
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return {
    stats,
    loading,
    error,
    maxPossiblePrize,
    formatMaxPrize,
    topPrizeCategory,
    refetch: fetchStats
  };
}
