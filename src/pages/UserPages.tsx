import React, { useEffect, useState } from 'react';
import {
  Upload,
  X,
  Heart,
  MessageSquare,
  Calendar,
  Building2,
  User as UserIcon,
  Trash2,
  Plus,
  CheckCircle2,
  Clock,
  ShieldAlert,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PropertyCard, SafeImage } from '../components/UI';
import { formatPKR } from '../lib/constants';
import type { PropertyItem, InquiryItem, VisitRequestItem, ConsultationItem } from '../types';

export const ListPropertyPage: React.FC = () => {
  const { user, openAuthModal, categories, cities, apiFetch, toast, navigate } = useApp();

  const [title, setTitle] = useState('');
  const [purpose, setPurpose] = useState<'sale' | 'rent'>('sale');
  const [categoryId, setCategoryId] = useState('');
  const [cityId, setCityId] = useState('');
  const [location, setLocation] = useState('');
  const [price, setPrice] = useState('');
  const [bedrooms, setBedrooms] = useState('3');
  const [bathrooms, setBathrooms] = useState('3');
  const [areaValue, setAreaValue] = useState('2250');
  const [areaLabel, setAreaLabel] = useState('10 Marla');
  const [description, setDescription] = useState('');
  const [amenitiesText, setAmenitiesText] = useState('24/7 Security, Covered Parking, Solar Ready, Modern Kitchen');
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const form = new FormData();
      Array.from(files).slice(0, 6).forEach((f) => form.append('images', f));
      const res = await apiFetch<{ urls: string[] }>('/api/uploads', {
        method: 'POST',
        body: form,
      });
      setImages((prev) => [...prev, ...(res.urls || [])].slice(0, 6));
      toast(`${res.urls.length} image(s) uploaded.`);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const amenities = amenitiesText
        .split(',')
        .map((a) => a.trim())
        .filter(Boolean);
      const res = await apiFetch<{ message: string }>('/api/user/listings', {
        method: 'POST',
        body: JSON.stringify({
          title,
          purpose,
          categoryId: categoryId ? Number(categoryId) : categories[0]?.id,
          cityId: cityId ? Number(cityId) : cities[0]?.id,
          location,
          price: Number(price),
          bedrooms: Number(bedrooms),
          bathrooms: Number(bathrooms),
          areaValue: Number(areaValue),
          areaLabel,
          description,
          amenities,
          images,
        }),
      });
      toast(res.message);
      navigate('/account');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Submission failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-[#F8F7F4] min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 p-8 text-center">
          <Building2 className="w-10 h-10 text-[#C49A5C] mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-semibold text-[#0D1B2A]">List Your Property</h1>
          <p className="text-sm text-slate-600 mt-2">
            Sign in or create an account to submit your property for verification and publication on NexaHome.
          </p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => openAuthModal('login')}
              className="px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40]"
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => openAuthModal('register')}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-[#0D1B2A] text-xs font-semibold hover:bg-slate-50"
            >
              Create Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-[#0D1B2A] text-white py-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-1.5">Owner &amp; Seller Submission</p>
          <h1 className="font-serif text-3xl font-semibold">Submit Your Property Listing</h1>
          <p className="text-sm text-slate-300 mt-1">
            Submitted listings are reviewed by our administration team to verify pricing and ownership before going live.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-8">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Property Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Designer 10-Marla Residence in DHA Phase 6"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Purpose</label>
              <select
                value={purpose}
                onChange={(e) => setPurpose(e.target.value as 'sale' | 'rent')}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
              >
                <option value="sale">For Sale</option>
                <option value="rent">For Rent (Monthly)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Category</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">City</label>
              <select
                value={cityId}
                onChange={(e) => setCityId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 bg-white"
              >
                {cities.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Neighborhood / Address</label>
              <input
                type="text"
                required
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. DHA Phase 6, Lahore, Pakistan"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Asking Price (PKR{purpose === 'rent' ? ' / month' : ''})
              </label>
              <input
                type="number"
                required
                min={1000}
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder={purpose === 'rent' ? '150000' : '45000000'}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 tabular-nums"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bedrooms</label>
                <input
                  type="number"
                  min={0}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 tabular-nums"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Bathrooms</label>
                <input
                  type="number"
                  min={0}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-slate-300 tabular-nums"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Area Display Label</label>
              <input
                type="text"
                required
                value={areaLabel}
                onChange={(e) => setAreaLabel(e.target.value)}
                placeholder="e.g. 10 Marla, 1 Kanal, 2,200 sqft"
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Area Size (sqft, numeric)</label>
              <input
                type="number"
                min={100}
                value={areaValue}
                onChange={(e) => setAreaValue(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 tabular-nums"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Property Description</label>
            <textarea
              rows={4}
              required
              minLength={15}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe layout, finishes, nearby landmarks, and transfer status..."
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Amenities (comma separated)
            </label>
            <input
              type="text"
              value={amenitiesText}
              onChange={(e) => setAmenitiesText(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Property Photos (JPG, PNG, WebP · max 5MB each)
            </label>
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-xl p-6 cursor-pointer hover:border-[#0D1B2A] transition-colors bg-slate-50/50">
              <Upload className="w-6 h-6 text-[#C49A5C] mb-2" />
              <span className="text-xs font-semibold text-[#0D1B2A]">
                {uploading ? 'Uploading photos...' : 'Click to upload up to 6 property photos'}
              </span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                disabled={uploading}
                onChange={handleUpload}
                className="hidden"
              />
            </label>
            {images.length > 0 && (
              <div className="mt-3 grid grid-cols-3 sm:grid-cols-6 gap-2.5">
                {images.map((url, idx) => (
                  <div key={`${url}-${idx}`} className="relative aspect-[4/3] rounded-lg overflow-hidden border border-slate-200">
                    <SafeImage src={url} alt={`Upload ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setImages((prev) => prev.filter((_, i) => i !== idx))}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/account')}
              className="px-5 py-2.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading}
              className="px-6 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40] disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Property for Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const AccountPage: React.FC = () => {
  const { user, openAuthModal, apiFetch, refreshUser, toast, navigate } = useApp();
  const [tab, setTab] = useState<'wishlist' | 'listings' | 'inquiries' | 'visits' | 'profile'>('wishlist');
  const [loading, setLoading] = useState(true);
  const [wishlist, setWishlist] = useState<PropertyItem[]>([]);
  const [myListings, setMyListings] = useState<PropertyItem[]>([]);
  const [myInquiries, setMyInquiries] = useState<InquiryItem[]>([]);
  const [myVisits, setMyVisits] = useState<VisitRequestItem[]>([]);
  const [myConsultations, setMyConsultations] = useState<ConsultationItem[]>([]);

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const data = await apiFetch<{
        wishlist: PropertyItem[];
        listings: PropertyItem[];
        inquiries: InquiryItem[];
        visits: VisitRequestItem[];
        consultations: ConsultationItem[];
      }>('/api/user/dashboard');
      setWishlist(data.wishlist || []);
      setMyListings(data.listings || []);
      setMyInquiries(data.inquiries || []);
      setMyVisits(data.visits || []);
      setMyConsultations(data.consultations || []);
    } catch {
      // handled
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
      loadDashboard();
    }
  }, [user]);

  if (!user) {
    return (
      <div className="bg-[#F8F7F4] min-h-[70vh] flex items-center justify-center px-4 py-16">
        <div className="bg-white max-w-md w-full rounded-2xl border border-slate-200 p-8 text-center">
          <UserIcon className="w-10 h-10 text-[#C49A5C] mx-auto mb-3" />
          <h1 className="font-serif text-2xl font-semibold text-[#0D1B2A]">Your NexaHome Account</h1>
          <p className="text-sm text-slate-600 mt-2">
            Sign in to view your saved wishlist, scheduled property tours, inquiries, and submitted listings.
          </p>
          <button
            type="button"
            onClick={() => openAuthModal('login')}
            className="mt-6 px-6 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/profile', { method: 'PUT', body: JSON.stringify({ name, phone }) });
      await refreshUser();
      toast('Profile updated.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed.', 'error');
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      toast('Password updated successfully.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Password change failed.', 'error');
    }
  };

  const handleDeleteListing = async (id: number) => {
    try {
      await apiFetch(`/api/user/listings/${id}`, { method: 'DELETE' });
      setMyListings((prev) => prev.filter((p) => p.id !== id));
      toast('Listing removed.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not delete listing.', 'error');
    }
  };

  return (
    <div className="bg-[#F8F7F4] min-h-screen pb-16">
      <div className="bg-[#0D1B2A] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C]">Member Portal</p>
            <h1 className="font-serif text-3xl font-semibold mt-1">{user.name}</h1>
            <p className="text-xs text-slate-300 mt-1">{user.email}</p>
          </div>
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => navigate('/list-property')}
              className="px-4 py-2.5 rounded-lg bg-[#C49A5C] text-[#0D1B2A] text-xs font-semibold inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Submit Listing
            </button>
            {user.role === 'admin' && (
              <button
                type="button"
                onClick={() => navigate('/admin')}
                className="px-4 py-2.5 rounded-lg bg-white text-[#0D1B2A] text-xs font-semibold"
              >
                Open Admin Panel
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="flex flex-wrap gap-2 mb-6 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
          {(
            [
              { id: 'wishlist', label: `Wishlist (${wishlist.length})`, icon: Heart },
              { id: 'listings', label: `My Listings (${myListings.length})`, icon: Building2 },
              { id: 'inquiries', label: `Inquiries (${myInquiries.length})`, icon: MessageSquare },
              { id: 'visits', label: `Visits & Consults (${myVisits.length + myConsultations.length})`, icon: Calendar },
              { id: 'profile', label: 'Profile & Security', icon: UserIcon },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors ${
                tab === t.id ? 'bg-[#0D1B2A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="h-48 bg-white rounded-2xl border border-slate-200 animate-pulse" />
        ) : tab === 'wishlist' ? (
          wishlist.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center">
              <p className="font-serif text-xl text-[#0D1B2A]">No saved properties yet</p>
              <button
                type="button"
                onClick={() => navigate('/listings')}
                className="mt-4 px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold"
              >
                Explore Listings
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {wishlist.map((prop) => (
                <PropertyCard key={prop.id} property={prop} />
              ))}
            </div>
          )
        ) : tab === 'listings' ? (
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
            {myListings.length === 0 ? (
              <div className="p-10 text-center">
                <p className="font-serif text-xl text-[#0D1B2A]">You have not submitted any properties yet.</p>
                <button
                  type="button"
                  onClick={() => navigate('/list-property')}
                  className="mt-4 px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold"
                >
                  Submit Your First Property
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {myListings.map((p) => (
                  <div key={p.id} className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                        <SafeImage src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                      </div>
                      <div>
                        <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">{p.title}</h3>
                        <p className="text-xs text-slate-500">{p.location}</p>
                        <p className="text-xs font-bold text-[#0D1B2A] mt-1 tabular-nums">
                          {formatPKR(p.price, p.purpose)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-semibold capitalize ${
                          p.approvalStatus === 'approved'
                            ? 'text-emerald-700'
                            : p.approvalStatus === 'rejected'
                            ? 'text-red-600'
                            : 'text-amber-700'
                        }`}
                      >
                        {p.approvalStatus === 'approved' ? (
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        ) : p.approvalStatus === 'rejected' ? (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        ) : (
                          <Clock className="w-3.5 h-3.5" />
                        )}
                        {p.approvalStatus}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDeleteListing(p.id)}
                        className="p-2 rounded-lg text-red-600 hover:bg-red-50"
                        aria-label="Delete listing"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : tab === 'inquiries' ? (
          <div className="bg-white rounded-2xl border border-slate-200 divide-y divide-slate-100">
            {myInquiries.length === 0 ? (
              <p className="p-8 text-sm text-slate-500 text-center">No inquiries submitted yet.</p>
            ) : (
              myInquiries.map((inq) => (
                <div key={inq.id} className="p-5 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span className="font-semibold text-[#0D1B2A]">{inq.subject || 'Property Inquiry'}</span>
                    <span className="capitalize font-medium">{inq.status}</span>
                  </div>
                  <p className="text-sm text-slate-700">{inq.message}</p>
                  {inq.adminReply && (
                    <div className="mt-2 p-3 rounded-lg bg-[#F8F7F4] border border-slate-200 text-xs text-slate-700">
                      <span className="font-semibold text-[#0D1B2A]">Advisor Reply: </span>
                      {inq.adminReply}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        ) : tab === 'visits' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-serif text-lg font-semibold text-[#0D1B2A] mb-4">Scheduled Property Visits</h2>
              {myVisits.length === 0 ? (
                <p className="text-sm text-slate-500">No visits scheduled yet.</p>
              ) : (
                <div className="space-y-3">
                  {myVisits.map((v) => (
                    <div key={v.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                      <p className="font-semibold text-sm text-[#0D1B2A]">{v.propertyTitle || `Property #${v.propertyId}`}</p>
                      <p className="text-slate-500 tabular-nums">
                        {v.preferredDate} at {v.preferredTime} · Status: <span className="capitalize font-medium text-[#0D1B2A]">{v.status}</span>
                      </p>
                      {v.adminReply && <p className="text-emerald-700 pt-1">Note: {v.adminReply}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="font-serif text-lg font-semibold text-[#0D1B2A] mb-4">Advisory Consultations</h2>
              {myConsultations.length === 0 ? (
                <p className="text-sm text-slate-500">No consultations booked yet.</p>
              ) : (
                <div className="space-y-3">
                  {myConsultations.map((c) => (
                    <div key={c.id} className="p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                      <p className="font-semibold text-sm text-[#0D1B2A]">{c.serviceType}</p>
                      <p className="text-slate-500 tabular-nums">
                        {c.preferredDate} · {c.budgetRange} · Status: <span className="capitalize font-medium text-[#0D1B2A]">{c.status}</span>
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <form onSubmit={handleSaveProfile} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-serif text-lg font-semibold text-[#0D1B2A]">Profile Details</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Phone</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">
                Save Profile
              </button>
            </form>

            <form onSubmit={handleChangePassword} className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
              <h2 className="font-serif text-lg font-semibold text-[#0D1B2A]">Update Password</h2>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Current Password (if set)</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">New Password (min 8 chars)</label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300"
                />
              </div>
              <button type="submit" className="px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">
                Update Password
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
