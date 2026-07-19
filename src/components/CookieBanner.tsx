import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Shield, X } from 'lucide-react';

export const CookieBanner: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already accepted or dismissed the cookie policy
    const consent = localStorage.getItem('aloeflora_cookie_consent');
    if (!consent) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const acceptCookies = () => {
    localStorage.setItem('aloeflora_cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const declineCookies = () => {
    localStorage.setItem('aloeflora_cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 pointer-events-none">
      <div className="max-w-4xl mx-auto bg-gray-900/95 backdrop-blur-md border border-emerald-500/30 shadow-2xl rounded-2xl p-5 pointer-events-auto flex flex-col sm:flex-row items-center gap-4 sm:gap-6 animate-in slide-in-from-bottom-8 duration-500">
        <div className="flex-shrink-0 bg-emerald-500/20 p-3 rounded-full hidden sm:block">
          <Shield className="w-6 h-6 text-emerald-400" />
        </div>
        
        <div className="flex-1 text-center sm:text-left">
          <h3 className="text-emerald-400 font-bold text-sm mb-1">Your Privacy Matters</h3>
          <p className="text-gray-300 text-xs leading-relaxed">
            We use cookies to ensure you get the best experience on our website, analyze site traffic, and optimize our natural product recommendations. By clicking "Accept All", you consent to our use of cookies in accordance with the Kenya Data Protection Act and our <Link to="/policies/privacy" className="text-emerald-400 hover:text-emerald-300 underline underline-offset-2">Privacy Policy</Link>.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto shrink-0">
          <button
            onClick={declineCookies}
            className="px-4 py-2 text-xs font-bold text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            Essential Only
          </button>
          <button
            onClick={acceptCookies}
            className="px-6 py-2 text-xs font-bold text-gray-900 bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-[0_0_15px_rgba(16,185,129,0.4)] transition-all transform hover:scale-105"
          >
            Accept All
          </button>
        </div>
        
        <button 
          onClick={declineCookies}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-300 sm:hidden"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
