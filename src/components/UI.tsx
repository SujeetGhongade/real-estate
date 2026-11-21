import React, { useState } from 'react';
import {
  Heart,
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  X,
  Search,
  Building2,
  CheckCircle2,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPKR } from '../lib/constants';
import type { PropertyItem } from '../types';

export const SafeImage: React.FC<{
  src?: string | null;
  alt: string;
  className?: string;
}> = ({ src, alt, className = '' }) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-[#0D1B2A] to-[#213B57] text-white/80 p-4 text-center ${className}`}
        role="img"
        aria-label={alt}
      >
        <Building2 className="w-8 h-8 mb-2 text-[#C49A5C]" />
        <span className="text-xs font-medium line-clamp-2 max-w-[180px]">{alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};

export const NexaLogo: React.FC<{ dark?: boolean; compact?: boolean }> = ({ dark = false, compact = false }) => {
  const { settings } = useApp();
  return (
    <span className="inline-flex items-center gap-2.5 whitespace-nowrap shrink-0 select-none">
      {settings.logoUrl ? (
        <SafeImage src={settings.logoUrl} alt={settings.brandName} className="w-8 h-8 rounded object-cover" />
      ) : (
        <svg
          width="30"
          height="26"
          viewBox="0 0 36 30"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
          className="shrink-0"
        >
          <path
            d="M3 16L18 4L33 16"
            stroke={dark ? '#FFFFFF' : '#0D1B2A'}
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 15V26H27V15"
            stroke={dark ? '#FFFFFF' : '#0D1B2A'}
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <rect x="15" y="18" width="6" height="8" fill="#C49A5C" rx="0.5" />
        </svg>
      )}
      <span className="flex flex-col leading-none">
        <span
          className={`font-serif text-lg font-bold tracking-[0.06em] ${
            dark ? 'text-white' : 'text-[#0D1B2A]'
          }`}
        >
          {settings.brandName || 'NEXAHOME'}
        </span>
        {!compact && (
          <span
            className={`text-[9px] font-medium tracking-[0.22em] mt-0.5 ${
              dark ? 'text-slate-300' : 'text-slate-500'
            }`}
          >
            {settings.brandSubtitle || 'REAL ESTATE'}
          </span>
        )}
      </span>
    </span>
  );
};

export const PropertyCard: React.FC<{ property: PropertyItem }> = ({ property }) => {
  const { navigate, wishlistIds, toggleWishlist } = useApp();
  const isSaved = wishlistIds.has(property.id);
  const cover = property.images?.[0] || '';

  return (
    <article
      onClick={() => navigate(`/property/${property.slug}`)}
      className="group cursor-pointer bg-white rounded-xl border border-slate-200/90 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg flex flex-col"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <SafeImage
          src={cover}
          alt={property.title}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute inset-x-0 top-0 p-3 flex items-center justify-between">
          <span
            className={`px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded text-white ${
              property.purpose === 'rent' ? 'bg-[#1D4E4F]' : 'bg-[#0D1B2A]'
            }`}
          >
            {property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
          </span>
          <button
            type="button"
            aria-label={isSaved ? 'Remove from wishlist' : 'Save to wishlist'}
            onClick={(e) => {
              e.stopPropagation();
              toggleWishlist(property.id);
            }}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isSaved
                ? 'bg-[#0D1B2A] text-white'
                : 'bg-white/90 text-[#0D1B2A] hover:bg-white'
            }`}
          >
            <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-[#C49A5C]' : ''}`} />
          </button>
        </div>
        {property.status !== 'available' && (
          <div className="absolute bottom-3 left-3 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider rounded bg-amber-600 text-white">
            {property.status}
          </div>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col">
        <h3 className="font-serif text-[17px] font-semibold text-[#0D1B2A] group-hover:text-[#A87E43] transition-colors line-clamp-1">
          {property.title}
        </h3>
        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1 line-clamp-1">
          <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">{property.location}</span>
        </p>

        <p className="mt-2.5 text-[15px] font-bold text-[#0D1B2A] tabular-nums">
          {formatPKR(property.price, property.purpose)}
        </p>

        <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between gap-2 text-xs text-slate-600 tabular-nums">
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <BedDouble className="w-3.5 h-3.5 text-slate-400" />
            {property.bedrooms > 0 ? `${property.bedrooms} Beds` : 'Open Space'}
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Bath className="w-3.5 h-3.5 text-slate-400" />
            {property.bathrooms} Baths
          </span>
          <span className="inline-flex items-center gap-1 whitespace-nowrap">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            {property.areaLabel}
          </span>
        </div>
      </div>
    </article>
  );
};

export const AuthModal: React.FC = () => {
  const { authModalOpen, authModalMode, closeAuthModal, signInWithGoogle, loginWithEmail, registerWithEmail } = useApp();
  const [mode, setMode] = useState<'login' | 'register'>(authModalMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  React.useEffect(() => {
    setMode(authModalMode);
    setError('');
  }, [authModalMode, authModalOpen]);

  if (!authModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else {
        await registerWithEmail({ name, email, phone, password });
      }
      setName('');
      setEmail('');
      setPhone('');
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Google sign-in was cancelled or failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0A1522]/60 backdrop-blur-xs p-4"
      onClick={closeAuthModal}
    >
      <div
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-6 py-5 bg-[#0D1B2A] text-white flex items-center justify-between">
          <div>
            <h2 className="font-serif text-xl font-semibold">
              {mode === 'login' ? 'Sign In to NexaHome' : 'Create Your Account'}
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Save favorite properties, book visits, and submit listings.
            </p>
          </div>
          <button
            type="button"
            onClick={closeAuthModal}
            aria-label="Close modal"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg mb-5">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'login' ? 'bg-white text-[#0D1B2A] shadow-xs' : 'text-slate-600 hover:text-[#0D1B2A]'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setError('');
              }}
              className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                mode === 'register' ? 'bg-white text-[#0D1B2A] shadow-xs' : 'text-slate-600 hover:text-[#0D1B2A]'
              }`}
            >
              Create Account
            </button>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={handleGoogle}
            className="w-full py-2.5 px-4 border border-slate-300 rounded-lg text-sm font-medium text-[#0D1B2A] hover:bg-slate-50 transition-colors flex items-center justify-center gap-2.5 mb-4 disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <div className="relative my-4 text-center">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <span className="relative bg-white px-3 text-xs text-slate-400">or with email</span>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Ali Raza"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+92 300 123 4567"
                    className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
                  />
                </div>
              </>
            )}
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40] transition-colors disabled:opacity-60"
            >
              {submitting ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const SearchModal: React.FC = () => {
  const { searchModalOpen, setSearchModalOpen, navigate, cities, categories } = useApp();
  const [query, setQuery] = useState('');
  const [purpose, setPurpose] = useState<'sale' | 'rent' | ''>('');

  if (!searchModalOpen) return null;

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query.trim()) params.set('search', query.trim());
    if (purpose) params.set('purpose', purpose);
    setSearchModalOpen(false);
    navigate(`/listings?${params.toString()}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-[#0A1522]/60 backdrop-blur-xs p-4"
      onClick={() => setSearchModalOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-serif text-lg font-semibold text-[#0D1B2A]">Search Properties</h3>
          <button
            type="button"
            onClick={() => setSearchModalOpen(false)}
            className="w-9 h-9 rounded-lg flex items-center justify-center text-slate-500 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submitSearch} className="flex flex-col sm:flex-row gap-2.5">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search DHA Lahore, Clifton Karachi, F-7 villa, office..."
              className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-[#0D1B2A]"
            />
          </div>
          <select
            value={purpose}
            onChange={(e) => setPurpose(e.target.value as '' | 'sale' | 'rent')}
            className="px-3.5 py-2.5 text-sm border border-slate-300 rounded-lg bg-white text-[#0D1B2A]"
          >
            <option value="">Buy & Rent</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40] whitespace-nowrap"
          >
            Search
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Popular Cities</p>
            <div className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    navigate(`/listings?city=${encodeURIComponent(c.name)}`);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white transition-colors"
                >
                  {c.name}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 mb-2">Browse by Type</p>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setSearchModalOpen(false);
                    navigate(`/listings?category=${encodeURIComponent(cat.slug)}`);
                  }}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white transition-colors"
                >
                  {cat.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ToastStack: React.FC = () => {
  const { toasts, dismissToast } = useApp();
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`pointer-events-auto flex items-start gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium ${
            t.type === 'error'
              ? 'bg-red-950 text-white border-red-800'
              : t.type === 'info'
              ? 'bg-[#0D1B2A] text-white border-[#213B57]'
              : 'bg-white text-[#0D1B2A] border-slate-200'
          }`}
        >
          {t.type === 'error' ? (
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          ) : t.type === 'info' ? (
            <Info className="w-4 h-4 text-[#C49A5C] shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          )}
          <span className="flex-1 text-xs leading-relaxed">{t.text}</span>
          <button
            type="button"
            onClick={() => dismissToast(t.id)}
            className="opacity-60 hover:opacity-100"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  );
};
