import React from 'react';
import { Button } from '../common/Button';
import { Card } from '../common/Card';
import { useSiteBuilder } from '../../hooks/useSiteBuilder';
import { Settings, Palette, ArrowLeft, ArrowRight } from 'lucide-react';

interface SettingsStepProps {
  onNext: () => void;
  onBack: () => void;
}

const SettingsStep: React.FC<SettingsStepProps> = ({ onNext, onBack }) => {
  const { siteData, updateSiteData } = useSiteBuilder();

  const colorThemes = [
    { name: 'Pink & Purple', primary: '#ec4899', secondary: '#8b5cf6' },
    { name: 'Blue & Teal', primary: '#3b82f6', secondary: '#14b8a6' },
    { name: 'Green & Lime', primary: '#10b981', secondary: '#84cc16' },
    { name: 'Orange & Red', primary: '#f59e0b', secondary: '#ef4444' },
  ];

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-3 w-16 h-16 mx-auto mb-4">
          <Settings className="h-10 w-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Customize Your Site</h2>
        <p className="text-gray-600">Choose colors and settings for your baby raffle site</p>
      </div>

      <div className="space-y-8">
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Palette className="h-5 w-5 mr-2" />
            Color Theme
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {colorThemes.map((theme, index) => (
              <div
                key={index}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  siteData.primaryColor === theme.primary
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => updateSiteData({
                  primaryColor: theme.primary,
                  secondaryColor: theme.secondary
                })}
              >
                <div className="flex items-center space-x-3 mb-2">
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: theme.primary }}
                  />
                  <div
                    className="w-6 h-6 rounded-full"
                    style={{ backgroundColor: theme.secondary }}
                  />
                </div>
                <p className="font-medium">{theme.name}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4">Site Description</h3>
          <textarea
            value={siteData.description || ''}
            onChange={(e) => updateSiteData({ description: e.target.value })}
            placeholder="Add a special message for your guests..."
            className="w-full p-3 border border-gray-300 rounded-lg resize-none h-24"
          />
        </Card>
      </div>

      <div className="flex justify-between mt-8">
        <Button
          onClick={onBack}
          variant="outline"
          className="flex items-center"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Button
          onClick={onNext}
          className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white flex items-center"
        >
          Continue
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};

export default SettingsStep;