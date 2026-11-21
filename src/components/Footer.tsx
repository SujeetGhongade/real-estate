import React, { useState } from 'react';
import { Phone, Mail, MapPin, Clock, ArrowRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NexaLogo } from './UI';

export const Footer: React.FC = () => {
  const { settings, navigate, apiFetch, toast } = useApp();
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/public/subscribe', {
        method: 'POST',
        body: JSON.stringify({ email }),
      });
      toast(res.message);
      setEmail('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Subscription failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-[#0D1B2A] text-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10">
          {/* Brand & Newsletter */}
          <div className="lg:col-span-4 space-y-5">
            <button type="button" onClick={() => navigate('/')}>
              <NexaLogo dark />
            </button>
            <p className="text-sm text-slate-300 leading-relaxed max-w-xs">
              Properties Today. A Better Tomorrow. Verified residential and commercial real estate across Pakistan&apos;s prime neighborhoods.
            </p>
            <form onSubmit={handleSubscribe} className="space-y-2 max-w-xs">
              <label htmlFor="footer-newsletter" className="block text-xs font-medium text-slate-300">
                Subscribe for market alerts & new listings
              </label>
              <div className="flex gap-2">
                <input
                  id="footer-newsletter"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="flex-1 min-w-0 px-3.5 py-2 text-xs rounded-lg bg-white/10 border border-white/15 text-white placeholder:text-slate-400 focus:outline-none focus:border-[#C49A5C]"
                />
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-3.5 py-2 rounded-lg bg-[#C49A5C] text-[#0D1B2A] text-xs font-semibold hover:bg-[#d3ac72] transition-colors whitespace-nowrap shrink-0 flex items-center gap-1 disabled:opacity-60"
                >
                  {submitting ? '...' : 'Join'}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>

            <div className="flex items-center gap-3 pt-1">
              {[
                { label: 'Facebook', href: settings.socialFacebook, short: 'f' },
                { label: 'Instagram', href: settings.socialInstagram, short: 'ig' },
                { label: 'LinkedIn', href: settings.socialLinkedin, short: 'in' },
                { label: 'YouTube', href: settings.socialYoutube, short: 'yt' },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href || '#'}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={s.label}
                  className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-xs font-semibold text-slate-200 hover:bg-white hover:text-[#0D1B2A] transition-colors"
                >
                  {s.short}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2">
            <h3 className="font-serif text-base font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {[
                { label: 'Home', to: '/' },
                { label: 'Buy Properties', to: '/listings?purpose=sale' },
                { label: 'Rent Properties', to: '/listings?purpose=rent' },
                { label: 'Projects', to: '/projects' },
                { label: 'About Us', to: '/about' },
                { label: 'Blog', to: '/blog' },
                { label: 'Contact Us', to: '/contact' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => navigate(item.to)}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Services */}
          <div className="lg:col-span-3">
            <h3 className="font-serif text-base font-semibold text-white mb-4">Our Services</h3>
            <ul className="space-y-2.5 text-sm text-slate-300">
              {[
                { label: 'Residential Properties', to: '/listings?category=houses' },
                { label: 'Commercial Properties', to: '/listings?category=commercial' },
                { label: 'Investment Opportunities', to: '/projects' },
                { label: 'Property Management', to: '/services' },
                { label: 'Book a Consultation', to: '/services' },
                { label: 'Market Insights', to: '/blog' },
                { label: 'Admin Portal', to: '/admin' },
              ].map((item) => (
                <li key={item.label}>
                  <button
                    type="button"
                    onClick={() => navigate(item.to)}
                    className="hover:text-white transition-colors"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div className="lg:col-span-3">
            <h3 className="font-serif text-base font-semibold text-white mb-4">Contact Us</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2.5">
                <Phone className="w-4 h-4 text-[#C49A5C] shrink-0 mt-0.5" />
                <span className="tabular-nums">{settings.contactPhone}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail className="w-4 h-4 text-[#C49A5C] shrink-0 mt-0.5" />
                <span>{settings.contactEmail}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#C49A5C] shrink-0 mt-0.5" />
                <span>{settings.contactAddress}</span>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock className="w-4 h-4 text-[#C49A5C] shrink-0 mt-0.5" />
                <span>{settings.contactHours}</span>
              </li>
            </ul>
            <p className="mt-6 font-serif italic text-lg text-[#C49A5C]/90">
              Building Better Futures
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© {new Date().getFullYear()} NexaHome Real Estate. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <button type="button" onClick={() => navigate('/privacy')} className="hover:text-white transition-colors">
              Privacy Policy
            </button>
            <button type="button" onClick={() => navigate('/terms')} className="hover:text-white transition-colors">
              Terms of Service
            </button>
            <span>Designed for Dreamers. Built for Tomorrow.</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
