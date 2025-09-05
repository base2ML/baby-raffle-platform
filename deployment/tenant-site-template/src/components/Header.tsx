import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Baby, Trophy, Home, Dice1 } from 'lucide-react';
import { useTenant } from '../context/TenantContext';

const Header: React.FC = () => {
  const { config } = useTenant();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-white shadow-lg border-b-4 border-primary">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo and Title */}
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary rounded-full">
              <Baby className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 truncate">
                {config.siteSettings.title}
              </h1>
              <p className="text-sm text-gray-600 hidden sm:block">
                {config.parentInfo.motherName} & {config.parentInfo.fatherName}
              </p>
            </div>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/') 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/bet"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive('/bet') 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Dice1 className="h-4 w-4" />
              <span>Place Bet</span>
            </Link>

            {config.siteSettings.features.showLeaderboard && (
              <Link
                to="/leaderboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive('/leaderboard') 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:text-primary hover:bg-primary/10'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </Link>
            )}
          </nav>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="text-gray-600 hover:text-primary p-2"
              onClick={() => {
                // Simple mobile menu toggle (could be enhanced)
                const nav = document.getElementById('mobile-nav');
                nav?.classList.toggle('hidden');
              }}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div id="mobile-nav" className="hidden md:hidden pb-4">
          <div className="space-y-2">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium block ${
                isActive('/') 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>
            
            <Link
              to="/bet"
              className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium block ${
                isActive('/bet') 
                  ? 'bg-primary text-white' 
                  : 'text-gray-600 hover:text-primary hover:bg-primary/10'
              }`}
            >
              <Dice1 className="h-4 w-4" />
              <span>Place Bet</span>
            </Link>

            {config.siteSettings.features.showLeaderboard && (
              <Link
                to="/leaderboard"
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium block ${
                  isActive('/leaderboard') 
                    ? 'bg-primary text-white' 
                    : 'text-gray-600 hover:text-primary hover:bg-primary/10'
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;