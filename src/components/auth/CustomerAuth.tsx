import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Sparkles, Mail, Lock, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface CustomerAuthProps {
  initialMode?: 'login' | 'register' | 'forgot-password';
}

export default function CustomerAuth({ initialMode = 'login' }: CustomerAuthProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'forgot-password'>(initialMode);
  const [authConsent, setAuthConsent] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        // Always go to customer dashboard
        navigate('/customer/dashboard', { replace: true });
        
      } else if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/customer/dashboard`,
          }
        });
        if (error) throw error;
        
        if (data.session) {
           navigate('/customer/dashboard', { replace: true });
        } else {
           setSuccessMsg('Account created! Please check your email for the confirmation link to log in.');
           setMode('login');
        }
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/customer/dashboard`,
        });
        if (error) throw error;
        setSuccessMsg('Password reset instructions have been sent to your email.');
      }
    } catch (error: any) {
      console.error("Auth error:", error);
      const msg = typeof error === 'string' ? error : error?.message && typeof error.message === 'string' && error.message !== '{}' ? error.message : 'An error occurred during authentication. Please try again.';
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 relative overflow-hidden">
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-gradient-to-tr from-emerald-600/20 via-lime-500/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-bl from-lime-500/20 via-emerald-800/10 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-8 shadow-xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block bg-white p-1 rounded-2xl shadow-sm border border-emerald-900/10 dark:border-gray-800 mx-auto w-max mb-4 hover:scale-105 transition">
            <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-14 w-auto object-contain rounded-xl" />
          </Link>
          <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white uppercase tracking-tight">
            ALOEFLORA
          </h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-mono mt-1 uppercase tracking-widest">
            {mode === 'login' && 'Welcome Back'}
            {mode === 'register' && 'Join Our Community'}
            {mode === 'forgot-password' && 'Reset Password'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <Sparkles className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
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

          {mode !== 'forgot-password' && (
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
          )}

          {mode === 'register' && (
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
            disabled={loading || (mode === 'register' && !authConsent)}
            className="w-full bg-emerald-800 hover:bg-emerald-700 text-white font-bold p-3 rounded-xl transition flex items-center justify-center gap-2 mt-2 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {mode === 'login' && 'Secure Sign In'}
            {mode === 'register' && 'Create Account'}
            {mode === 'forgot-password' && 'Reset Password'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-500 flex flex-col gap-2">
          {mode === 'login' && (
            <>
              <button onClick={() => { setMode('forgot-password'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition">
                Forgot password?
              </button>
              <div>
                Don't have an account?{' '}
                <button onClick={() => { setMode('register'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition">
                  Sign up here
                </button>
              </div>
            </>
          )}
          
          {mode === 'register' && (
            <div>
              Already registered?{' '}
              <button onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition">
                Log in here
              </button>
            </div>
          )}

          {mode === 'forgot-password' && (
            <div>
              Remember your password?{' '}
              <button onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline transition">
                Back to login
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
