import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, useLocation } from 'react-router-dom';
import { Sparkles, Mail, Lock, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [authConsent, setAuthConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const navigate = useNavigate();
  const location = useLocation();
  const { role } = useAuth();

  const from = (location.state as any)?.from?.pathname || (role === 'admin' ? '/admin' : '/store');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        const adminEmails = ['aganyawiseman@gmail.com'];
        if (adminEmails.includes(email)) {
          navigate('/admin', { replace: true });
        } else {
          navigate((location.state as any)?.from?.pathname || '/store', { replace: true });
        }
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        
        if (data.session) {
           navigate('/store', { replace: true });
        } else {
           alert('Account created! Please check your email for the confirmation link to log in.');
           setIsLogin(true);
        }
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
      {/* Background Decorators */}
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-gradient-to-tr from-emerald-600/20 via-lime-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-bl from-lime-500/20 via-emerald-800/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-800 to-lime-500 flex items-center justify-center text-white text-xl font-extrabold shadow-md mx-auto mb-4">
            A
          </div>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
            ALOEFLORA PRODUCTS
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 uppercase tracking-widest">
            {isLogin ? 'Welcome Back' : 'Join Our Community'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-sm dark:text-white"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300 ml-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600 transition text-sm dark:text-white"
              />
            </div>
          </div>

          {!isLogin && (
            <label className="flex items-start gap-2 cursor-pointer p-3 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-xl mt-2 text-xs">
              <input 
                type="checkbox" 
                required
                className="mt-0.5" 
                checked={authConsent}
                onChange={(e) => setAuthConsent(e.target.checked)}
              />
              <span className="text-gray-600 dark:text-gray-400">
                I explicitly agree to the ALOEFLORA PRODUCTS 
                <span className="font-bold text-emerald-800 dark:text-emerald-400"> Privacy Policy</span> and 
                <span className="font-bold text-emerald-800 dark:text-emerald-400"> Terms of Service</span>.
              </span>
            </label>
          )}

          <button
            type="submit"
            disabled={loading || (!isLogin && !authConsent)}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLogin ? 'Secure Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500">
          {isLogin ? "Don't have an account? " : "Already registered? "}
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
            }}
            className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition"
          >
            {isLogin ? 'Sign up here' : 'Log in here'}
          </button>
        </div>
      </div>
    </div>
  );
}
