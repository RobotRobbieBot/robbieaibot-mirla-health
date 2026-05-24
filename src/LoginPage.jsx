import React, { useState } from 'react';
import { Heart, Lock, Eye, EyeOff } from 'lucide-react';

// Simple hash — works on http:// (IP, custom hostname, localhost) without crypto.subtle
const hashPassword = (password) => {
  let h1 = 0xdeadbeef, h2 = 0x41c6ce57;
  for (let i = 0; i < password.length; i++) {
    const ch = password.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16);
};

const STORAGE_KEY = 'mirla_pw_hash';

const LoginPage = ({ onLogin }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isFirstTime = !localStorage.getItem(STORAGE_KEY);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isFirstTime) {
        // Create password flow
        if (password.length < 4) {
          setError('Please choose a password with at least 4 characters.');
          setLoading(false);
          return;
        }
        if (password !== confirmPassword) {
          setError('Passwords don\'t match. Try again.');
          setLoading(false);
          return;
        }
        const hash = hashPassword(password);
        localStorage.setItem(STORAGE_KEY, hash);
        sessionStorage.setItem('mirla_auth', '1');
        onLogin();
      } else {
        // Login flow
        const hash = hashPassword(password);
        const stored = localStorage.getItem(STORAGE_KEY);
        if (hash === stored) {
          sessionStorage.setItem('mirla_auth', '1');
          onLogin();
        } else {
          setError('That password doesn\'t match. Try again.');
        }
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: 'linear-gradient(160deg, #fffbeb 0%, #fef3c7 40%, #fde68a 100%)',
        backgroundImage: `
          radial-gradient(circle at 20% 30%, rgba(253, 224, 71, 0.25) 0%, transparent 50%),
          radial-gradient(circle at 80% 70%, rgba(251, 191, 36, 0.15) 0%, transparent 50%)
        `,
      }}
    >
      {/* Subtle star watermark */}
      <div
        className="fixed inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cpath d='M100,50 L110,80 L140,85 L115,105 L125,135 L100,115 L75,135 L85,105 L60,85 L90,80 Z' fill='%23FBF914' stroke='%23F59E0B' stroke-width='2'/%3E%3C/svg%3E")`,
          backgroundSize: '300px 300px',
        }}
      />

      <div className="relative w-full max-w-sm">
        {/* Card */}
        <div
          className="rounded-3xl p-10 border border-amber-200 shadow-lg"
          style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(254,252,232,0.7) 100%)',
            backdropFilter: 'blur(16px)',
          }}
        >
          {/* Icon */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <div className="w-16 h-16 rounded-full bg-yellow-100 border border-amber-200 flex items-center justify-center shadow-sm">
                <Heart className="text-amber-500" size={28} />
              </div>
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-100 border border-amber-200 flex items-center justify-center">
                <Lock className="text-amber-600" size={13} />
              </div>
            </div>
            <h1 className="text-2xl font-light text-amber-900 tracking-wide text-center">
              Mirla's Health Journey
            </h1>
            <p className="text-amber-600 text-sm font-light mt-1 text-center">
              {isFirstTime ? 'Create your private password' : 'Your safe space awaits'}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder={isFirstTime ? 'Create a password' : 'Enter your password'}
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                autoFocus
                className="w-full px-4 py-3 pr-11 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {isFirstTime && (
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                className="w-full px-4 py-3 rounded-xl bg-white bg-opacity-60 border border-amber-200 text-amber-900 placeholder-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 transition-all"
              />
            )}

            {error && (
              <p className="text-red-500 text-sm font-light text-center px-2">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !password}
              className="w-full px-4 py-3 rounded-xl bg-yellow-200 text-amber-900 font-medium hover:bg-yellow-300 active:bg-yellow-400 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="inline-block w-4 h-4 border-2 border-amber-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Lock size={16} />
                  {isFirstTime ? 'Create Password & Enter' : 'Enter My Space'}
                </>
              )}
            </button>
          </form>

          {/* Reset password */}
          {!isFirstTime && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={() => {
                  localStorage.removeItem(STORAGE_KEY);
                  window.location.reload();
                }}
                className="text-amber-400 text-xs font-light underline underline-offset-2 hover:text-amber-600 transition-colors"
              >
                Forgot password? Reset it
              </button>
            </div>
          )}

          {/* Footer quote */}
          <p className="text-center text-amber-500 text-xs font-light mt-6 italic leading-relaxed">
            "No one else sees it. Just you and your journey."
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
