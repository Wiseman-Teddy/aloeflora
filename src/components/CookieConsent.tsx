import React, { useState, useEffect } from 'react';
import { ShieldCheck, X } from 'lucide-react';

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(essentialCheck());

  function essentialCheck() {
    if (typeof window !== 'undefined') {
      const consent = localStorage.getItem('aloeflora_cookie_consent');
      return consent !== 'granted';
    }
    return false;
  }

  const handleAccept = () => {
    localStorage.setItem('aloeflora_cookie_consent', 'granted');
    localStorage.setItem('aloeflora_cookie_timestamp', new Date().toISOString());
    setIsVisible(false);
  };

  const handleDecline = () => {
    // Under Kenya DPA / GDPR, users must be able to decline non-essential cookies
    localStorage.setItem('aloeflora_cookie_consent', 'declined');
    localStorage.setItem('aloeflora_cookie_timestamp', new Date().toISOString());
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white border-2 border-emerald-800 shadow-2xl rounded-2xl p-5 z-50 animate-in slide-in-from-bottom-5">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-800" />
          <h3 className="font-bold text-gray-900">Your Privacy Matters</h3>
        </div>
        <button onClick={handleDecline} className="text-gray-400 hover:text-gray-900 cursor-pointer">
          <X className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-gray-600 mb-4 leading-relaxed">
        ALOEFLORA PRODUCTS uses strictly necessary cookies to ensure the core website functionality. We also use optional analytical cookies to improve your experience in compliance with the <span className="font-bold text-emerald-800">Kenya Data Protection Act (2019)</span> and GDPR.
      </p>
      <div className="flex gap-2">
        <button 
          onClick={handleDecline}
          className="flex-1 px-3 py-2 border border-gray-300 text-gray-700 text-xs font-bold rounded-lg hover:bg-gray-50 transition cursor-pointer"
        >
          Decline Optional
        </button>
        <button 
          onClick={handleAccept}
          className="flex-1 px-3 py-2 bg-emerald-800 text-white text-xs font-bold rounded-lg hover:bg-emerald-700 transition cursor-pointer shadow-md shadow-emerald-900/20"
        >
          Accept All
        </button>
      </div>
    </div>
  );
}
