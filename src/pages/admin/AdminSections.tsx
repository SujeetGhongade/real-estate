import React, { useEffect, useState } from 'react';
import {
  Plus,
  Pencil,
  Trash2,
  Copy,
  Star,
  Check,
  X,
  Upload,
  Download,
  Send,
  ShieldBan,
  ShieldCheck,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { SafeImage } from '../../components/UI';
import { formatPKR, IMAGES, type SiteSettingsData } from '../../lib/constants';
import type {
  PropertyItem,
  CategoryItem,
  CityItem,
  AgentItem,
  ProjectItem,
  TestimonialItem,
  BlogPostItem,
  InquiryItem,
  VisitRequestItem,
  ConsultationItem,
  UserProfile,
  SubscriberItem,
  ActivityLogItem,
} from '../../types';

// 1. PROPERTIES MANAGEMENT
export const AdminPropertiesSection: React.FC = () => {
  const { apiFetch, categories, cities, agents, toast } = useApp();
  const [items, setItems] = useState<PropertyItem[]>([]);
  const [search, setSearch] = useState('');
  const [filterApproval, setFilterApproval] = useState('all');
  const [filterPurpose, setFilterPurpose] = useState('all');
  const [editing, setEditing] = useState<Partial<PropertyItem> | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = async () => {
    const res = await apiFetch<{ items: PropertyItem[] }>('/api/admin/properties');
    setItems(res.items || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const filtered = items.filter((p) => {
    if (filterApproval !== 'all' && p.approvalStatus !== filterApproval) return false;
    if (filterPurpose !== 'all' && p.purpose !== filterPurpose) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.location.toLowerCase().includes(q);
    }
    return true;
  });

  const openCreate = () =>
    setEditing({
      title: '',
      description: '',
      purpose: 'sale',
      categoryId: categories[0]?.id || null,
      cityId: cities[0]?.id || null,
      agentId: agents[0]?.id || null,
      location: '',
      price: 45000000,
      bedrooms: 4,
      bathrooms: 3,
      areaValue: 2250,
      areaLabel: '10 Marla',
      status: 'available',
      approvalStatus: 'approved',
      isFeatured: false,
      images: [IMAGES.modernHouse],
      amenities: ['24/7 Security', 'Covered Parking', 'Modern Kitchen'],
    });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || !editing) return;
    setUploading(true);
    try {
      const fd = new FormData();
      Array.from(files).slice(0, 6).forEach((f) => fd.append('images', f));
      const res = await apiFetch<{ urls: string[] }>('/api/uploads', { method: 'POST', body: fd });
      setEditing({ ...editing, images: [...(editing.images || []), ...res.urls] });
      toast('Images uploaded.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Upload failed', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    try {
      if (editing.id) {
        await apiFetch(`/api/admin/properties/${editing.id}`, { method: 'PUT', body: JSON.stringify(editing) });
        toast('Property updated.');
      } else {
        await apiFetch('/api/admin/properties', { method: 'POST', body: JSON.stringify(editing) });
        toast('Property added.');
      }
      setEditing(null);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Save failed', 'error');
    }
  };

  const quickUpdate = async (id: number, patch: Record<string, unknown>, msg: string) => {
    try {
      await apiFetch(`/api/admin/properties/${id}`, { method: 'PUT', body: JSON.stringify(patch) });
      toast(msg);
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Update failed', 'error');
    }
  };

  const duplicate = async (id: number) => {
    try {
      await apiFetch(`/api/admin/properties/${id}/duplicate`, { method: 'POST' });
      toast('Property duplicated.');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Duplicate failed', 'error');
    }
  };

  const remove = async (id: number) => {
    try {
      await apiFetch(`/api/admin/properties/${id}`, { method: 'DELETE' });
      toast('Property deleted.');
      await load();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Delete failed', 'error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-2.5 flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search title or location..."
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 w-56"
          />
          <select
            value={filterApproval}
            onChange={(e) => setFilterApproval(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Approvals</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={filterPurpose}
            onChange={(e) => setFilterPurpose(e.target.value)}
            className="px-3 py-2 text-xs rounded-lg border border-slate-300 bg-white"
          >
            <option value="all">All Purposes</option>
            <option value="sale">For Sale</option>
            <option value="rent">For Rent</option>
          </select>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="px-4 py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4" /> Add Property
        </button>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold">
            <tr>
              <th className="py-3 px-4">Property</th>
              <th className="py-3 px-3">Price</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Approval</th>
              <th className="py-3 px-3 text-center">Featured</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-slate-50/70">
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-9 rounded overflow-hidden bg-slate-100 shrink-0">
                      <SafeImage src={p.images?.[0]} alt={p.title} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0D1B2A]">{p.title}</p>
                      <p className="text-[11px] text-slate-500">
                        {p.location} · {p.purpose === 'rent' ? 'Rent' : 'Sale'}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-3 font-semibold text-[#0D1B2A] tabular-nums whitespace-nowrap">
                  {formatPKR(p.price, p.purpose)}
                </td>
                <td className="py-3 px-3">
                  <select
                    value={p.status}
                    onChange={(e) => quickUpdate(p.id, { status: e.target.value }, 'Status updated.')}
                    className="px-2 py-1 rounded border border-slate-200 bg-white text-xs capitalize"
                  >
                    <option value="available">Available</option>
                    <option value="sold">Sold</option>
                    <option value="rented">Rented</option>
                  </select>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`font-semibold capitalize ${
                        p.approvalStatus === 'approved'
                          ? 'text-emerald-700'
                          : p.approvalStatus === 'rejected'
                          ? 'text-red-600'
                          : 'text-amber-600'
                      }`}
                    >
                      {p.approvalStatus}
                    </span>
                    {p.approvalStatus === 'pending' && (
                      <>
                        <button
                          type="button"
                          onClick={() => quickUpdate(p.id, { approvalStatus: 'approved' }, 'Listing approved.')}
                          className="p-1 rounded bg-emerald-600 text-white"
                          title="Approve"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => quickUpdate(p.id, { approvalStatus: 'rejected' }, 'Listing rejected.')}
                          className="p-1 rounded bg-red-600 text-white"
                          title="Reject"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3 text-center">
                  <button
                    type="button"
                    onClick={() => quickUpdate(p.id, { isFeatured: !p.isFeatured }, 'Featured flag updated.')}
                    className={`p-1.5 rounded-lg ${p.isFeatured ? 'text-[#C49A5C]' : 'text-slate-300 hover:text-slate-500'}`}
                    title="Toggle Featured"
                  >
                    <Star className={`w-4 h-4 ${p.isFeatured ? 'fill-current' : ''}`} />
                  </button>
                </td>
                <td className="py-3 px-4 text-right whitespace-nowrap">
                  <button
                    type="button"
                    onClick={() => setEditing(p)}
                    className="p-1.5 text-slate-600 hover:text-[#0D1B2A]"
                    title="Edit"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicate(p.id)}
                    className="p-1.5 text-slate-600 hover:text-[#0D1B2A]"
                    title="Duplicate"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(p.id)}
                    className="p-1.5 text-red-600 hover:text-red-800"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Property Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 bg-[#0A1522]/60 flex items-center justify-center p-4 overflow-y-auto">
          <form
            onSubmit={handleSave}
            className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif text-xl font-semibold text-[#0D1B2A]">
                {editing.id ? 'Edit Property' : 'Add New Property'}
              </h3>
              <button type="button" onClick={() => setEditing(null)} className="p-1.5 text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Title</label>
                <input
                  required
                  value={editing.title || ''}
                  onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Purpose</label>
                <select
                  value={editing.purpose || 'sale'}
                  onChange={(e) => setEditing({ ...editing, purpose: e.target.value as 'sale' | 'rent' })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  <option value="sale">For Sale</option>
                  <option value="rent">For Rent</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Category</label>
                <select
                  value={editing.categoryId || ''}
                  onChange={(e) => setEditing({ ...editing, categoryId: Number(e.target.value) || null })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">City</label>
                <select
                  value={editing.cityId || ''}
                  onChange={(e) => setEditing({ ...editing, cityId: Number(e.target.value) || null })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {cities.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Assigned Agent</label>
                <select
                  value={editing.agentId || ''}
                  onChange={(e) => setEditing({ ...editing, agentId: Number(e.target.value) || null })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white"
                >
                  {agents.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Location Address</label>
                <input
                  required
                  value={editing.location || ''}
                  onChange={(e) => setEditing({ ...editing, location: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Price (PKR)</label>
                <input
                  type="number"
                  required
                  value={editing.price || 0}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 tabular-nums"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Beds</label>
                  <input
                    type="number"
                    value={editing.bedrooms || 0}
                    onChange={(e) => setEditing({ ...editing, bedrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Baths</label>
                  <input
                    type="number"
                    value={editing.bathrooms || 0}
                    onChange={(e) => setEditing({ ...editing, bathrooms: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Area Label</label>
                  <input
                    value={editing.areaLabel || ''}
                    onChange={(e) => setEditing({ ...editing, areaLabel: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-600 mb-1">Sqft Numeric</label>
                  <input
                    type="number"
                    value={editing.areaValue || 0}
                    onChange={(e) => setEditing({ ...editing, areaValue: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={editing.description || ''}
                  onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Amenities (comma separated)</label>
                <input
                  value={(editing.amenities || []).join(', ')}
                  onChange={(e) =>
                    setEditing({
                      ...editing,
                      amenities: e.target.value.split(',').map((s) => s.trim()).filter(Boolean),
                    })
                  }
                  className="w-full px-3 py-2 rounded-lg border border-slate-300"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Photos</label>
                <label className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 cursor-pointer hover:bg-slate-50">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'Uploading...' : 'Upload Images'}</span>
                  <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={handleUpload} className="hidden" />
                </label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(editing.images || []).map((img, i) => (
                    <div key={`${img}-${i}`} className="relative w-16 h-12 rounded overflow-hidden border border-slate-200">
                      <SafeImage src={img} alt="Property" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditing({ ...editing, images: (editing.images || []).filter((_, idx) => idx !== i) })}
                        className="absolute top-0.5 right-0.5 bg-black/70 text-white rounded-full p-0.5"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setEditing(null)} className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold">
                Cancel
              </button>
              <button type="submit" className="px-5 py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">
                Save Property
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// 2. CATALOG CRUD (Categories, Cities, Agents, Projects)
export const AdminCatalogSection: React.FC = () => {
  const { apiFetch, refreshMeta, toast } = useApp();
  const [subTab, setSubTab] = useState<'categories' | 'cities' | 'agents' | 'projects'>('categories');
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [cities, setCities] = useState<CityItem[]>([]);
  const [agents, setAgents] = useState<AgentItem[]>([]);
  const [projects, setProjects] = useState<ProjectItem[]>([]);

  // Form states
  const [catName, setCatName] = useState('');
  const [catSub, setCatSub] = useState('');
  const [cityName, setCityName] = useState('');
  const [cityProv, setCityProv] = useState('Punjab');
  const [agentForm, setAgentForm] = useState({ name: '', title: '', email: '', phone: '', city: 'Lahore', bio: '', experienceYears: 5 });
  const [projForm, setProjForm] = useState({
    title: '',
    city: 'Lahore',
    location: '',
    developer: '',
    startingPrice: 30000000,
    expectedRoi: '15% Annual',
    completionDate: 'Q4 2027',
    status: 'Pre-Launch',
    description: '',
  });

  const loadAll = async () => {
    const [c1, c2, a1, p1] = await Promise.all([
      apiFetch<{ items: CategoryItem[] }>('/api/admin/categories'),
      apiFetch<{ items: CityItem[] }>('/api/admin/cities'),
      apiFetch<{ items: AgentItem[] }>('/api/admin/agents'),
      apiFetch<{ items: ProjectItem[] }>('/api/admin/projects'),
    ]);
    setCategories(c1.items || []);
    setCities(c2.items || []);
    setAgents(a1.items || []);
    setProjects(p1.items || []);
    refreshMeta();
  };

  useEffect(() => {
    loadAll().catch(() => {});
  }, []);

  const addCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/categories', { method: 'POST', body: JSON.stringify({ name: catName, subtitle: catSub || 'Explore spaces' }) });
      setCatName('');
      setCatSub('');
      toast('Category added.');
      loadAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const addCity = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/cities', { method: 'POST', body: JSON.stringify({ name: cityName, province: cityProv }) });
      setCityName('');
      toast('City added.');
      loadAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const addAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/agents', { method: 'POST', body: JSON.stringify(agentForm) });
      setAgentForm({ name: '', title: '', email: '', phone: '', city: 'Lahore', bio: '', experienceYears: 5 });
      toast('Agent added.');
      loadAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const addProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/admin/projects', {
        method: 'POST',
        body: JSON.stringify({ ...projForm, highlights: ['Approved NOC', 'Flexible Payment Plan'] }),
      });
      setProjForm({
        title: '',
        city: 'Lahore',
        location: '',
        developer: '',
        startingPrice: 30000000,
        expectedRoi: '15% Annual',
        completionDate: 'Q4 2027',
        status: 'Pre-Launch',
        description: '',
      });
      toast('Project published.');
      loadAll();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Failed', 'error');
    }
  };

  const del = async (endpoint: string, label: string) => {
    await apiFetch(endpoint, { method: 'DELETE' });
    toast(`${label} deleted.`);
    loadAll();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {(['categories', 'cities', 'agents', 'projects'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize ${
              subTab === t ? 'bg-[#0D1B2A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {subTab === 'categories' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={addCategory} className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-3 h-fit">
            <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Add Category</h3>
            <input required value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Category Name (e.g. Penthouses)" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input value={catSub} onChange={(e) => setCatSub(e.target.value)} placeholder="Short Subtitle" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">Add Category</button>
          </form>
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {categories.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{c.name}</p>
                  <p className="text-slate-500">{c.subtitle} · /{c.slug}</p>
                </div>
                <button type="button" onClick={() => del(`/api/admin/categories/${c.id}`, 'Category')} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'cities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={addCity} className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-3 h-fit">
            <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Add City</h3>
            <input required value={cityName} onChange={(e) => setCityName(e.target.value)} placeholder="City Name (e.g. Multan)" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input required value={cityProv} onChange={(e) => setCityProv(e.target.value)} placeholder="Province" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">Add City</button>
          </form>
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {cities.map((c) => (
              <div key={c.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{c.name}</p>
                  <p className="text-slate-500">{c.province}</p>
                </div>
                <button type="button" onClick={() => del(`/api/admin/cities/${c.id}`, 'City')} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'agents' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={addAgent} className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-3 h-fit">
            <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Add Advisor</h3>
            <input required value={agentForm.name} onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })} placeholder="Full Name" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input required value={agentForm.title} onChange={(e) => setAgentForm({ ...agentForm, title: e.target.value })} placeholder="Job Title" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input required type="email" value={agentForm.email} onChange={(e) => setAgentForm({ ...agentForm, email: e.target.value })} placeholder="Email" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input required value={agentForm.phone} onChange={(e) => setAgentForm({ ...agentForm, phone: e.target.value })} placeholder="Phone (+92...)" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input value={agentForm.city} onChange={(e) => setAgentForm({ ...agentForm, city: e.target.value })} placeholder="City" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <textarea rows={2} value={agentForm.bio} onChange={(e) => setAgentForm({ ...agentForm, bio: e.target.value })} placeholder="Short bio" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">Add Advisor</button>
          </form>
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {agents.map((a) => (
              <div key={a.id} className="p-4 flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <SafeImage src={a.avatarUrl} alt={a.name} className="w-10 h-10 rounded-full object-cover" />
                  <div>
                    <p className="font-semibold text-[#0D1B2A]">{a.name} · <span className="font-normal text-slate-500">{a.title}</span></p>
                    <p className="text-slate-500">{a.city} · {a.email} · {a.phone}</p>
                  </div>
                </div>
                <button type="button" onClick={() => del(`/api/admin/agents/${a.id}`, 'Agent')} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'projects' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={addProject} className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-3 h-fit">
            <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Add Project</h3>
            <input required value={projForm.title} onChange={(e) => setProjForm({ ...projForm, title: e.target.value })} placeholder="Project Name" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input required value={projForm.developer} onChange={(e) => setProjForm({ ...projForm, developer: e.target.value })} placeholder="Developer" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <div className="grid grid-cols-2 gap-2">
              <input required value={projForm.city} onChange={(e) => setProjForm({ ...projForm, city: e.target.value })} placeholder="City" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
              <input value={projForm.completionDate} onChange={(e) => setProjForm({ ...projForm, completionDate: e.target.value })} placeholder="Q4 2027" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            </div>
            <input required value={projForm.location} onChange={(e) => setProjForm({ ...projForm, location: e.target.value })} placeholder="Full Address" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <div className="grid grid-cols-2 gap-2">
              <input type="number" value={projForm.startingPrice} onChange={(e) => setProjForm({ ...projForm, startingPrice: Number(e.target.value) })} placeholder="Starting PKR" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
              <input value={projForm.expectedRoi} onChange={(e) => setProjForm({ ...projForm, expectedRoi: e.target.value })} placeholder="ROI" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            </div>
            <textarea rows={2} value={projForm.description} onChange={(e) => setProjForm({ ...projForm, description: e.target.value })} placeholder="Project description" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">Add Project</button>
          </form>
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {projects.map((p) => (
              <div key={p.id} className="p-4 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{p.title} ({p.city})</p>
                  <p className="text-slate-500">{p.developer} · {formatPKR(p.startingPrice)} · {p.expectedRoi}</p>
                </div>
                <button type="button" onClick={() => del(`/api/admin/projects/${p.id}`, 'Project')} className="p-1.5 text-red-600 hover:bg-red-50 rounded">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. CONTENT CRUD (Testimonials & Blog Posts)
export const AdminContentSection: React.FC = () => {
  const { apiFetch, toast } = useApp();
  const [subTab, setSubTab] = useState<'testimonials' | 'blog'>('testimonials');
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [posts, setPosts] = useState<BlogPostItem[]>([]);

  const [tForm, setTForm] = useState({ clientName: '', clientRole: 'Verified Client', rating: 5, quote: '' });
  const [bForm, setBForm] = useState({ title: '', category: 'Market Insights', author: 'NexaHome Editorial', excerpt: '', content: '', readTime: '5 min read' });

  const load = async () => {
    const [tRes, bRes] = await Promise.all([
      apiFetch<{ items: TestimonialItem[] }>('/api/admin/testimonials'),
      apiFetch<{ items: BlogPostItem[] }>('/api/admin/blog'),
    ]);
    setTestimonials(tRes.items || []);
    setPosts(bRes.items || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const addTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/testimonials', { method: 'POST', body: JSON.stringify(tForm) });
    setTForm({ clientName: '', clientRole: 'Verified Client', rating: 5, quote: '' });
    toast('Testimonial added.');
    load();
  };

  const addBlog = async (e: React.FormEvent) => {
    e.preventDefault();
    await apiFetch('/api/admin/blog', { method: 'POST', body: JSON.stringify(bForm) });
    setBForm({ title: '', category: 'Market Insights', author: 'NexaHome Editorial', excerpt: '', content: '', readTime: '5 min read' });
    toast('Blog article published.');
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 w-fit">
        {(['testimonials', 'blog'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setSubTab(t)}
            className={`px-3.5 py-2 rounded-lg text-xs font-semibold capitalize ${
              subTab === t ? 'bg-[#0D1B2A] text-white' : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t === 'blog' ? 'Blog Posts' : 'Testimonials'}
          </button>
        ))}
      </div>

      {subTab === 'testimonials' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={addTestimonial} className="lg:col-span-4 bg-white p-5 rounded-xl border border-slate-200 space-y-3 h-fit">
            <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Add Testimonial</h3>
            <input required value={tForm.clientName} onChange={(e) => setTForm({ ...tForm, clientName: e.target.value })} placeholder="Client Name" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <input value={tForm.clientRole} onChange={(e) => setTForm({ ...tForm, clientRole: e.target.value })} placeholder="Role / City" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <textarea required rows={3} value={tForm.quote} onChange={(e) => setTForm({ ...tForm, quote: e.target.value })} placeholder="Client review quote" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">Add Testimonial</button>
          </form>
          <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {testimonials.map((t) => (
              <div key={t.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{t.clientName} <span className="font-normal text-slate-500">· {t.clientRole}</span></p>
                  <p className="text-slate-600 mt-1">&ldquo;{t.quote}&rdquo;</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/testimonials/${t.id}`, { method: 'DELETE' });
                    toast('Testimonial deleted.');
                    load();
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <form onSubmit={addBlog} className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 space-y-3 h-fit">
            <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Publish Blog Post</h3>
            <input required value={bForm.title} onChange={(e) => setBForm({ ...bForm, title: e.target.value })} placeholder="Article Headline" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <div className="grid grid-cols-2 gap-2">
              <input value={bForm.category} onChange={(e) => setBForm({ ...bForm, category: e.target.value })} placeholder="Category" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
              <input value={bForm.author} onChange={(e) => setBForm({ ...bForm, author: e.target.value })} placeholder="Author" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            </div>
            <textarea required rows={2} value={bForm.excerpt} onChange={(e) => setBForm({ ...bForm, excerpt: e.target.value })} placeholder="Short summary excerpt" className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <textarea required rows={4} value={bForm.content} onChange={(e) => setBForm({ ...bForm, content: e.target.value })} placeholder="Full article content..." className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300" />
            <button type="submit" className="w-full py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">Publish Article</button>
          </form>
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 divide-y divide-slate-100">
            {posts.map((post) => (
              <div key={post.id} className="p-4 flex items-start justify-between gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#0D1B2A]">{post.title}</p>
                  <p className="text-slate-500 mt-0.5">{post.category} · {post.author} · {post.readTime}</p>
                </div>
                <button
                  type="button"
                  onClick={async () => {
                    await apiFetch(`/api/admin/blog/${post.id}`, { method: 'DELETE' });
                    toast('Article deleted.');
                    load();
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 4. LEADS MANAGEMENT (Inquiries, Visits, Consultations + Reply + Export CSV)
export const AdminLeadsSection: React.FC = () => {
  const { apiFetch, getAuthToken, toast } = useApp();
  const [subTab, setSubTab] = useState<'inquiries' | 'visits' | 'consultations'>('inquiries');
  const [inquiries, setInquiries] = useState<InquiryItem[]>([]);
  const [visits, setVisits] = useState<VisitRequestItem[]>([]);
  const [consultations, setConsultations] = useState<ConsultationItem[]>([]);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});

  const load = async () => {
    const res = await apiFetch<{
      inquiries: InquiryItem[];
      visits: VisitRequestItem[];
      consultations: ConsultationItem[];
    }>('/api/admin/leads');
    setInquiries(res.inquiries || []);
    setVisits(res.visits || []);
    setConsultations(res.consultations || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const exportCsv = async (entity: string) => {
    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/export/${entity}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `nexahome-${entity}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast(`Exported ${entity} CSV.`);
    } catch {
      toast('CSV export failed.', 'error');
    }
  };

  const updateLead = async (endpoint: string, payload: Record<string, unknown>, msg: string) => {
    await apiFetch(endpoint, { method: 'PATCH', body: JSON.stringify(payload) });
    toast(msg);
    load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
          {(
            [
              { id: 'inquiries', label: `Inquiries (${inquiries.length})` },
              { id: 'visits', label: `Visits (${visits.length})` },
              { id: 'consultations', label: `Consultations (${consultations.length})` },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold ${
                subTab === t.id ? 'bg-[#0D1B2A] text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => exportCsv(subTab)}
          className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-[#0D1B2A] text-xs font-semibold inline-flex items-center gap-1.5 hover:bg-slate-50"
        >
          <Download className="w-3.5 h-3.5" /> Export CSV
        </button>
      </div>

      {subTab === 'inquiries' && (
        <div className="space-y-3">
          {inquiries.map((inq) => {
            const key = `inq-${inq.id}`;
            return (
              <div key={inq.id} className="bg-white rounded-xl border border-slate-200 p-5 text-xs space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-sm text-[#0D1B2A]">
                      {inq.name} <span className="font-normal text-slate-500">({inq.email} · {inq.phone})</span>
                    </p>
                    <p className="text-slate-500">{inq.subject || inq.propertyTitle || 'General Inquiry'}</p>
                  </div>
                  <select
                    value={inq.status}
                    onChange={(e) => updateLead(`/api/admin/inquiries/${inq.id}`, { status: e.target.value }, 'Status updated.')}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white capitalize font-semibold"
                  >
                    <option value="new">New</option>
                    <option value="contacted">Contacted</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <p className="text-slate-700 leading-relaxed">{inq.message}</p>
                {inq.adminReply && (
                  <p className="p-2.5 rounded-lg bg-[#F8F7F4] text-slate-700 border border-slate-200">
                    <strong className="text-[#0D1B2A]">Sent Reply:</strong> {inq.adminReply}
                  </p>
                )}
                <div className="flex gap-2 pt-1">
                  <input
                    value={replyDrafts[key] || ''}
                    onChange={(e) => setReplyDrafts({ ...replyDrafts, [key]: e.target.value })}
                    placeholder="Write email reply to client..."
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      if (!replyDrafts[key]?.trim()) return;
                      await updateLead(`/api/admin/inquiries/${inq.id}`, { adminReply: replyDrafts[key] }, 'Reply recorded & status marked Contacted.');
                      setReplyDrafts({ ...replyDrafts, [key]: '' });
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-[#0D1B2A] text-white font-semibold inline-flex items-center gap-1"
                  >
                    <Send className="w-3.5 h-3.5" /> Reply
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'visits' && (
        <div className="space-y-3">
          {visits.map((v) => (
            <div key={v.id} className="bg-white rounded-xl border border-slate-200 p-5 text-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-[#0D1B2A]">{v.name} · {v.propertyTitle || `Property #${v.propertyId}`}</p>
                <p className="text-slate-500 mt-0.5 tabular-nums">{v.preferredDate} at {v.preferredTime} · {v.email} · {v.phone}</p>
                {v.notes && <p className="text-slate-600 mt-1">{v.notes}</p>}
              </div>
              <select
                value={v.status}
                onChange={(e) => updateLead(`/api/admin/visits/${v.id}`, { status: e.target.value }, 'Visit updated.')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white capitalize font-semibold"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          ))}
        </div>
      )}

      {subTab === 'consultations' && (
        <div className="space-y-3">
          {consultations.map((c) => (
            <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-5 text-xs flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-sm text-[#0D1B2A]">{c.name} · {c.serviceType}</p>
                <p className="text-slate-500 mt-0.5 tabular-nums">{c.preferredDate} · Budget: {c.budgetRange || 'N/A'} · {c.email} · {c.phone}</p>
                {c.message && <p className="text-slate-600 mt-1">{c.message}</p>}
              </div>
              <select
                value={c.status}
                onChange={(e) => updateLead(`/api/admin/consultations/${c.id}`, { status: e.target.value }, 'Consultation updated.')}
                className="px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white capitalize font-semibold"
              >
                <option value="new">New</option>
                <option value="contacted">Contacted</option>
                <option value="closed">Closed</option>
              </select>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// 5. USERS & SUBSCRIBERS
export const AdminUsersSection: React.FC = () => {
  const { apiFetch, getAuthToken, toast } = useApp();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [subscribers, setSubscribers] = useState<SubscriberItem[]>([]);

  const load = async () => {
    const res = await apiFetch<{ users: UserProfile[]; subscribers: SubscriberItem[] }>('/api/admin/users');
    setUsers(res.users || []);
    setSubscribers(res.subscribers || []);
  };

  useEffect(() => {
    load().catch(() => {});
  }, []);

  const exportCsv = async (entity: 'users' | 'subscribers') => {
    const token = await getAuthToken();
    const res = await fetch(`/api/admin/export/${entity}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexahome-${entity}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast(`Exported ${entity}.csv`);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Registered Accounts ({users.length})</h3>
          <button type="button" onClick={() => exportCsv('users')} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {users.map((u) => (
            <div key={u.id} className="p-4 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div>
                <p className="font-semibold text-[#0D1B2A]">
                  {u.name} <span className="font-normal text-slate-500">({u.role})</span>
                </p>
                <p className="text-slate-500">{u.email} {u.isBlocked ? '· Blocked' : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/admin/users/${u.id}`, { method: 'PATCH', body: JSON.stringify({ isBlocked: !u.isBlocked }) });
                      toast(u.isBlocked ? 'User unblocked.' : 'User blocked.');
                      load();
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Action failed', 'error');
                    }
                  }}
                  className="px-2.5 py-1.5 rounded border border-slate-300 hover:bg-slate-50 inline-flex items-center gap-1"
                >
                  {u.isBlocked ? <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> : <ShieldBan className="w-3.5 h-3.5 text-amber-600" />}
                  {u.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await apiFetch(`/api/admin/users/${u.id}`, { method: 'DELETE' });
                      toast('User removed.');
                      load();
                    } catch (err) {
                      toast(err instanceof Error ? err.message : 'Action failed', 'error');
                    }
                  }}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 overflow-hidden h-fit">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Subscribers ({subscribers.length})</h3>
          <button type="button" onClick={() => exportCsv('subscribers')} className="px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold inline-flex items-center gap-1">
            <Download className="w-3.5 h-3.5" /> CSV
          </button>
        </div>
        <div className="divide-y divide-slate-100">
          {subscribers.map((s) => (
            <div key={s.id} className="px-4 py-3 flex items-center justify-between text-xs">
              <span className="truncate text-slate-700">{s.email}</span>
              <button
                type="button"
                onClick={async () => {
                  await apiFetch(`/api/admin/subscribers/${s.id}`, { method: 'DELETE' });
                  toast('Subscriber removed.');
                  load();
                }}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// 6. SITE SETTINGS + ACTIVITY LOG + PASSWORD CHANGE
export const AdminSettingsSection: React.FC = () => {
  const { settings, refreshSettings, apiFetch, toast } = useApp();
  const [form, setForm] = useState<SiteSettingsData>(settings);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  useEffect(() => {
    apiFetch<{ items: ActivityLogItem[] }>('/api/admin/logs')
      .then((res) => setLogs(res.items || []))
      .catch(() => {});
  }, [apiFetch]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await apiFetch<{ message: string }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify({ settings: form }),
      });
      await refreshSettings();
      toast(res.message);
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save settings', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/api/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      setCurrentPassword('');
      setNewPassword('');
      toast('Admin password updated.');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Password change failed', 'error');
    }
  };

  const field = (label: string, key: keyof SiteSettingsData) => (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        value={form[key] || ''}
        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 p-6 space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="font-serif text-lg font-semibold text-[#0D1B2A]">Live Website Configuration</h3>
            <p className="text-xs text-slate-500">Edits publish immediately to the public NexaHome site.</p>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40]"
          >
            {saving ? 'Publishing...' : 'Save Live Settings'}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {field('Brand Name', 'brandName')}
          {field('Brand Subtitle', 'brandSubtitle')}
          {field('Custom Logo URL (optional)', 'logoUrl')}
          {field('Hero Kicker', 'heroKicker')}
          {field('Hero Headline', 'heroHeadline')}
          {field('Hero Subtitle', 'heroSubtitle')}
          {field('Banner 1 Title', 'banner1Title')}
          {field('Banner 1 Subtitle', 'banner1Subtitle')}
          {field('Banner 1 Button', 'banner1Cta')}
          {field('Banner 2 Title', 'banner2Title')}
          {field('Banner 2 Subtitle', 'banner2Subtitle')}
          {field('Banner 2 Button', 'banner2Cta')}
          {field('Stat 1 Value', 'stat1Value')}
          {field('Stat 1 Label', 'stat1Label')}
          {field('Stat 2 Value', 'stat2Value')}
          {field('Stat 2 Label', 'stat2Label')}
          {field('Stat 3 Value', 'stat3Value')}
          {field('Stat 3 Label', 'stat3Label')}
          {field('Stat 4 Value', 'stat4Value')}
          {field('Stat 4 Label', 'stat4Label')}
          {field('Why Choose Us Heading', 'whyTitle')}
          {field('Contact Phone', 'contactPhone')}
          {field('Contact Email', 'contactEmail')}
          {field('Office Hours', 'contactHours')}
          {field('Office Address', 'contactAddress')}
          {field('SEO Page Title', 'seoTitle')}
          {field('SEO Meta Description', 'seoDescription')}
        </div>
      </form>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5">
          <h3 className="font-serif text-base font-semibold text-[#0D1B2A] mb-3">Admin Activity Log</h3>
          <div className="divide-y divide-slate-100 max-h-80 overflow-y-auto text-xs">
            {logs.map((l) => (
              <div key={l.id} className="py-2.5 flex items-start justify-between gap-3">
                <div>
                  <span className="font-semibold text-[#0D1B2A]">{l.action}</span>{' '}
                  <span className="text-slate-500">({l.entityType})</span>
                  <p className="text-slate-600 mt-0.5">{l.details}</p>
                </div>
                <span className="text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                  {new Date(l.createdAt).toLocaleDateString()}
                </span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handlePasswordChange} className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-5 space-y-3.5 h-fit">
          <h3 className="font-serif text-base font-semibold text-[#0D1B2A]">Change Admin Password</h3>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Current password (leave blank if first time)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <input
            type="password"
            required
            minLength={8}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="New password (min 8 chars)"
            className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300"
          />
          <button type="submit" className="px-4 py-2 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold">
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
};
