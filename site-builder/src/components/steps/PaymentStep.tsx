import React, { useState, useEffect } from 'react';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { ArrowLeft, ArrowRight, CreditCard, Check } from 'lucide-react';
import { useSiteBuilder } from '../../hooks/useSiteBuilder';
import { toast } from 'sonner';

interface PaymentStepProps {
  onNext: () => void;
  onBack: () => void;
}

const PaymentForm: React.FC<{ months: number; onSuccess: () => void; onBack: () => void }> = ({ 
  months, 
  onSuccess, 
  onBack 
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const { createPaymentIntent } = useSiteBuilder();
  
  const [clientSecret, setClientSecret] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount, setAmount] = useState(0);

  useEffect(() => {
    const initializePayment = async () => {
      try {
        const { clientSecret, amount } = await createPaymentIntent(months);
        setClientSecret(clientSecret);
        setAmount(amount);
      } catch (error) {
        toast.error('Failed to initialize payment');
        console.error('Payment initialization failed:', error);
      }
    };

    initializePayment();
  }, [months, createPaymentIntent]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/builder?step=8`,
        },
      });

      if (error) {
        toast.error(error.message || 'Payment failed');
      } else {
        toast.success('Payment successful! Deploying your site...');
        onSuccess();
      }
    } catch (err) {
      toast.error('Payment processing failed');
      console.error('Payment error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!clientSecret) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Order Summary</h4>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between">
            <span>Setup Fee</span>
            <span>$20.00</span>
          </div>
          <div className="flex justify-between">
            <span>Hosting ({months} month{months > 1 ? 's' : ''})</span>
            <span>${(months * 10).toFixed(2)}</span>
          </div>
          <hr className="my-2" />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span>${(amount / 100).toFixed(2)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <PaymentElement 
          options={{
            layout: 'tabs'
          }}
        />
      </div>

      <div className="flex justify-between pt-6">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center space-x-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className={`
            flex items-center space-x-2 px-8 py-3 rounded-lg font-medium transition-all
            ${!isProcessing 
              ? 'bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 shadow-lg' 
              : 'bg-gray-400 text-gray-200 cursor-not-allowed'
            }
          `}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Processing...</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Pay ${(amount / 100).toFixed(2)} & Deploy</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};

const PaymentStep: React.FC<PaymentStepProps> = ({ onNext, onBack }) => {
  const [selectedMonths, setSelectedMonths] = useState(6);

  const monthOptions = [
    { months: 1, price: 30, popular: false },
    { months: 6, price: 80, popular: true },
    { months: 12, price: 140, popular: false },
    { months: 24, price: 260, popular: false }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Choose Your Hosting Duration
        </h3>
        <p className="text-gray-600">
          Pay once and your site will be hosted for your selected duration
        </p>
      </div>

      {/* Pricing Options */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {monthOptions.map(({ months, price, popular }) => (
          <div
            key={months}
            onClick={() => setSelectedMonths(months)}
            className={`
              relative cursor-pointer p-4 rounded-lg border-2 transition-all
              ${selectedMonths === months 
                ? 'border-purple-500 bg-purple-50' 
                : 'border-gray-200 hover:border-purple-300'
              }
            `}
          >
            {popular && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white text-xs px-2 py-1 rounded-full">
                Most Popular
              </div>
            )}
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {months}
              </div>
              <div className="text-sm text-gray-600 mb-2">
                month{months > 1 ? 's' : ''}
              </div>
              <div className="text-lg font-semibold text-purple-600">
                ${price}
              </div>
              <div className="text-xs text-gray-500">
                ${(price / months).toFixed(2)}/month
              </div>
            </div>
            {selectedMonths === months && (
              <div className="absolute top-2 right-2">
                <Check className="w-5 h-5 text-purple-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="max-w-md mx-auto">
        <PaymentForm 
          months={selectedMonths} 
          onSuccess={onNext} 
          onBack={onBack} 
        />
      </div>
    </div>
  );
};

export default PaymentStep;