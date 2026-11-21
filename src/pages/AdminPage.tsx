import React, { useEffect, useState } from 'react';
import {
  LayoutDashboard,
  Building2,
  FolderKanban,
  FileText,
  MessageSquare,
  Users,
  Settings,
  ArrowLeft,
  ShieldCheck,
  LogOut,
  AlertCircle,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NexaLogo } from '../components/UI';
import { AdminMetricChart } from './admin/AdminCharts';
import {
  AdminPropertiesSection,
  AdminCatalogSection,
  AdminContentSection,
  AdminLeadsSection,
  AdminUsersSection,
  AdminSettingsSection,
} from './admin/AdminSections';
import type { ActivityLogItem, InquiryItem } from '../types';

type AdminTab = 'dashboard' | 'properties' | 'catalog' | 'content' | 'leads' | 'users' | 'settings';

interface DashboardData {
  totals: {
    properties: number;
    pendingApprovals: number;
    inquiries: number;
    newInquiries: number;
    visits: number;
    newVisits: number;
    consultations: number;
    users: number;
    subscribers: number;
  };
  charts: {
    byCity: { labels: string[]; values: number[] };
    byCategory: { labels: string[]; values: number[] };
    byPurpose: { labels: string[]; values: number[] };
    leadBreakdown: { labels: string[]; values: number[] };
  };
  recentInquiries: InquiryItem[];
  recentLogs: ActivityLogItem[];
}

export const AdminPage: React.FC = () => {
  const { user, signInWithGoogle, loginWithEmail, setSessionDirect, logout, navigate, apiFetch, toast } = useApp();
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);

  // Admin Login / First-Run Claim Gate state
  const [needsClaim, setNeedsClaim] = useState(false);
  const [email, setEmail] = useState('admin@nexahome.pk');
  const [password, setPassword] = useState('');
  const [adminName, setAdminName] = useState('NexaHome Administrator');
  const [authError, setAuthError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      fetch('/api/auth/admin-status')
        .then((r) => r.json())
        .then((d) => setNeedsClaim(Boolean(d.needsFirstRunClaim)))
        .catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (user?.role === 'admin' && tab === 'dashboard') {
      apiFetch<DashboardData>('/api/admin/dashboard')
        .then(setDashboard)
        .catch(() => {});
    }
  }, [apiFetch, tab, user]);

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setSubmitting(true);
    try {
      if (needsClaim) {
        const res = await fetch('/api/auth/admin-claim', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, name: adminName, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Could not configure admin.');
        setSessionDirect(data.token, data.user);
        setNeedsClaim(false);
        toast('Admin credentials claimed and signed in.');
      } else {
        const loggedIn = await loginWithEmail(email, password);
        if (loggedIn.role !== 'admin') {
          setAuthError('This account does not have administrator privileges.');
        }
      }
    } catch (err) {
      setAuthError(err instanceof Error ? err.message : 'Admin authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-[#0D1B2A] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <NexaLogo />
            <button
              type="button"
              onClick={() => navigate('/')}
              className="text-xs font-semibold text-slate-500 hover:text-[#0D1B2A] inline-flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> Public Site
            </button>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-[#0D1B2A]">
              <ShieldCheck className="w-5 h-5 text-[#C49A5C]" />
              <h1 className="font-serif text-xl font-semibold">
                {needsClaim ? 'First-Run Admin Setup' : 'Admin Console Sign In'}
              </h1>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              {needsClaim
                ? 'Set your initial administrator password below (or sign in with your Google owner account) to unlock the NexaHome Admin Panel.'
                : 'Sign in with your administrator Google account or admin email and password.'}
            </p>

            {user && user.role !== 'admin' && (
              <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                Signed in as <strong>{user.email}</strong> (standard member). Please sign in with an administrator account.
              </div>
            )}

            {authError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="button"
              onClick={async () => {
                setAuthError('');
                try {
                  const u = await signInWithGoogle();
                  if (u && u.role !== 'admin') {
                    setAuthError('Signed-in Google account is not an administrator.');
                  }
                } catch (err) {
                  setAuthError(err instanceof Error ? err.message : 'Google sign-in failed.');
                }
              }}
              className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-xs font-semibold text-[#0D1B2A] hover:bg-slate-50"
            >
              Sign In with Google (Owner Admin)
            </button>

            <div className="relative text-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <span className="relative bg-white px-2 text-[11px] text-slate-400">or admin credentials</span>
            </div>

            <form onSubmit={handleAdminSubmit} className="space-y-3">
              {needsClaim && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Name</label>
                  <input
                    required
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Admin Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">
                  {needsClaim ? 'Choose Admin Password (min 8 chars)' : 'Password'}
                </label>
                <input
                  type="password"
                  required
                  minLength={needsClaim ? 8 : 1}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40]"
              >
                {submitting ? 'Authenticating...' : needsClaim ? 'Claim Admin Access' : 'Sign In to Admin Panel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  const navItems: { id: AdminTab; label: string; icon: React.ElementType }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'properties', label: 'Properties', icon: Building2 },
    { id: 'catalog', label: 'Catalog & Projects', icon: FolderKanban },
    { id: 'content', label: 'Blog & Reviews', icon: FileText },
    { id: 'leads', label: 'Leads & Visits', icon: MessageSquare },
    { id: 'users', label: 'Users & Subscribers', icon: Users },
    { id: 'settings', label: 'Site Settings & Logs', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#F8F7F4] flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="lg:w-64 bg-[#0D1B2A] text-slate-200 flex flex-col shrink-0">
        <div className="h-16 px-5 border-b border-white/10 flex items-center justify-between">
          <NexaLogo dark compact />
        </div>
        <nav className="p-3 flex-1 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`w-full px-3.5 py-2.5 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                tab === item.id ? 'bg-white text-[#0D1B2A]' : 'text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              <item.icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-white/10 space-y-2 text-xs">
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full px-3 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> View Public Website
          </button>
          <button
            type="button"
            onClick={logout}
            className="w-full px-3 py-2 rounded-lg text-slate-300 hover:text-white flex items-center justify-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Workspace */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400">NexaHome Admin / {navItems.find((n) => n.id === tab)?.label}</p>
            <h1 className="font-serif text-lg font-semibold text-[#0D1B2A]">
              {navItems.find((n) => n.id === tab)?.label}
            </h1>
          </div>
          <div className="text-right">
            <p className="text-xs font-semibold text-[#0D1B2A]">{user.name}</p>
            <p className="text-[11px] text-slate-500">{user.email}</p>
          </div>
        </header>

        <main className="p-6 max-w-7xl w-full mx-auto">
          {tab === 'dashboard' && (
            <div className="space-y-6">
              {!dashboard ? (
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 animate-pulse">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div key={n} className="h-24 bg-white rounded-xl border border-slate-200" />
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    {[
                      { label: 'Total Properties', value: dashboard.totals.properties, sub: `${dashboard.totals.pendingApprovals} pending review` },
                      { label: 'Inquiries', value: dashboard.totals.inquiries, sub: `${dashboard.totals.newInquiries} new` },
                      { label: 'Visit Requests', value: dashboard.totals.visits, sub: `${dashboard.totals.newVisits} pending` },
                      { label: 'Registered Users', value: dashboard.totals.users, sub: 'Active members' },
                      { label: 'Subscribers', value: dashboard.totals.subscribers, sub: `${dashboard.totals.consultations} consultations` },
                    ].map((kpi) => (
                      <div key={kpi.label} className="bg-white rounded-xl border border-slate-200 p-4">
                        <p className="text-xs text-slate-500">{kpi.label}</p>
                        <p className="font-serif text-2xl font-bold text-[#0D1B2A] mt-1 tabular-nums">
                          {kpi.value}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-1">{kpi.sub}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                    <AdminMetricChart
                      title="Properties by City"
                      type="bar"
                      labels={dashboard.charts.byCity.labels}
                      values={dashboard.charts.byCity.values}
                    />
                    <AdminMetricChart
                      title="Inventory by Category"
                      type="doughnut"
                      labels={dashboard.charts.byCategory.labels}
                      values={dashboard.charts.byCategory.values}
                    />
                    <AdminMetricChart
                      title="Leads & Engagement"
                      type="bar"
                      labels={dashboard.charts.leadBreakdown.labels}
                      values={dashboard.charts.leadBreakdown.values}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <h3 className="font-serif text-base font-semibold text-[#0D1B2A] mb-3">Latest Inquiries</h3>
                      <div className="divide-y divide-slate-100 text-xs">
                        {dashboard.recentInquiries.map((i) => (
                          <div key={i.id} className="py-2.5 flex items-center justify-between gap-2">
                            <div>
                              <p className="font-semibold text-[#0D1B2A]">{i.name}</p>
                              <p className="text-slate-500 line-clamp-1">{i.subject || i.message}</p>
                            </div>
                            <span className="capitalize font-medium text-[#A87E43]">{i.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-5">
                      <h3 className="font-serif text-base font-semibold text-[#0D1B2A] mb-3">Recent Activity</h3>
                      <div className="divide-y divide-slate-100 text-xs">
                        {dashboard.recentLogs.slice(0, 5).map((log) => (
                          <div key={log.id} className="py-2.5">
                            <p className="font-semibold text-[#0D1B2A]">{log.action} · {log.entityType}</p>
                            <p className="text-slate-500">{log.details}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {tab === 'properties' && <AdminPropertiesSection />}
          {tab === 'catalog' && <AdminCatalogSection />}
          {tab === 'content' && <AdminContentSection />}
          {tab === 'leads' && <AdminLeadsSection />}
          {tab === 'users' && <AdminUsersSection />}
          {tab === 'settings' && <AdminSettingsSection />}
        </main>
      </div>
    </div>
  );
};
