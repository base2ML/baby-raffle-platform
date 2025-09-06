import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Crown, Palette } from 'lucide-react';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { ThemeConfig, CustomTheme } from '../../types/siteBuilder';

interface ThemeSelectorProps {
  themes: ThemeConfig[];
  selectedTheme?: CustomTheme | null;
  onThemeSelect: (theme: CustomTheme) => void;
}

const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  themes,
  selectedTheme,
  onThemeSelect
}) => {
  const [hoveredTheme, setHoveredTheme] = useState<string | null>(null);

  const handleThemeSelect = (theme: ThemeConfig) => {
    const customTheme: CustomTheme = {
      base_theme: theme.theme_type,
      colors: theme.colors,
      typography: theme.typography,
      custom_css: null
    };

    onThemeSelect(customTheme);
  };

  const isSelected = (theme: ThemeConfig) => {
    return selectedTheme?.base_theme === theme.theme_type;
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Choose a theme that matches your style
        </h3>
        <p className="text-gray-600">
          You can customize colors and fonts later
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {themes.map((theme) => (
          <motion.div
            key={theme.id}
            whileHover={{ y: -4 }}
            whileTap={{ scale: 0.98 }}
            onHoverStart={() => setHoveredTheme(theme.id)}
            onHoverEnd={() => setHoveredTheme(null)}
          >
            <Card 
              className={`relative cursor-pointer transition-all duration-200 ${
                isSelected(theme) 
                  ? 'ring-2 ring-purple-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleThemeSelect(theme)}
            >
              {/* Premium Badge */}
              {theme.is_premium && (
                <div className="absolute top-3 right-3 z-10">
                  <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs px-2 py-1 rounded-full flex items-center space-x-1">
                    <Crown className="h-3 w-3" />
                    <span>Premium</span>
                  </div>
                </div>
              )}

              {/* Selection Indicator */}
              {isSelected(theme) && (
                <div className="absolute top-3 left-3 z-10">
                  <div className="bg-purple-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                </div>
              )}

              {/* Theme Preview */}
              <div className="aspect-video bg-gray-100 rounded-t-lg relative overflow-hidden">
                {theme.preview_image_url ? (
                  <img
                    src={theme.preview_image_url}
                    alt={theme.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div 
                    className="w-full h-full flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${theme.colors.primary}, ${theme.colors.secondary})`
                    }}
                  >
                    <div className="text-center text-white">
                      <div className="text-2xl font-bold mb-1" style={{ fontFamily: theme.typography.heading_font }}>
                        {theme.name}
                      </div>
                      <div className="text-sm opacity-80" style={{ fontFamily: theme.typography.body_font }}>
                        Baby Raffle Theme
                      </div>
                    </div>
                  </div>
                )}

                {/* Hover Overlay */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: hoveredTheme === theme.id ? 1 : 0 }}
                  className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center"
                >
                  <div className="bg-white rounded-lg px-4 py-2 text-sm font-medium text-gray-900">
                    Preview Theme
                  </div>
                </motion.div>
              </div>

              {/* Theme Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{theme.name}</h4>
                  <div className="flex items-center space-x-1">
                    <Palette className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-sm text-gray-600 mb-3">{theme.description}</p>

                {/* Color Palette Preview */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-gray-500">Colors:</span>
                  <div className="flex space-x-1">
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.primary }}
                      title="Primary"
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.secondary }}
                      title="Secondary"
                    />
                    <div 
                      className="w-4 h-4 rounded-full border border-gray-200"
                      style={{ backgroundColor: theme.colors.accent }}
                      title="Accent"
                    />
                  </div>
                </div>

                {/* Font Preview */}
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500 mb-1">Typography:</div>
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ fontFamily: theme.typography.heading_font }}>
                      {theme.typography.heading_font}
                    </span>
                    <span style={{ fontFamily: theme.typography.body_font }} className="text-gray-600">
                      {theme.typography.body_font}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Custom Theme Option */}
      <div className="text-center pt-8 border-t border-gray-200">
        <p className="text-gray-600 mb-4">
          Want something unique? You can customize any theme's colors and fonts in the next steps.
        </p>
        <div className="text-xs text-gray-500">
          ⚠️ Premium themes require a Professional or Premium hosting plan
        </div>
      </div>

      {/* Continue Button */}
      {selectedTheme && (
        <div className="flex justify-center pt-6">
          <Button
            onClick={() => onThemeSelect(selectedTheme)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-3"
          >
            Continue with {themes.find(t => t.theme_type === selectedTheme.base_theme)?.name}
          </Button>
        </div>
      )}
    </div>
  );
};

export default ThemeSelector;