import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface AdminAuthProps {
  initialMode?: 'login' | 'forgot-password';
}

export default function AdminAuth({ initialMode = 'login' }: AdminAuthProps) {
  const [mode, setMode] = useState<'login' | 'forgot-password'>(initialMode);
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
        
        navigate('/admin/dashboard', { replace: true });
        
      } else if (mode === 'forgot-password') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/admin/dashboard`,
        });
        if (error) throw error;
        setSuccessMsg('Password reset instructions have been sent to your email.');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'An error occurred during authentication.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 p-4 relative overflow-hidden">
      {/* Admin specific darker theme decorations */}
      <div className="absolute -left-20 -bottom-20 w-96 h-96 bg-gradient-to-tr from-emerald-900/40 via-teal-900/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -right-20 -top-20 w-96 h-96 bg-gradient-to-bl from-teal-900/40 via-emerald-900/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8 shadow-2xl max-w-md w-full relative z-10 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block bg-white p-1 rounded-2xl shadow-sm border border-gray-800 mx-auto w-max mb-4 hover:scale-105 transition">
            <img src="/logo.jpeg" alt="ALOEFLORA Logo" className="h-14 w-auto object-contain rounded-xl" />
          </Link>
          <h2 className="text-2xl font-extrabold text-white uppercase tracking-tight">
            Admin Portal
          </h2>
          <p className="text-xs text-gray-400 font-mono mt-1 uppercase tracking-widest">
            {mode === 'login' ? 'Secure Access Only' : 'Reset Administrator Password'}
          </p>
        </div>

        {errorMsg && (
          <div className="bg-red-950/50 border border-red-900/50 text-red-400 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-950/50 border border-emerald-900/50 text-emerald-400 p-3 rounded-xl flex items-center gap-2 text-xs mb-4">
            <Lock className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-4 text-left">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-300 ml-1">Administrator Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm text-white placeholder-gray-500"
              />
            </div>
          </div>

          {mode === 'login' && (
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-300 ml-1">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-xl focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition text-sm text-white placeholder-gray-500"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold p-3 rounded-xl transition flex items-center justify-center gap-2 mt-4 cursor-pointer shadow-md disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {mode === 'login' ? 'Authenticate' : 'Send Reset Link'}
          </button>
        </form>

        <div className="mt-6 text-center text-xs text-gray-400 flex flex-col gap-2">
          {mode === 'login' ? (
            <button onClick={() => { setMode('forgot-password'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline transition">
              Forgot password?
            </button>
          ) : (
            <button onClick={() => { setMode('login'); setErrorMsg(''); setSuccessMsg(''); }} className="font-bold text-emerald-500 hover:text-emerald-400 hover:underline transition">
              Back to login
            </button>
          )}
          <div className="mt-4 pt-4 border-t border-gray-800">
            <Link to="/login" className="flex items-center justify-center gap-1 text-gray-500 hover:text-gray-300 transition">
              Customer Portal <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
