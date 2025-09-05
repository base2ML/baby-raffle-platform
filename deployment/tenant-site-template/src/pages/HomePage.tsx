import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Heart, Dice1, Trophy } from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import ImageSlideshow from '../components/ImageSlideshow';
import StatsCard from '../components/StatsCard';

const HomePage: React.FC = () => {
  const { config } = useTenant();
  
  const formatDueDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getDaysUntilDue = () => {
    const dueDate = new Date(config.parentInfo.dueDate);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays > 0) {
      return `${diffDays} days to go!`;
    } else if (diffDays === 0) {
      return 'Due today!';
    } else {
      return `${Math.abs(diffDays)} days overdue`;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="py-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            {config.siteSettings.title}
          </h1>
          <p className="text-xl md:text-2xl mb-6 opacity-90">
            {config.siteSettings.description}
          </p>
          
          <div className="flex flex-col md:flex-row items-center justify-center space-y-4 md:space-y-0 md:space-x-8 mb-8">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span className="text-lg">
                Due: {formatDueDate(config.parentInfo.dueDate)}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <MapPin className="h-5 w-5" />
              <span className="text-lg">
                {config.parentInfo.city}, {config.parentInfo.state}
              </span>
            </div>
            
            {config.parentInfo.babyGender && config.parentInfo.babyGender !== 'surprise' && (
              <div className="flex items-center space-x-2">
                <Heart className="h-5 w-5" />
                <span className="text-lg capitalize">
                  It's a {config.parentInfo.babyGender}!
                </span>
              </div>
            )}
          </div>

          <div className="text-2xl font-semibold mb-8 bg-white/20 rounded-full px-6 py-3 inline-block">
            ⏰ {getDaysUntilDue()}
          </div>

          <div className="space-y-4 md:space-y-0 md:space-x-4 md:flex md:justify-center">
            <Link
              to="/bet"
              className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-3 rounded-full font-semibold text-lg transition-colors inline-flex items-center space-x-2"
            >
              <Dice1 className="h-5 w-5" />
              <span>Place Your Bet</span>
            </Link>
            
            {config.siteSettings.features.showLeaderboard && (
              <Link
                to="/leaderboard"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-3 rounded-full font-semibold text-lg transition-colors inline-flex items-center space-x-2"
              >
                <Trophy className="h-5 w-5" />
                <span>View Leaderboard</span>
              </Link>
            )}
          </div>
        </div>
      </section>

      {/* Image Slideshow */}
      {config.slideshowImages.length > 0 && (
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Our Journey
            </h2>
            <div className="max-w-4xl mx-auto">
              <ImageSlideshow images={config.slideshowImages} />
            </div>
          </div>
        </section>
      )}

      {/* Stats Section */}
      {config.siteSettings.features.showStats && (
        <section className="py-12 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">
              Betting Pool Stats
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              <StatsCard />
            </div>
          </div>
        </section>
      )}

      {/* About Section */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-6 text-gray-800">
              About {config.parentInfo.motherName} & {config.parentInfo.fatherName}
            </h2>
            
            <div className="bg-gradient-to-r from-pink-50 to-blue-50 rounded-2xl p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    {config.parentInfo.motherName}
                  </h3>
                  <p className="text-gray-600">Soon-to-be Mom</p>
                </div>
                
                <div className="text-center">
                  <h3 className="text-xl font-semibold mb-2 text-gray-800">
                    {config.parentInfo.fatherName}
                  </h3>
                  <p className="text-gray-600">Soon-to-be Dad</p>
                </div>
              </div>
              
              <div className="mt-8 text-center">
                <p className="text-lg text-gray-700 mb-4">
                  We're excited to share this special journey with you! 
                  Place your bets on when our little one will make their debut.
                </p>
                
                {config.parentInfo.venmoAccount && (
                  <p className="text-sm text-gray-600">
                    Winners will be contacted for prize distribution via Venmo: 
                    <span className="font-semibold">{config.parentInfo.venmoAccount}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-12 bg-gradient-to-r from-purple-600 to-pink-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Make Your Prediction?</h2>
          <p className="text-xl mb-8 opacity-90">
            Join the fun and place your bet on when baby arrives!
          </p>
          
          <Link
            to="/bet"
            className="bg-white text-purple-600 hover:bg-gray-100 px-8 py-4 rounded-full font-semibold text-lg transition-colors inline-flex items-center space-x-2"
          >
            <Dice1 className="h-6 w-6" />
            <span>Place Your Bet Now</span>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default HomePage;