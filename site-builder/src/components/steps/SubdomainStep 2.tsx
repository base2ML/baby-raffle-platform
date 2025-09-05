import React, { useState, useEffect } from 'react';
import { Check, X, Loader2 } from 'lucide-react';
import { useSiteBuilder } from '../../hooks/useSiteBuilder';

interface SubdomainStepProps {
  onNext: () => void;
}

const SubdomainStep: React.FC<SubdomainStepProps> = ({ onNext }) => {
  const { config, updateConfig } = useSiteBuilder();
  const [isChecking, setIsChecking] = useState(false);
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState('');

  const { isSubdomainAvailable } = useSiteBuilder();

  const checkAvailability = async (subdomain: string) => {
    if (subdomain.length < 3) {
      setIsAvailable(null);
      setError('Subdomain must be at least 3 characters');
      return;
    }

    if (!/^[a-z0-9-]+$/.test(subdomain)) {
      setIsAvailable(null);
      setError('Only lowercase letters, numbers, and hyphens allowed');
      return;
    }

    setIsChecking(true);
    setError('');
    
    try {
      const available = await isSubdomainAvailable(subdomain);
      setIsAvailable(available);
      if (!available) {
        setError('This subdomain is already taken');
      }
    } catch (err) {
      setError('Failed to check availability');
      setIsAvailable(null);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (config.subdomain) {
        checkAvailability(config.subdomain);
      }
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [config.subdomain]);

  const handleSubdomainChange = (value: string) => {
    const sanitized = value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    updateConfig({ subdomain: sanitized });
  };

  const canProceed = config.subdomain.length >= 3 && isAvailable === true && !isChecking;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Your Site Address
        </h3>
        <p className="text-gray-600">
          Your baby raffle site will be available at this custom subdomain
        </p>
      </div>

      <div className="max-w-md mx-auto space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Subdomain Name
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={config.subdomain}
              onChange={(e) => handleSubdomainChange(e.target.value)}
              placeholder="mybaby"
              className="flex-1 px-4 py-3 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              maxLength={20}
            />
            <div className="px-4 py-3 bg-gray-50 border border-l-0 border-gray-300 rounded-r-lg text-sm text-gray-600">
              .base2ml.com
            </div>
          </div>
        </div>

        {/* Availability Status */}
        <div className="flex items-center space-x-2 min-h-[24px]">
          {isChecking && (
            <div className="flex items-center space-x-2 text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Checking availability...</span>
            </div>
          )}
          
          {isAvailable === true && !isChecking && (
            <div className="flex items-center space-x-2 text-green-600">
              <Check className="w-4 h-4" />
              <span className="text-sm font-medium">Available!</span>
            </div>
          )}
          
          {error && (
            <div className="flex items-center space-x-2 text-red-600">
              <X className="w-4 h-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Preview */}
        {config.subdomain && isAvailable && (
          <div className="p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-gray-600 mb-1">Your site will be available at:</p>
            <p className="text-lg font-semibold text-purple-700">
              https://{config.subdomain}.base2ml.com
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Site Name
          </label>
          <input
            type="text"
            value={config.siteName}
            onChange={(e) => updateConfig({ siteName: e.target.value })}
            placeholder="Baby Smith's Arrival Pool"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            maxLength={50}
          />
          <p className="text-xs text-gray-500">
            This will be displayed as the main title of your baby raffle site
          </p>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-end pt-6">
        <button
          onClick={onNext}
          disabled={!canProceed}
          className={`
            flex items-center space-x-2 px-6 py-3 rounded-lg font-medium transition-all
            ${canProceed 
              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:from-pink-600 hover:to-purple-700 shadow-lg' 
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          <span>Continue</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default SubdomainStep;