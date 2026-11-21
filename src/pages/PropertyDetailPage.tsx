import React, { useEffect, useState } from 'react';
import {
  MapPin,
  BedDouble,
  Bath,
  Maximize2,
  Heart,
  Share2,
  Check,
  Phone,
  Mail,
  Calendar,
  ArrowLeft,
  Eye,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PropertyCard, SafeImage } from '../components/UI';
import { formatPKR } from '../lib/constants';
import type { PropertyItem } from '../types';

export const PropertyDetailPage: React.FC<{ slugOrId: string }> = ({ slugOrId }) => {
  const { apiFetch, navigate, wishlistIds, toggleWishlist, user, toast } = useApp();
  const [property, setProperty] = useState<PropertyItem | null>(null);
  const [similar, setSimilar] = useState<PropertyItem[]>([]);
  const [activeImg, setActiveImg] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeFormTab, setActiveFormTab] = useState<'inquiry' | 'visit'>('inquiry');

  // Inquiry form state
  const [inqName, setInqName] = useState(user?.name || '');
  const [inqEmail, setInqEmail] = useState(user?.email || '');
  const [inqPhone, setInqPhone] = useState(user?.phone || '');
  const [inqMessage, setInqMessage] = useState('');
  const [inqSubmitting, setInqSubmitting] = useState(false);

  // Schedule visit form state
  const [visitDate, setVisitDate] = useState('');
  const [visitTime, setVisitTime] = useState('11:00 AM');
  const [visitNotes, setVisitNotes] = useState('');
  const [visitSubmitting, setVisitSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      if (!inqName) setInqName(user.name);
      if (!inqEmail) setInqEmail(user.email);
      if (!inqPhone && user.phone) setInqPhone(user.phone);
    }
  }, [user]);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    apiFetch<{ property: PropertyItem; similar: PropertyItem[] }>(`/api/public/properties/${encodeURIComponent(slugOrId)}`)
      .then((res) => {
        if (!mounted) return;
        setProperty(res.property);
        setSimilar(res.similar || []);
        setActiveImg(0);
        setInqMessage(`Hello, I am interested in "${res.property.title}" (${res.property.location}). Please share full details.`);
      })
      .catch(() => {
        if (mounted) setProperty(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [apiFetch, slugOrId]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Property link copied to clipboard.');
    } catch {
      toast('Share URL ready in your browser address bar.', 'info');
    }
  };

  const handleInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setInqSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/public/inquiries', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          type: 'property',
          name: inqName,
          email: inqEmail,
          phone: inqPhone,
          subject: `Inquiry: ${property.title}`,
          message: inqMessage,
        }),
      });
      toast(res.message);
      setInqMessage('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to send inquiry.', 'error');
    } finally {
      setInqSubmitting(false);
    }
  };

  const handleVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!property) return;
    setVisitSubmitting(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/public/visits', {
        method: 'POST',
        body: JSON.stringify({
          propertyId: property.id,
          name: inqName,
          email: inqEmail,
          phone: inqPhone,
          preferredDate: visitDate,
          preferredTime: visitTime,
          notes: visitNotes,
        }),
      });
      toast(res.message);
      setVisitNotes('');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed to schedule visit.', 'error');
    } finally {
      setVisitSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 animate-pulse space-y-6">
        <div className="h-8 bg-slate-200 rounded w-1/3" />
        <div className="aspect-[16/8] bg-slate-200 rounded-2xl" />
      </div>
    );
  }

  if (!property) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <h1 className="font-serif text-3xl font-semibold text-[#0D1B2A]">Property Not Found</h1>
        <p className="text-sm text-slate-500 mt-2">This listing may have been removed or is no longer available.</p>
        <button
          type="button"
          onClick={() => navigate('/listings')}
          className="mt-6 px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold"
        >
          Browse All Properties
        </button>
      </div>
    );
  }

  const isSaved = wishlistIds.has(property.id);
  const images = property.images?.length ? property.images : [''];
  const lat = property.latitude || 31.5204;
  const lng = property.longitude || 74.3587;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.03}%2C${lat - 0.02}%2C${lng + 0.03}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            type="button"
            onClick={() => navigate('/listings')}
            className="text-xs font-semibold text-slate-500 hover:text-[#0D1B2A] inline-flex items-center gap-1.5 mb-4"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Listings
          </button>

          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                <span className="font-semibold text-[#0D1B2A]">
                  {property.purpose === 'rent' ? 'For Rent' : 'For Sale'}
                </span>
                <span aria-hidden="true">·</span>
                <span>{property.category?.name || 'Property'}</span>
                <span aria-hidden="true">·</span>
                <span className="capitalize">{property.status}</span>
                <span aria-hidden="true">·</span>
                <span className="inline-flex items-center gap-1 tabular-nums">
                  <Eye className="w-3.5 h-3.5" /> {property.viewsCount} views
                </span>
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl font-semibold text-[#0D1B2A]">
                {property.title}
              </h1>
              <p className="mt-1.5 text-sm text-slate-600 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#C49A5C]" />
                {property.location}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="text-left lg:text-right mr-2">
                <p className="text-xs text-slate-500">Asking Price</p>
                <p className="font-serif text-2xl sm:text-3xl font-bold text-[#0D1B2A] tabular-nums">
                  {formatPKR(property.price, property.purpose)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => toggleWishlist(property.id)}
                className={`px-4 py-2.5 rounded-lg border text-xs font-semibold inline-flex items-center gap-2 transition-colors ${
                  isSaved
                    ? 'bg-[#0D1B2A] text-white border-[#0D1B2A]'
                    : 'bg-white text-[#0D1B2A] border-slate-300 hover:bg-slate-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${isSaved ? 'fill-current text-[#C49A5C]' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button
                type="button"
                onClick={handleShare}
                className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-[#0D1B2A] text-xs font-semibold hover:bg-slate-50 inline-flex items-center gap-2"
              >
                <Share2 className="w-4 h-4" />
                Share
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Body Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Main Content */}
        <div className="lg:col-span-8 space-y-6">
          {/* Gallery */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden p-3">
            <div className="aspect-[16/10] rounded-xl overflow-hidden bg-slate-100">
              <SafeImage
                src={images[activeImg]}
                alt={property.title}
                className="w-full h-full object-cover"
              />
            </div>
            {images.length > 1 && (
              <div className="mt-3 grid grid-cols-4 sm:grid-cols-6 gap-2.5">
                {images.map((img, i) => (
                  <button
                    key={`${img}-${i}`}
                    type="button"
                    onClick={() => setActiveImg(i)}
                    className={`aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                      i === activeImg ? 'border-[#0D1B2A]' : 'border-transparent opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={img} alt={`${property.title} view ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Specs Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-white rounded-2xl border border-slate-200 p-5">
            <div>
              <p className="text-xs text-slate-500">Bedrooms</p>
              <p className="mt-1 text-base font-semibold text-[#0D1B2A] flex items-center gap-1.5 tabular-nums">
                <BedDouble className="w-4 h-4 text-[#C49A5C]" />
                {property.bedrooms > 0 ? property.bedrooms : 'Open Space'}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Bathrooms</p>
              <p className="mt-1 text-base font-semibold text-[#0D1B2A] flex items-center gap-1.5 tabular-nums">
                <Bath className="w-4 h-4 text-[#C49A5C]" />
                {property.bathrooms}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Total Area</p>
              <p className="mt-1 text-base font-semibold text-[#0D1B2A] flex items-center gap-1.5 tabular-nums">
                <Maximize2 className="w-4 h-4 text-[#C49A5C]" />
                {property.areaLabel}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">City</p>
              <p className="mt-1 text-base font-semibold text-[#0D1B2A]">
                {property.city?.name || 'Pakistan'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
            <h2 className="font-serif text-xl font-semibold text-[#0D1B2A] mb-3">About This Property</h2>
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">{property.description}</p>
          </div>

          {/* Amenities */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
            <h2 className="font-serif text-xl font-semibold text-[#0D1B2A] mb-4">Features & Amenities</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {(property.amenities || []).map((am) => (
                <div key={am} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check className="w-4 h-4 text-[#A87E43] shrink-0" />
                  <span>{am}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Location Map */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl font-semibold text-[#0D1B2A]">Location Map</h2>
              <span className="text-xs text-slate-500 tabular-nums">
                {lat.toFixed(4)}° N, {lng.toFixed(4)}° E
              </span>
            </div>
            <div className="aspect-[16/9] rounded-xl overflow-hidden border border-slate-200 bg-slate-100">
              <iframe
                title={`Map of ${property.title}`}
                src={mapUrl}
                className="w-full h-full border-0"
                loading="lazy"
              />
            </div>
          </div>
        </div>

        {/* Right Sidebar: Agent + Inquiry / Visit Forms */}
        <aside className="lg:col-span-4 space-y-6">
          {property.agent && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Dedicated Property Advisor
              </p>
              <div className="flex items-center gap-3.5">
                <div className="w-14 h-14 rounded-full overflow-hidden border border-slate-200 shrink-0">
                  <SafeImage
                    src={property.agent.avatarUrl}
                    alt={property.agent.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">
                    {property.agent.name}
                  </h3>
                  <p className="text-xs text-slate-500">{property.agent.title}</p>
                  <p className="text-xs text-[#A87E43] font-medium mt-0.5 tabular-nums">
                    {property.agent.experienceYears} years experience · {property.agent.city}
                  </p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <p className="flex items-center gap-2 tabular-nums">
                  <Phone className="w-3.5 h-3.5 text-[#C49A5C]" />
                  {property.agent.phone}
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#C49A5C]" />
                  {property.agent.email}
                </p>
              </div>
            </div>
          )}

          {/* Inquiry / Schedule Visit Tabs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sticky top-20">
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg mb-5">
              <button
                type="button"
                onClick={() => setActiveFormTab('inquiry')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  activeFormTab === 'inquiry' ? 'bg-[#0D1B2A] text-white' : 'text-slate-600 hover:text-[#0D1B2A]'
                }`}
              >
                Send Inquiry
              </button>
              <button
                type="button"
                onClick={() => setActiveFormTab('visit')}
                className={`py-2 text-xs font-semibold rounded-md transition-colors ${
                  activeFormTab === 'visit' ? 'bg-[#0D1B2A] text-white' : 'text-slate-600 hover:text-[#0D1B2A]'
                }`}
              >
                Schedule Visit
              </button>
            </div>

            {activeFormTab === 'inquiry' ? (
              <form onSubmit={handleInquiry} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={inqName}
                    onChange={(e) => setInqName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={inqEmail}
                    onChange={(e) => setInqEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={inqPhone}
                    onChange={(e) => setInqPhone(e.target.value)}
                    placeholder="+92 300 123 4567"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    required
                    value={inqMessage}
                    onChange={(e) => setInqMessage(e.target.value)}
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
                  />
                </div>
                <button
                  type="submit"
                  disabled={inqSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40] disabled:opacity-60"
                >
                  {inqSubmitting ? 'Sending...' : 'Send Inquiry'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVisit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={inqName}
                    onChange={(e) => setInqName(e.target.value)}
                    placeholder="Your full name"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={inqEmail}
                    onChange={(e) => setInqEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    required
                    value={inqPhone}
                    onChange={(e) => setInqPhone(e.target.value)}
                    placeholder="+92 300 123 4567"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Date</label>
                    <input
                      type="date"
                      required
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Time</label>
                    <select
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                    >
                      <option>10:00 AM</option>
                      <option>11:00 AM</option>
                      <option>02:00 PM</option>
                      <option>04:00 PM</option>
                      <option>05:30 PM</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Notes (optional)</label>
                  <textarea
                    rows={2}
                    value={visitNotes}
                    onChange={(e) => setVisitNotes(e.target.value)}
                    placeholder="Any specific questions for the tour?"
                    className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                  />
                </div>
                <button
                  type="submit"
                  disabled={visitSubmitting}
                  className="w-full py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40] flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  <Calendar className="w-4 h-4" />
                  {visitSubmitting ? 'Booking...' : 'Book Property Tour'}
                </button>
              </form>
            )}
          </div>
        </aside>
      </div>

      {/* Similar Properties */}
      {similar.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-14">
          <h2 className="font-serif text-2xl font-semibold text-[#0D1B2A] mb-5">Similar Properties</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {similar.map((item) => (
              <PropertyCard key={item.id} property={item} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
