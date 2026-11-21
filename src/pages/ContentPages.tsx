import React, { useEffect, useState } from 'react';
import {
  MapPin,
  TrendingUp,
  Calendar,
  Check,
  ArrowRight,
  Phone,
  Mail,
  Clock,
  ArrowLeft,
  Building2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { SafeImage } from '../components/UI';
import { formatPKR } from '../lib/constants';
import type { ProjectItem, BlogPostItem } from '../types';

export const ProjectsPage: React.FC = () => {
  const { apiFetch, searchParams, cities, toast, user } = useApp();
  const [cityFilter, setCityFilter] = useState(searchParams.get('city') || '');
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProject, setSelectedProject] = useState<ProjectItem | null>(null);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    const qs = cityFilter ? `?city=${encodeURIComponent(cityFilter)}` : '';
    apiFetch<{ items: ProjectItem[] }>(`/api/public/projects${qs}`)
      .then((res) => setProjects(res.items || []))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, [apiFetch, cityFilter]);

  const handleProjectInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/public/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          type: 'project',
          name,
          email,
          phone,
          subject: `Investment Dossier: ${selectedProject.title}`,
          message: message || `Requesting payment plan and ROI breakdown for ${selectedProject.title}.`,
        }),
      });
      toast(res.message);
      setSelectedProject(null);
      setMessage('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Request failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-[#0D1B2A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-2">New Developments</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold">Signature Investment Projects</h1>
            <p className="text-sm text-slate-300 mt-1.5 max-w-xl">
              Vetted residential towers, gated villa communities, and Grade-A business hubs with verified NOC approvals.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCityFilter('')}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg ${
                !cityFilter ? 'bg-white text-[#0D1B2A]' : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              All Cities
            </button>
            {cities.slice(0, 3).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCityFilter(c.name)}
                className={`px-3.5 py-2 text-xs font-semibold rounded-lg ${
                  cityFilter === c.name ? 'bg-white text-[#0D1B2A]' : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-pulse">
            {[1, 2].map((n) => (
              <div key={n} className="h-80 bg-white rounded-2xl border border-slate-200" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
            <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="font-serif text-xl text-[#0D1B2A]">No projects found in this city yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-7">
            {projects.map((p) => (
              <article
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col"
              >
                <div className="aspect-[16/9] relative bg-slate-100">
                  <SafeImage src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  <span className="absolute top-3 left-3 px-3 py-1 text-xs font-semibold rounded bg-[#0D1B2A] text-white">
                    {p.status}
                  </span>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span>{p.developer}</span>
                    <span aria-hidden="true">·</span>
                    <span>{p.city}</span>
                  </div>
                  <h2 className="font-serif text-2xl font-semibold text-[#0D1B2A] mt-1">{p.title}</h2>
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-[#C49A5C]" />
                    {p.location}
                  </p>
                  <p className="mt-3 text-sm text-slate-600 leading-relaxed">{p.description}</p>

                  <div className="mt-4 py-3 border-y border-slate-100 grid grid-cols-3 gap-3 text-xs tabular-nums">
                    <div>
                      <p className="text-slate-500">Starting From</p>
                      <p className="font-bold text-[#0D1B2A] mt-0.5">{formatPKR(p.startingPrice)}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 flex items-center gap-1">
                        <TrendingUp className="w-3.5 h-3.5 text-[#C49A5C]" /> Est. Return
                      </p>
                      <p className="font-semibold text-[#0D1B2A] mt-0.5">{p.expectedRoi}</p>
                    </div>
                    <div>
                      <p className="text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#C49A5C]" /> Handover
                      </p>
                      <p className="font-semibold text-[#0D1B2A] mt-0.5">{p.completionDate}</p>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-2">
                    {(p.highlights || []).map((h) => (
                      <div key={h} className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-[#A87E43] shrink-0" />
                        <span>{h}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-auto pt-5">
                    <button
                      type="button"
                      onClick={() => setSelectedProject(p)}
                      className="w-full py-2.5 px-4 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40] inline-flex items-center justify-center gap-2"
                    >
                      Request Investment Brochure & Payment Plan
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {selectedProject && (
        <div
          className="fixed inset-0 z-50 bg-[#0A1522]/60 flex items-center justify-center p-4"
          onClick={() => setSelectedProject(null)}
        >
          <div
            className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-xl font-semibold text-[#0D1B2A]">
              Inquire: {selectedProject.title}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Receive the official payment schedule, floor plans, and NOC verification pack.
            </p>
            <form onSubmit={handleProjectInquiry} className="mt-4 space-y-3">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Full Name"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
              />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (+92...)"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
              />
              <textarea
                rows={3}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Preferred unit size or investment questions"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSelectedProject(null)}
                  className="flex-1 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40]"
                >
                  {submitting ? 'Sending...' : 'Send Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export const AboutPage: React.FC = () => {
  const { settings, agents, navigate } = useApp();
  return (
    <div className="bg-white pb-16">
      <section className="bg-[#0D1B2A] text-white py-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7">
            <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-2">About NexaHome</p>
            <h1 className="font-serif text-4xl sm:text-5xl font-semibold leading-tight">
              Built on Clarity, Verified Ownership &amp; Lasting Relationships
            </h1>
            <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed max-w-2xl">
              {settings.whyBody}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate('/services')}
                className="px-5 py-2.5 rounded-lg bg-white text-[#0D1B2A] text-xs font-semibold hover:bg-slate-100"
              >
                Explore Our Services
              </button>
              <button
                type="button"
                onClick={() => navigate('/contact')}
                className="px-5 py-2.5 rounded-lg border border-white/25 text-white text-xs font-semibold hover:bg-white/10"
              >
                Contact Advisory Desk
              </button>
            </div>
          </div>
          <div className="lg:col-span-5 aspect-[4/3] rounded-2xl overflow-hidden border border-white/15">
            <SafeImage src={settings.banner1Image} alt="NexaHome interiors" className="w-full h-full object-cover" />
          </div>
        </div>
      </section>

      {/* Meet Our Agents */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14">
        <div className="mb-8">
          <h2 className="font-serif text-3xl font-semibold text-[#0D1B2A]">Meet Our Property Advisors</h2>
          <p className="text-sm text-slate-500 mt-1">
            Dedicated city specialists across Lahore, Karachi, and Islamabad.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {agents.map((a) => (
            <div key={a.id} className="bg-[#F8F7F4] rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
              <div className="aspect-square overflow-hidden bg-slate-200">
                <SafeImage src={a.avatarUrl} alt={a.name} className="w-full h-full object-cover" />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-serif text-lg font-semibold text-[#0D1B2A]">{a.name}</h3>
                <p className="text-xs font-medium text-[#A87E43]">{a.title}</p>
                <p className="text-xs text-slate-500 mt-1 tabular-nums">
                  {a.city} · {a.experienceYears}+ yrs exp
                </p>
                <p className="mt-3 text-xs text-slate-600 leading-relaxed">{a.bio}</p>
                <div className="mt-auto pt-4 border-t border-slate-200/70 space-y-1 text-xs text-slate-600 tabular-nums">
                  <p>{a.phone}</p>
                  <p>{a.email}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export const ServicesPage: React.FC = () => {
  const { apiFetch, user, toast } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [serviceType, setServiceType] = useState('Residential Buying Advisory');
  const [budgetRange, setBudgetRange] = useState('PKR 30M – 60M');
  const [preferredDate, setPreferredDate] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const services = [
    {
      num: '01',
      title: 'Residential Buying & Selling',
      desc: 'End-to-end representation for houses, apartments, and villas with verified title transfer and price benchmarking.',
    },
    {
      num: '02',
      title: 'Corporate & Commercial Leasing',
      desc: 'Turnkey office floors, flagship retail spaces, and lease negotiation for enterprises and investors.',
    },
    {
      num: '03',
      title: 'Investment & Yield Advisory',
      desc: 'Data-backed portfolio selection across pre-launch towers and rental-yielding assets in Lahore, Karachi, and Islamabad.',
    },
    {
      num: '04',
      title: 'Property Management',
      desc: 'Tenant vetting, rent collection, and maintenance oversight tailored for overseas Pakistani homeowners.',
    },
  ];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/public/consultations', {
        method: 'POST',
        body: JSON.stringify({ name, email, phone, serviceType, budgetRange, preferredDate, message }),
      });
      toast(res.message);
      setMessage('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Booking failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-[#0D1B2A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-2">Advisory &amp; Services</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">Services &amp; Private Consultation</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-5">
          {services.map((s) => (
            <div key={s.num} className="bg-white rounded-2xl border border-slate-200 p-6">
              <span className="font-serif text-lg font-bold text-[#C49A5C]">{s.num}.</span>
              <h2 className="font-serif text-xl font-semibold text-[#0D1B2A] mt-2">{s.title}</h2>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
          <h2 className="font-serif text-2xl font-semibold text-[#0D1B2A]">Book a Consultation</h2>
          <p className="text-xs text-slate-500 mt-1 mb-5">
            Schedule a one-on-one session with a senior NexaHome advisor (in-office or video call).
          </p>
          <form onSubmit={handleBook} className="space-y-3.5">
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Full Name"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Phone (+92...)"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
            >
              <option>Residential Buying Advisory</option>
              <option>Commercial &amp; Corporate Leasing</option>
              <option>Investment &amp; ROI Portfolio</option>
              <option>Property Management (Overseas Clients)</option>
              <option>Legal &amp; Documentation Review</option>
            </select>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <select
                value={budgetRange}
                onChange={(e) => setBudgetRange(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option>PKR 15M – 30M</option>
                <option>PKR 30M – 60M</option>
                <option>PKR 60M – 120M</option>
                <option>PKR 120M+</option>
                <option>Rental / Corporate Lease</option>
              </select>
              <input
                type="date"
                required
                value={preferredDate}
                onChange={(e) => setPreferredDate(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Tell us about your property goals or target neighborhoods"
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
            />
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40]"
            >
              {submitting ? 'Reserving...' : 'Confirm Consultation Booking'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const BlogPage: React.FC = () => {
  const { apiFetch, navigate } = useApp();
  const [posts, setPosts] = useState<BlogPostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ items: BlogPostItem[] }>('/api/public/blog')
      .then((res) => setPosts(res.items || []))
      .catch(() => setPosts([]))
      .finally(() => setLoading(false));
  }, [apiFetch]);

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-[#0D1B2A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-2">NexaHome Journal</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">Market Insights &amp; Buyer Guides</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-80 bg-white rounded-2xl border border-slate-200" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {posts.map((post) => (
              <article
                key={post.id}
                onClick={() => navigate(`/blog/${post.slug}`)}
                className="group cursor-pointer bg-white rounded-2xl border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow"
              >
                <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                  <SafeImage
                    src={post.coverImage}
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <div className="text-xs text-slate-500 flex items-center gap-2">
                    <span className="font-semibold text-[#A87E43]">{post.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{post.readTime}</span>
                  </div>
                  <h2 className="font-serif text-lg font-semibold text-[#0D1B2A] mt-2 group-hover:text-[#A87E43] transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-sm text-slate-600 mt-2 line-clamp-3 leading-relaxed">{post.excerpt}</p>
                  <div className="mt-auto pt-4 text-xs text-slate-500 flex items-center justify-between">
                    <span>By {post.author}</span>
                    <span className="font-semibold text-[#0D1B2A] inline-flex items-center gap-1">
                      Read <ArrowRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export const BlogDetailPage: React.FC<{ slug: string }> = ({ slug }) => {
  const { apiFetch, navigate } = useApp();
  const [post, setPost] = useState<BlogPostItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch<{ post: BlogPostItem }>(`/api/public/blog/${encodeURIComponent(slug)}`)
      .then((res) => setPost(res.post))
      .catch(() => setPost(null))
      .finally(() => setLoading(false));
  }, [apiFetch, slug]);

  if (loading) return <div className="max-w-3xl mx-auto px-4 py-16 animate-pulse h-96" />;
  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl text-[#0D1B2A]">Article not found</h1>
        <button type="button" onClick={() => navigate('/blog')} className="mt-4 px-5 py-2.5 bg-[#0D1B2A] text-white text-xs rounded-lg">
          Back to Blog
        </button>
      </div>
    );
  }

  return (
    <article className="bg-white py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <button
          type="button"
          onClick={() => navigate('/blog')}
          className="text-xs font-semibold text-slate-500 hover:text-[#0D1B2A] inline-flex items-center gap-1.5 mb-6"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Journal
        </button>
        <div className="text-xs text-slate-500 flex items-center gap-2 mb-3">
          <span className="font-semibold text-[#A87E43]">{post.category}</span>
          <span aria-hidden="true">·</span>
          <span>{post.readTime}</span>
          <span aria-hidden="true">·</span>
          <span>By {post.author}</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0D1B2A] leading-tight">
          {post.title}
        </h1>
        <div className="my-7 aspect-[16/9] rounded-2xl overflow-hidden border border-slate-200">
          <SafeImage src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
        </div>
        <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed space-y-4 whitespace-pre-line text-[15px]">
          {post.content}
        </div>
      </div>
    </article>
  );
};

export const ContactPage: React.FC = () => {
  const { settings, apiFetch, user, toast } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/public/inquiries', {
        method: 'POST',
        body: JSON.stringify({ type: 'contact', name, email, phone, subject, message }),
      });
      toast(res.message);
      setSubject('');
      setMessage('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Message could not be sent.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-[#0D1B2A] text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-2">Get In Touch</p>
          <h1 className="font-serif text-3xl sm:text-4xl font-semibold">Contact NexaHome Real Estate</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5 bg-[#0D1B2A] text-white rounded-2xl p-7 space-y-6">
          <h2 className="font-serif text-2xl font-semibold">Headquarters &amp; Desk</h2>
          <p className="text-sm text-slate-300 leading-relaxed">
            Whether you are acquiring a family residence, leasing corporate headquarters, or listing a verified asset, our team responds within one business day.
          </p>
          <ul className="space-y-4 text-sm text-slate-200">
            <li className="flex items-start gap-3">
              <Phone className="w-4 h-4 text-[#C49A5C] mt-1 shrink-0" />
              <span className="tabular-nums">{settings.contactPhone}</span>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="w-4 h-4 text-[#C49A5C] mt-1 shrink-0" />
              <span>{settings.contactEmail}</span>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="w-4 h-4 text-[#C49A5C] mt-1 shrink-0" />
              <span>{settings.contactAddress}</span>
            </li>
            <li className="flex items-start gap-3">
              <Clock className="w-4 h-4 text-[#C49A5C] mt-1 shrink-0" />
              <span>{settings.contactHours}</span>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 p-7">
          <h2 className="font-serif text-2xl font-semibold text-[#0D1B2A] mb-5">Send Us a Message</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Subject</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Buying, Selling, Commercial Lease..."
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Message</label>
              <textarea
                rows={5}
                required
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40]"
            >
              {submitting ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export const LegalPage: React.FC<{ mode: 'privacy' | 'terms' }> = ({ mode }) => (
  <div className="bg-white py-14">
    <div className="max-w-3xl mx-auto px-4 sm:px-6 space-y-5">
      <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0D1B2A]">
        {mode === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
      </h1>
      <p className="text-xs text-slate-500">Effective Date: November 2026 · NexaHome Real Estate</p>
      {mode === 'privacy' ? (
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            NexaHome Real Estate respects your privacy and safeguards personal information shared when registering an account, submitting property inquiries, scheduling tours, or listing properties.
          </p>
          <h2 className="font-serif text-lg font-semibold text-[#0D1B2A]">1. Information We Collect</h2>
          <p>
            We collect contact details (name, email address, phone number), saved property preferences, and listing details submitted directly by you. Authentication tokens are managed securely and never sold to third parties.
          </p>
          <h2 className="font-serif text-lg font-semibold text-[#0D1B2A]">2. How We Use Information</h2>
          <p>
            Your details are used solely to connect you with verified property advisors, confirm scheduled visits, review user-submitted property listings, and send market alerts if you opt into our newsletter.
          </p>
        </div>
      ) : (
        <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
          <p>
            By accessing NexaHome Real Estate, you agree to provide accurate listing details and abide by fair property disclosure standards across Pakistan.
          </p>
          <h2 className="font-serif text-lg font-semibold text-[#0D1B2A]">1. User-Submitted Listings</h2>
          <p>
            All properties submitted through &ldquo;List Your Property&rdquo; undergo administrative verification before publication. NexaHome reserves the right to reject incomplete or misleading submissions.
          </p>
          <h2 className="font-serif text-lg font-semibold text-[#0D1B2A]">2. Pricing &amp; Availability</h2>
          <p>
            All PKR prices and availability statuses are updated regularly; final transaction terms are confirmed during formal legal transfer and verification with our licensed advisors.
          </p>
        </div>
      )}
    </div>
  </div>
);
