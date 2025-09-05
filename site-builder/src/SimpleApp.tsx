import React from 'react';
import { Baby, Sparkles } from 'lucide-react';

const SimpleApp: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-2xl w-full text-center">
        <div className="flex justify-center mb-6">
          <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-4">
            <Baby className="h-12 w-12 text-white" />
          </div>
        </div>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Baby Raffle Site Builder
        </h1>
        
        <p className="text-xl text-gray-600 mb-8">
          Create beautiful, personalized baby raffle sites in minutes
        </p>
        
        <div className="bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg p-6 mb-8">
          <div className="flex items-center justify-center mb-4">
            <Sparkles className="h-6 w-6 text-pink-500 mr-2" />
            <span className="text-lg font-semibold text-gray-800">Coming Soon!</span>
          </div>
          <p className="text-gray-700">
            Our site builder is being enhanced with amazing new features. 
            In the meantime, visit our marketing site to learn more about Baby Raffle.
          </p>
        </div>
        
        <div className="space-y-4">
          <a
            href="https://baby-raffle-marketing-j0scnt4s2-slimhindrances-projects.vercel.app"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-semibold px-8 py-3 rounded-lg transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            Visit Marketing Site
          </a>
          
          <div className="text-sm text-gray-500">
            <p>✨ Beautiful themes and customization</p>
            <p>🎯 Easy setup wizard</p>
            <p>💝 Perfect for baby showers</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleApp;