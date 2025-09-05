import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Card } from '../components/common/Card';
import { Baby, Sparkles, Heart, Gift } from 'lucide-react';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleGetStarted = () => {
    navigate('/builder');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="bg-gradient-to-r from-pink-500 to-purple-600 rounded-full p-4">
              <Baby className="h-12 w-12 text-white" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Create Your Baby Raffle Site
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Build a beautiful, personalized site for family and friends to guess your baby's details
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center p-8">
            <div className="bg-pink-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Sparkles className="h-8 w-8 text-pink-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Beautiful Design</h3>
            <p className="text-gray-600">
              Gorgeous themes that celebrate your special moment
            </p>
          </Card>

          <Card className="text-center p-8">
            <div className="bg-purple-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Heart className="h-8 w-8 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Easy to Use</h3>
            <p className="text-gray-600">
              Simple setup wizard gets you live in minutes
            </p>
          </Card>

          <Card className="text-center p-8">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
              <Gift className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Fun Experience</h3>
            <p className="text-gray-600">
              Engaging for family and friends to participate
            </p>
          </Card>
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button
            onClick={handleGetStarted}
            className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-4 text-lg"
          >
            Start Building Your Site
          </Button>
          <p className="text-sm text-gray-500 mt-4">
            Ready in just a few minutes!
          </p>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;