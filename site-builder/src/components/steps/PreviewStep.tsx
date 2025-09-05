import React from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useSiteBuilder } from '../../hooks/useSiteBuilder';
import { Eye, ExternalLink, ArrowLeft, Rocket } from 'lucide-react';

interface PreviewStepProps {
  onNext: () => void;
  onBack: () => void;
}

const PreviewStep: React.FC<PreviewStepProps> = ({ onNext, onBack }) => {
  const { siteData } = useSiteBuilder();

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
          <Eye className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Preview Your Site</h2>
        <p className="text-gray-600">Here's how your baby raffle site will look</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Site Preview */}
        <Card className="p-6">
          <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
            {/* Mock Browser Bar */}
            <div className="bg-gray-100 p-3 border-b flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              </div>
              <div className="bg-white rounded px-3 py-1 text-sm text-gray-600 flex-1">
                {siteData.subdomain}.mybabyraffle.com
              </div>
            </div>

            {/* Mock Site Content */}
            <div className="p-6" style={{ background: `linear-gradient(135deg, ${siteData.primaryColor}10, ${siteData.secondaryColor}10)` }}>
              <div className="text-center mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  {siteData.parentNames}'s Baby Raffle
                </h1>
                <p className="text-gray-600">Due Date: {siteData.dueDate}</p>
              </div>

              {siteData.slideshowImages.length > 0 && (
                <div className="mb-6">
                  <img
                    src={siteData.slideshowImages[0].url}
                    alt="Baby announcement"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}

              <div className="text-center">
                <div 
                  className="inline-block px-6 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: siteData.primaryColor }}
                >
                  Place Your Bets!
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Venmo: {siteData.venmoAccount}
                </p>
              </div>

              {siteData.description && (
                <div className="mt-4 p-4 bg-white rounded-lg">
                  <p className="text-gray-700">{siteData.description}</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Site Details */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Site Details</h3>
            <div className="space-y-3">
              <div>
                <span className="font-medium text-gray-700">URL:</span>
                <p className="text-blue-600">{siteData.subdomain}.mybabyraffle.com</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Parents:</span>
                <p className="text-gray-900">{siteData.parentNames}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Due Date:</span>
                <p className="text-gray-900">{siteData.dueDate}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Venmo:</span>
                <p className="text-gray-900">{siteData.venmoAccount}</p>
              </div>
              <div>
                <span className="font-medium text-gray-700">Images:</span>
                <p className="text-gray-900">{siteData.slideshowImages.length} uploaded</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-semibold mb-4">Ready to Launch?</h3>
            <p className="text-gray-600 mb-4">
              Your site looks great! Click below to deploy it live and start collecting bets from family and friends.
            </p>
            <Button
              onClick={onNext}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center justify-center"
            >
              <Rocket className="h-5 w-5 mr-2" />
              Deploy Site
            </Button>
          </Card>
        </div>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Settings
        </Button>
        <Button
          onClick={() => window.open(`https://${siteData.subdomain}.mybabyraffle.com`, '_blank')}
          variant="outline"
          className="flex items-center"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Open Preview
        </Button>
      </div>
    </div>
  );
};

export default PreviewStep;