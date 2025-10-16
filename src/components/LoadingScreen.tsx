
import React, { useState, useEffect } from 'react';
import { Quote } from 'lucide-react';

const motivationalQuotes = [
  {
    text: "Success is not final, failure is not fatal: it is the courage to continue that counts.",
    author: "Winston Churchill"
  },
  {
    text: "The way to get started is to quit talking and begin doing.",
    author: "Walt Disney"
  },
  {
    text: "Innovation distinguishes between a leader and a follower.",
    author: "Steve Jobs"
  },
  {
    text: "Your limitation—it's only your imagination.",
    author: "Unknown"
  },
  {
    text: "Great things never come from comfort zones.",
    author: "Neil Strauss"
  },
  {
    text: "Dream it. Wish it. Do it.",
    author: "Unknown"
  },
  {
    text: "Success doesn't just find you. You have to go out and get it.",
    author: "Unknown"
  },
  {
    text: "The harder you work for something, the greater you'll feel when you achieve it.",
    author: "Unknown"
  }
];

interface LoadingScreenProps {
  message?: string;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ message = "Signing you in..." }) => {
  const [currentQuote, setCurrentQuote] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentQuote((prev) => (prev + 1) % motivationalQuotes.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Animated Logo */}
        <div className="relative">
          <div className="mx-auto w-24 h-20 bg-white rounded-xl shadow-lg flex items-center justify-center">
            <img 
              src="/lovable-uploads/e80701e6-7295-455c-a88c-e3c4a1baad9b.png" 
              alt="GoPocket Logo" 
              className="w-16 h-12 object-contain animate-bounce"
            />
          </div>
          {/*<div className="absolute -inset-4 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-full animate-ping"></div>*/}
        </div>

        {/* Loading Message */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-800 animate-fade-in">GoPocket HRMS</h2>
          <p className="text-gray-600 animate-fade-in">{message}</p>
        </div>

        {/* Modern Loading Animation */}
        <div className="flex justify-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-bounce"></div>
        </div>

        {/* Motivational Quote */}
        <div className="bg-white/70 backdrop-blur-sm rounded-lg p-6 shadow-lg animate-fade-in">
          <Quote className="w-8 h-8 text-blue-500 mb-4 mx-auto" />
          <blockquote 
            key={currentQuote}
            className="text-gray-700 italic mb-2 animate-fade-in"
          >
            "{motivationalQuotes[currentQuote].text}"
          </blockquote>
          <cite className="text-sm text-gray-500 font-medium">
            — {motivationalQuotes[currentQuote].author}
          </cite>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
