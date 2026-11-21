import React, { useState } from 'react';
import { Search, User, Menu, X, ShieldCheck, LogOut, LayoutDashboard } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NexaLogo } from './UI';

export const Navbar: React.FC = () => {
  const { path, searchParams, navigate, user, openAuthModal, setSearchModalOpen, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const purposeParam = searchParams.get('purpose');

  const navLinks = [
    { label: 'Home', to: '/', active: path === '/' },
    { label: 'Buy', to: '/listings?purpose=sale', active: path === '/listings' && purposeParam === 'sale' },
    { label: 'Rent', to: '/listings?purpose=rent', active: path === '/listings' && purposeParam === 'rent' },
    { label: 'Projects', to: '/projects', active: path === '/projects' },
    { label: 'About', to: '/about', active: path === '/about' || path === '/services' },
    { label: 'Blog', to: '/blog', active: path.startsWith('/blog') },
    { label: 'Contact', to: '/contact', active: path === '/contact' },
  ];

  const handleNav = (to: string) => {
    setMobileOpen(false);
    setUserMenuOpen(false);
    navigate(to);
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <button
          type="button"
          onClick={() => handleNav('/')}
          className="focus-visible:outline-2 focus-visible:outline-[#0D1B2A] rounded"
        >
          <NexaLogo />
        </button>

        {/* Zone 2: Primary Text Links */}
        <nav className="hidden lg:flex items-center gap-6" aria-label="Primary Navigation">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleNav(link.to)}
              className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                link.active
                  ? 'text-[#0D1B2A] border-[#0D1B2A]'
                  : 'text-slate-600 border-transparent hover:text-[#0D1B2A] hover:border-slate-300'
              }`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: Utilities & Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setSearchModalOpen(true)}
            aria-label="Search properties"
            className="w-10 h-10 rounded-lg flex items-center justify-center text-[#0D1B2A] hover:bg-slate-100 transition-colors"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => {
                if (user) setUserMenuOpen((prev) => !prev);
                else openAuthModal('login');
              }}
              aria-label={user ? 'Account menu' : 'Sign in'}
              className="w-10 h-10 rounded-lg flex items-center justify-center text-[#0D1B2A] hover:bg-slate-100 transition-colors"
            >
              {user ? (
                <span className="w-7 h-7 rounded-full bg-[#0D1B2A] text-white text-xs font-semibold flex items-center justify-center">
                  {user.name.slice(0, 1).toUpperCase()}
                </span>
              ) : (
                <User className="w-[18px] h-[18px]" />
              )}
            </button>

            {user && userMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50">
                <div className="px-4 py-2.5 border-b border-slate-100">
                  <p className="text-sm font-semibold text-[#0D1B2A] truncate">{user.name}</p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleNav('/account')}
                  className="w-full px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-2.5"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  My Account & Wishlist
                </button>
                {user.role === 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleNav('/admin')}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-[#0D1B2A] hover:bg-slate-50 flex items-center gap-2.5"
                  >
                    <ShieldCheck className="w-4 h-4 text-[#C49A5C]" />
                    Admin Panel
                  </button>
                )}
                <button
                  type="button"
                  onClick={async () => {
                    setUserMenuOpen(false);
                    await logout();
                  }}
                  className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2.5"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => handleNav('/list-property')}
            className="hidden sm:inline-flex items-center px-4 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40] transition-colors whitespace-nowrap shrink-0"
          >
            List Your Property
          </button>

          <button
            type="button"
            onClick={() => setMobileOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
            className="lg:hidden w-10 h-10 rounded-lg flex items-center justify-center text-[#0D1B2A] hover:bg-slate-100"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-slate-200 px-4 py-4 space-y-1">
          {navLinks.map((link) => (
            <button
              key={link.label}
              type="button"
              onClick={() => handleNav(link.to)}
              className={`block w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                link.active ? 'bg-slate-100 text-[#0D1B2A]' : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </button>
          ))}
          <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
            <button
              type="button"
              onClick={() => handleNav('/list-property')}
              className="w-full py-2.5 px-4 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold"
            >
              List Your Property
            </button>
            {user?.role === 'admin' && (
              <button
                type="button"
                onClick={() => handleNav('/admin')}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-[#0D1B2A] text-sm font-semibold"
              >
                Admin Panel
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
