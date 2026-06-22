import React from 'react';
import { Link } from 'react-router-dom';
import { FileQuestion, Home } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="w-24 h-24 bg-emerald-50 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-6">
        <FileQuestion className="w-12 h-12 text-emerald-600" />
      </div>
      <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2">404 - Page Not Found</h1>
      <p className="text-gray-500 max-w-md mx-auto mb-8">
        Oops! We couldn't find the page you're looking for. It might have been moved or doesn't exist anymore.
      </p>
      <Link 
        to="/"
        className="flex items-center gap-2 bg-emerald-800 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold transition"
      >
        <Home className="w-5 h-5" /> Back to Home
      </Link>
    </div>
  );
}
