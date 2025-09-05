import React, { useEffect, useState } from 'react';
import { CheckCircle, ExternalLink, Copy, Loader2, AlertCircle, ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { useSiteBuilder, DeploymentStatus } from '../../hooks/useSiteBuilder';
import { toast } from 'react-hot-toast';

interface DeploymentStepProps {
  onBack: () => void;
}

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
}

interface PaymentFormProps {
  months: number;
  onSuccess: () => void;
  onBack: () => void;
}

const DeploymentStep: React.FC<DeploymentStepProps> = ({ onBack }) => {
  const { config, deploymentStatus, checkDeploymentStatus } = useSiteBuilder();
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  const siteUrl = `https://${config.subdomain}.base2ml.com`;

  useEffect(() => {
    // Start polling deployment status
    const pollStatus = async () => {
      // Get deployment ID from URL params or local storage
      const urlParams = new URLSearchParams(window.location.search);
      const deploymentId = urlParams.get('deployment_id') || localStorage.getItem('deployment_id');
      
      if (deploymentId) {
        await checkDeploymentStatus(deploymentId);
      }
    };

    // Poll immediately
    pollStatus();

    // Set up polling interval
    const interval = setInterval(pollStatus, 5000); // Poll every 5 seconds
    setPollingInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [checkDeploymentStatus]);

  // Stop polling when deployment is complete or failed
  useEffect(() => {
    if (deploymentStatus?.status === 'completed' || deploymentStatus?.status === 'failed') {
      if (pollingInterval) {
        clearInterval(pollingInterval);
        setPollingInterval(null);
      }
    }
  }, [deploymentStatus, pollingInterval]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const getStatusDisplay = () => {
    if (!deploymentStatus) {
      return {
        title: 'Initializing Deployment',
        description: 'Setting up your baby raffle site...',
        icon: <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />,
        color: 'blue'
      };
    }

    switch (deploymentStatus.status) {
      case 'building':
        return {
          title: 'Building Your Site',
          description: 'Generating your custom baby raffle site with your configuration...',
          icon: <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />,
          color: 'blue'
        };
      
      case 'deploying':
        return {
          title: 'Deploying to Cloud',
          description: 'Publishing your site to the internet...',
          icon: <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />,
          color: 'purple'
        };
      
      case 'completed':
        return {
          title: 'Site Deployed Successfully!',
          description: 'Your baby raffle site is now live and ready for visitors.',
          icon: <CheckCircle className="w-8 h-8 text-green-500" />,
          color: 'green'
        };
      
      case 'failed':
        return {
          title: 'Deployment Failed',
          description: deploymentStatus.message || 'Something went wrong during deployment.',
          icon: <AlertCircle className="w-8 h-8 text-red-500" />,
          color: 'red'
        };
      
      default:
        return {
          title: 'Processing',
          description: 'Please wait while we process your request...',
          icon: <Loader2 className="w-8 h-8 text-gray-500 animate-spin" />,
          color: 'gray'
        };
    }
  };

  const statusDisplay = getStatusDisplay();

  return (
    <div className="space-y-8">
      {/* Status Display */}
      <div className="text-center">
        <div className="flex justify-center mb-4">
          {statusDisplay.icon}
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          {statusDisplay.title}
        </h3>
        <p className="text-gray-600 max-w-md mx-auto">
          {statusDisplay.description}
        </p>
      </div>

      {/* Site Information */}
      <div className="max-w-md mx-auto bg-white border border-gray-200 rounded-lg p-6 space-y-4">
        <div>
          <h4 className="font-semibold text-gray-900 mb-1">Site Information</h4>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Site Name:</span>
              <span className="font-medium">{config.siteName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subdomain:</span>
              <span className="font-medium">{config.subdomain}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Parent Names:</span>
              <span className="font-medium">{config.parentNames}</span>
            </div>
          </div>
        </div>

        {/* Site URL (show when completed) */}
        {deploymentStatus?.status === 'completed' && (
          <div className="pt-4 border-t">
            <h4 className="font-semibold text-gray-900 mb-2">Your Site is Live!</h4>
            <div className="flex items-center space-x-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex-1">
                <p className="text-sm font-medium text-green-900">{siteUrl}</p>
              </div>
              <button
                onClick={() => copyToClipboard(siteUrl)}
                className="p-2 text-green-600 hover:text-green-700"
              >
                <Copy className="w-4 h-4" />
              </button>
              <a
                href={siteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-green-600 hover:text-green-700"
              >
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Progress Steps */}
      {deploymentStatus && deploymentStatus.status !== 'failed' && (
        <div className="max-w-md mx-auto space-y-3">
          <div className={`flex items-center space-x-3 ${
            ['building', 'deploying', 'completed'].includes(deploymentStatus.status) 
              ? 'text-green-600' 
              : 'text-gray-400'
          }`}>
            <CheckCircle className="w-5 h-5" />
            <span>Payment processed successfully</span>
          </div>
          
          <div className={`flex items-center space-x-3 ${
            ['deploying', 'completed'].includes(deploymentStatus.status) 
              ? 'text-green-600' 
              : deploymentStatus.status === 'building' 
                ? 'text-blue-600' 
                : 'text-gray-400'
          }`}>
            {deploymentStatus.status === 'building' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>Building your custom site</span>
          </div>
          
          <div className={`flex items-center space-x-3 ${
            deploymentStatus.status === 'completed' 
              ? 'text-green-600' 
              : deploymentStatus.status === 'deploying' 
                ? 'text-purple-600' 
                : 'text-gray-400'
          }`}>
            {deploymentStatus.status === 'deploying' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <CheckCircle className="w-5 h-5" />
            )}
            <span>Deploying to {config.subdomain}.base2ml.com</span>
          </div>
        </div>
      )}

      {/* Error State */}
      {deploymentStatus?.status === 'failed' && (
        <div className="max-w-md mx-auto bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <div>
              <h4 className="font-medium">Deployment Failed</h4>
              <p className="text-sm mt-1">{deploymentStatus.message}</p>
              <p className="text-sm mt-2">
                Don't worry - your payment was successful. Our team has been notified and will resolve this issue.
                You'll receive an email update within 24 hours.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Actions */}
      {deploymentStatus?.status === 'completed' && (
        <div className="text-center space-y-4">
          <div className="flex justify-center space-x-4">
            <a
              href={siteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:from-pink-600 hover:to-purple-700 shadow-lg"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Visit Your Site</span>
            </a>
            
            <button
              onClick={() => window.location.href = 'https://mybabyraffle.base2ml.com/dashboard'}
              className="flex items-center space-x-2 px-6 py-3 border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50"
            >
              <span>Manage Site</span>
            </button>
          </div>
          
          <p className="text-sm text-gray-600">
            Your site is now live! Share the link with friends and family to start collecting bets.
          </p>
        </div>
      )}
    </div>
  );
};

const PaymentForm: React.FC<PaymentFormProps> = ({ months, onSuccess, onBack }) => {
  return (
    <div className="max-w-md mx-auto p-6">
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-gray-900">Complete Payment</h3>
        <p className="text-gray-600">
          {months} month{months > 1 ? 's' : ''} of hosting - ${20 + (months * 10)}
        </p>
      </div>
      <div className="bg-gray-100 p-4 rounded-lg text-center">
        <p className="text-gray-600 mb-4">Payment processing would go here</p>
        <button
          onClick={onSuccess}
          className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
        >
          Complete Payment (Demo)
        </button>
      </div>
      <button
        onClick={onBack}
        className="w-full mt-4 text-gray-600 hover:text-gray-800"
      >
        Back to Plan Selection
      </button>
    </div>
  );
};

const PaymentStep: React.FC<PaymentStepProps> = ({ onNext, onBack }) => {
  const [selectedMonths, setSelectedMonths] = useState(6);
  const [showPaymentForm, setShowPaymentForm] = useState(false);

  if (showPaymentForm) {
    return <PaymentForm months={selectedMonths} onSuccess={onNext} onBack={() => setShowPaymentForm(false)} />;
  }

  const monthOptions = [
    { months: 1, price: 30, popular: false, savings: 0 },
    { months: 6, price: 80, popular: true, savings: 20 },
    { months: 12, price: 140, popular: false, savings: 60 },
    { months: 24, price: 260, popular: false, savings: 140 }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Your Hosting Plan
        </h3>
        <p className="text-gray-600">
          One-time payment covers setup fee + hosting for your selected duration
        </p>
      </div>

      {/* Pricing Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
        {monthOptions.map(({ months, price, popular, savings }) => (
          <div
            key={months}
            onClick={() => setSelectedMonths(months)}
            className={`
              relative cursor-pointer p-6 rounded-xl border-2 transition-all hover:shadow-lg
              ${selectedMonths === months 
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-pink-50 shadow-md' 
                : 'border-gray-200 hover:border-purple-300 bg-white'
              }
            `}
          >
            {popular && (
              <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-3 py-1 rounded-full font-medium">
                  Most Popular
                </div>
              </div>
            )}
            
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-1">
                {months}
              </div>
              <div className="text-sm text-gray-600 mb-3">
                month{months > 1 ? 's' : ''}
              </div>
              
              <div className="text-2xl font-bold text-purple-600 mb-1">
                ${price}
              </div>
              
              <div className="text-sm text-gray-500 mb-2">
                ${(price / months).toFixed(2)}/month
              </div>

              {savings > 0 && (
                <div className="inline-block bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">
                  Save ${savings}
                </div>
              )}
            </div>

            {selectedMonths === months && (
              <div className="absolute top-3 right-3">
                <div className="bg-purple-500 text-white rounded-full p-1">
                  <Check className="w-4 h-4" />
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pricing Breakdown */}
      <div className="max-w-md mx-auto bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-3">What's Included</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span>Setup Fee (one-time)</span>
            <span className="font-medium">$20.00</span>
          </div>
          <div className="flex justify-between">
            <span>Hosting ({selectedMonths} month{selectedMonths > 1 ? 's' : ''})</span>
            <span className="font-medium">${(selectedMonths * 10).toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between text-base font-semibold">
            <span>Total</span>
            <span>${monthOptions.find(o => o.months === selectedMonths)?.price}</span>
          </div>
        </div>
        
        <div className="mt-4 pt-3 border-t border-gray-200">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-gray-600">
              <p>✓ Custom subdomain & SSL certificate</p>
              <p>✓ Unlimited bets & participants</p>
              <p>✓ Real-time statistics & analytics</p>
              <p>✓ Mobile-responsive design</p>
              <p>✓ 99.9% uptime guarantee</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between pt-6">
        <button
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Preview</span>
        </button>

        <button
          onClick={() => setShowPaymentForm(true)}
          className="flex items-center space-x-2 px-8 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg hover:from-green-600 hover:to-green-700 shadow-lg font-medium"
        >
          <span>Proceed to Payment</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default DeploymentStep;