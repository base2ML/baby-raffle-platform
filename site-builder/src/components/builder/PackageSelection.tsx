import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Zap, Star } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { HostingPackage, PackageTier } from '../../types/siteBuilder';
import { builderAPI, formatPrice } from '../../services/builderAPI';
import { toast } from 'sonner';

interface PackageSelectionProps {
  selectedPackage?: PackageTier | null;
  billingCycle: 'monthly' | 'yearly';
  onPackageSelect: (packageTier: PackageTier, billingCycle: 'monthly' | 'yearly') => void;
  onBillingCycleChange: (cycle: 'monthly' | 'yearly') => void;
}

const PackageSelection: React.FC<PackageSelectionProps> = ({
  selectedPackage,
  billingCycle,
  onPackageSelect,
  onBillingCycleChange
}) => {
  const [packages, setPackages] = useState<HostingPackage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPackages();
  }, []);

  const loadPackages = async () => {
    try {
      const packagesData = await builderAPI.getHostingPackages();
      setPackages(packagesData);
    } catch (error) {
      console.error('Failed to load packages:', error);
      toast.error('Failed to load hosting packages');
    } finally {
      setLoading(false);
    }
  };

  const getPackagePrice = (pkg: HostingPackage) => {
    return billingCycle === 'yearly' ? pkg.price_yearly : pkg.price_monthly;
  };

  const getPackageIcon = (tier: PackageTier) => {
    switch (tier) {
      case 'starter':
        return <Zap className="h-6 w-6" />;
      case 'professional':
        return <Star className="h-6 w-6" />;
      case 'premium':
        return <Crown className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  const getPackageColor = (tier: PackageTier) => {
    switch (tier) {
      case 'starter':
        return 'from-blue-500 to-blue-600';
      case 'professional':
        return 'from-purple-500 to-purple-600';
      case 'premium':
        return 'from-pink-500 to-pink-600';
      case 'enterprise':
        return 'from-gray-800 to-gray-900';
      default:
        return 'from-blue-500 to-blue-600';
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading hosting packages...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          Choose Your Hosting Plan
        </h3>
        <p className="text-gray-600">
          Select a plan that fits your needs. You can upgrade or downgrade anytime.
        </p>
      </div>

      {/* Billing Toggle */}
      <div className="flex justify-center">
        <div className="bg-gray-100 rounded-lg p-1 flex">
          <button
            onClick={() => onBillingCycleChange('monthly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'monthly'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Monthly
          </button>
          <button
            onClick={() => onBillingCycleChange('yearly')}
            className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
              billingCycle === 'yearly'
                ? 'bg-white text-purple-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Yearly
            <span className="ml-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full">
              Save 17%
            </span>
          </button>
        </div>
      </div>

      {/* Package Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {packages.map((pkg) => (
          <motion.div
            key={pkg.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
          >
            <Card 
              className={`relative cursor-pointer transition-all duration-200 h-full ${
                selectedPackage === pkg.tier
                  ? 'ring-2 ring-purple-500 shadow-lg'
                  : 'hover:shadow-md'
              } ${
                pkg.popular
                  ? 'border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50'
                  : ''
              }`}
              onClick={() => onPackageSelect(pkg.tier, billingCycle)}
            >
              {/* Popular Badge */}
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs px-4 py-1 rounded-full font-medium">
                    Most Popular
                  </div>
                </div>
              )}

              {/* Selection Indicator */}
              {selectedPackage === pkg.tier && (
                <div className="absolute top-4 right-4">
                  <div className="bg-purple-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              <div className="p-6">
                {/* Package Header */}
                <div className="text-center mb-6">
                  <div className={`inline-flex p-3 rounded-full bg-gradient-to-r ${getPackageColor(pkg.tier)} text-white mb-4`}>
                    {getPackageIcon(pkg.tier)}
                  </div>
                  <h4 className="text-xl font-bold text-gray-900">{pkg.name}</h4>
                  <p className="text-gray-600 text-sm mt-1">{pkg.description}</p>
                </div>

                {/* Pricing */}
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatPrice(getPackagePrice(pkg))}
                  </div>
                  <div className="text-gray-600 text-sm">
                    per {billingCycle === 'yearly' ? 'year' : 'month'}
                  </div>
                  {billingCycle === 'yearly' && (
                    <div className="text-xs text-green-600 mt-1">
                      Save {formatPrice(pkg.price_monthly * 12 - pkg.price_yearly)} per year
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3 mb-6">
                  {pkg.features.map((feature, index) => (
                    <div key={index} className="flex items-start space-x-3">
                      <div className={`mt-1 ${
                        feature.included 
                          ? 'text-green-500' 
                          : 'text-gray-300'
                      }`}>
                        <Check className="h-4 w-4" />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${
                          feature.included 
                            ? 'text-gray-900' 
                            : 'text-gray-400'
                        }`}>
                          {feature.name}
                          {feature.limit && (
                            <span className="ml-1 text-xs text-gray-500">
                              (up to {feature.limit})
                            </span>
                          )}
                        </div>
                        <div className={`text-xs ${
                          feature.included 
                            ? 'text-gray-600' 
                            : 'text-gray-400'
                        }`}>
                          {feature.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Select Button */}
                <Button
                  onClick={() => onPackageSelect(pkg.tier, billingCycle)}
                  className={`w-full ${
                    selectedPackage === pkg.tier
                      ? 'bg-purple-600 text-white'
                      : pkg.popular
                      ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {selectedPackage === pkg.tier ? 'Selected' : `Choose ${pkg.name}`}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Additional Info */}
      <div className="text-center space-y-4 pt-6 border-t border-gray-200">
        <div className="flex justify-center space-x-8 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>30-day money-back guarantee</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center space-x-2">
            <Check className="h-4 w-4 text-green-500" />
            <span>Free SSL certificate</span>
          </div>
        </div>
        
        <p className="text-xs text-gray-500">
          All plans include hosting, automatic backups, and basic support. 
          Premium features require higher tier plans.
        </p>
      </div>
    </div>
  );
};

export default PackageSelection;