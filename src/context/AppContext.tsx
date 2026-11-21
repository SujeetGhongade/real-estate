import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut, type User as FirebaseUser } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';
import { DEFAULT_SITE_SETTINGS, type SiteSettingsData } from '../lib/constants';
import type { CategoryItem, CityItem, AgentItem, UserProfile } from '../types';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  text: string;
}

interface AppContextValue {
  // Navigation
  path: string;
  searchParams: URLSearchParams;
  navigate: (to: string) => void;

  // Auth (in-memory token only)
  user: UserProfile | null;
  authLoading: boolean;
  authModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  searchModalOpen: boolean;
  setSearchModalOpen: (v: boolean) => void;
  signInWithGoogle: () => Promise<UserProfile | null>;
  loginWithEmail: (email: string, password: string) => Promise<UserProfile>;
  registerWithEmail: (payload: { name: string; email: string; phone: string; password: string }) => Promise<UserProfile>;
  setSessionDirect: (token: string, user: UserProfile) => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  apiFetch: <T = unknown>(url: string, options?: RequestInit) => Promise<T>;
  getAuthToken: () => Promise<string | null>;

  // Global Catalog & Settings
  settings: SiteSettingsData;
  refreshSettings: () => Promise<void>;
  categories: CategoryItem[];
  cities: CityItem[];
  agents: AgentItem[];
  refreshMeta: () => Promise<void>;

  // Wishlist
  wishlistIds: Set<number>;
  toggleWishlist: (propertyId: number) => Promise<void>;

  // Toasts
  toasts: ToastMessage[];
  toast: (text: string, type?: 'success' | 'error' | 'info') => void;
  dismissToast: (id: string) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [locationState, setLocationState] = useState(() => ({
    path: window.location.pathname || '/',
    search: window.location.search || '',
  }));

  const [user, setUser] = useState<UserProfile | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  // In-memory custom session token (never stored in localStorage/sessionStorage)
  const customTokenRef = useRef<string | null>(null);
  const firebaseUserRef = useRef<FirebaseUser | null>(null);

  const [settings, setSettings] = useState<SiteSettingsData>(DEFAULT_SITE_SETTINGS);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [wishlistIds, setWishlistIds] = useState<Set<number>>(new Set());
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const toast = useCallback((text: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev.slice(-3), { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const navigate = useCallback((to: string) => {
    const url = new URL(to, window.location.origin);
    window.history.pushState({}, '', `${url.pathname}${url.search}`);
    setLocationState({ path: url.pathname, search: url.search });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePop = () => {
      setLocationState({ path: window.location.pathname || '/', search: window.location.search || '' });
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const getAuthToken = useCallback(async (): Promise<string | null> => {
    if (customTokenRef.current) return customTokenRef.current;
    if (firebaseUserRef.current) {
      try {
        return await firebaseUserRef.current.getIdToken();
      } catch {
        return null;
      }
    }
    return null;
  }, []);

  const apiFetch = useCallback(
    async <T = unknown,>(url: string, options: RequestInit = {}): Promise<T> => {
      const token = await getAuthToken();
      const headers = new Headers(options.headers || {});
      if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
      }
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }

      const res = await fetch(url, { ...options, headers });
      const contentType = res.headers.get('content-type') || '';
      const data = contentType.includes('application/json') ? await res.json() : await res.text();
      if (!res.ok) {
        const errMsg = typeof data === 'object' && data && 'error' in data ? String((data as { error: string }).error) : `Request failed (${res.status})`;
        throw new Error(errMsg);
      }
      return data as T;
    },
    [getAuthToken]
  );

  const loadWishlist = useCallback(async () => {
    try {
      const data = await apiFetch<{ ids: number[] }>('/api/user/wishlist');
      setWishlistIds(new Set(data.ids || []));
    } catch {
      setWishlistIds(new Set());
    }
  }, [apiFetch]);

  const refreshSettings = useCallback(async () => {
    try {
      const data = await apiFetch<{ settings: SiteSettingsData }>('/api/public/settings');
      if (data.settings) {
        setSettings(data.settings);
        if (data.settings.seoTitle) document.title = data.settings.seoTitle;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && data.settings.seoDescription) {
          metaDesc.setAttribute('content', data.settings.seoDescription);
        }
      }
    } catch {
      // keep default settings
    }
  }, [apiFetch]);

  const refreshMeta = useCallback(async () => {
    try {
      const data = await apiFetch<{ categories: CategoryItem[]; cities: CityItem[]; agents: AgentItem[] }>('/api/public/meta');
      setCategories(data.categories || []);
      setCities(data.cities || []);
      setAgents(data.agents || []);
    } catch {
      // handled gracefully
    }
  }, [apiFetch]);

  const refreshUser = useCallback(async () => {
    const token = await getAuthToken();
    if (!token) {
      setUser(null);
      setWishlistIds(new Set());
      return;
    }
    try {
      const data = await apiFetch<{ user: UserProfile }>('/api/auth/me');
      setUser(data.user);
      await loadWishlist();
    } catch {
      customTokenRef.current = null;
      setUser(null);
      setWishlistIds(new Set());
    }
  }, [apiFetch, getAuthToken, loadWishlist]);

  useEffect(() => {
    refreshSettings();
    refreshMeta();
  }, [refreshSettings, refreshMeta]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      firebaseUserRef.current = fbUser;
      if (fbUser) {
        customTokenRef.current = null;
        try {
          const idToken = await fbUser.getIdToken();
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${idToken}` },
          });
          if (res.ok) {
            const data = (await res.json()) as { user: UserProfile };
            setUser(data.user);
            await loadWishlist();
          }
        } catch {
          // ignore
        }
      } else if (!customTokenRef.current) {
        setUser(null);
        setWishlistIds(new Set());
      }
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, [loadWishlist]);

  const signInWithGoogle = useCallback(async (): Promise<UserProfile | null> => {
    const cred = await signInWithPopup(auth, googleAuthProvider);
    firebaseUserRef.current = cred.user;
    customTokenRef.current = null;
    const idToken = await cred.user.getIdToken();
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${idToken}` },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: 'Sign-in failed' }));
      throw new Error(err.error || 'Google sign-in failed.');
    }
    const data = (await res.json()) as { user: UserProfile };
    setUser(data.user);
    setAuthModalOpen(false);
    await loadWishlist();
    toast(`Welcome back, ${data.user.name}`);
    return data.user;
  }, [loadWishlist, toast]);

  const loginWithEmail = useCallback(
    async (email: string, password: string): Promise<UserProfile> => {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid email or password.');
      customTokenRef.current = data.token;
      setUser(data.user);
      setAuthModalOpen(false);
      await loadWishlist();
      toast(`Signed in as ${data.user.name}`);
      return data.user;
    },
    [loadWishlist, toast]
  );

  const registerWithEmail = useCallback(
    async (payload: { name: string; email: string; phone: string; password: string }): Promise<UserProfile> => {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed.');
      customTokenRef.current = data.token;
      setUser(data.user);
      setAuthModalOpen(false);
      await loadWishlist();
      toast('Account created! Welcome to NexaHome.');
      return data.user;
    },
    [loadWishlist, toast]
  );

  const setSessionDirect = useCallback(
    (token: string, nextUser: UserProfile) => {
      customTokenRef.current = token;
      setUser(nextUser);
      loadWishlist();
    },
    [loadWishlist]
  );

  const logout = useCallback(async () => {
    customTokenRef.current = null;
    if (firebaseUserRef.current) {
      await firebaseSignOut(auth).catch(() => {});
      firebaseUserRef.current = null;
    }
    setUser(null);
    setWishlistIds(new Set());
    toast('You have been signed out.', 'info');
  }, [toast]);

  const toggleWishlist = useCallback(
    async (propertyId: number) => {
      if (!user) {
        setAuthModalMode('login');
        setAuthModalOpen(true);
        toast('Please sign in to save properties to your wishlist.', 'info');
        return;
      }
      try {
        const res = await apiFetch<{ saved: boolean; message: string }>(`/api/user/wishlist/${propertyId}`, {
          method: 'POST',
        });
        setWishlistIds((prev) => {
          const next = new Set(prev);
          if (res.saved) next.add(propertyId);
          else next.delete(propertyId);
          return next;
        });
        toast(res.message);
      } catch (err) {
        toast(err instanceof Error ? err.message : 'Could not update wishlist', 'error');
      }
    },
    [apiFetch, toast, user]
  );

  const openAuthModal = useCallback((mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => setAuthModalOpen(false), []);

  return (
    <AppContext.Provider
      value={{
        path: locationState.path,
        searchParams: new URLSearchParams(locationState.search),
        navigate,
        user,
        authLoading,
        authModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        searchModalOpen,
        setSearchModalOpen,
        signInWithGoogle,
        loginWithEmail,
        registerWithEmail,
        setSessionDirect,
        logout,
        refreshUser,
        apiFetch,
        getAuthToken,
        settings,
        refreshSettings,
        categories,
        cities,
        agents,
        refreshMeta,
        wishlistIds,
        toggleWishlist,
        toasts,
        toast,
        dismissToast,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
