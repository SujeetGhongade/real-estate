import React, { useEffect, useState, useCallback } from 'react';
import { SlidersHorizontal, RotateCcw, ChevronLeft, ChevronRight, Building2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PropertyCard } from '../components/UI';
import type { PropertyItem } from '../types';

export const ListingsPage: React.FC = () => {
  const { searchParams, categories, cities, navigate, apiFetch } = useApp();

  const [purpose, setPurpose] = useState(searchParams.get('purpose') || '');
  const [category, setCategory] = useState(searchParams.get('category') || '');
  const [city, setCity] = useState(searchParams.get('city') || '');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [minPrice, setMinPrice] = useState(searchParams.get('minPrice') || '');
  const [maxPrice, setMaxPrice] = useState(searchParams.get('maxPrice') || '');
  const [beds, setBeds] = useState(searchParams.get('beds') || '');
  const [minArea, setMinArea] = useState(searchParams.get('minArea') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page')) || 1);

  const [items, setItems] = useState<PropertyItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setPurpose(searchParams.get('purpose') || '');
    setCategory(searchParams.get('category') || '');
    setCity(searchParams.get('city') || '');
    setSearch(searchParams.get('search') || '');
    setMinPrice(searchParams.get('minPrice') || '');
    setMaxPrice(searchParams.get('maxPrice') || '');
    setBeds(searchParams.get('beds') || '');
    setMinArea(searchParams.get('minArea') || '');
    setSort(searchParams.get('sort') || 'newest');
    setPage(Number(searchParams.get('page')) || 1);
  }, [searchParams.toString()]);

  const fetchListings = useCallback(async () => {
    setLoading(true);
    try {
      const qs = new URLSearchParams();
      if (purpose) qs.set('purpose', purpose);
      if (category) qs.set('category', category);
      if (city) qs.set('city', city);
      if (search.trim()) qs.set('search', search.trim());
      if (minPrice) qs.set('minPrice', minPrice);
      if (maxPrice) qs.set('maxPrice', maxPrice);
      if (beds) qs.set('beds', beds);
      if (minArea) qs.set('minArea', minArea);
      if (sort) qs.set('sort', sort);
      qs.set('page', String(page));
      qs.set('limit', '9');

      const data = await apiFetch<{
        items: PropertyItem[];
        total: number;
        totalPages: number;
      }>(`/api/public/properties?${qs.toString()}`);

      setItems(data.items || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [apiFetch, beds, category, city, maxPrice, minArea, minPrice, page, purpose, search, sort]);

  useEffect(() => {
    fetchListings();
  }, [fetchListings]);

  const applyUrl = (overrides: Record<string, string | number> = {}) => {
    const next: Record<string, string> = {
      purpose,
      category,
      city,
      search,
      minPrice,
      maxPrice,
      beds,
      minArea,
      sort,
      page: '1',
    };
    Object.entries(overrides).forEach(([k, v]) => {
      next[k] = String(v);
    });
    const qs = new URLSearchParams();
    Object.entries(next).forEach(([k, v]) => {
      if (v && !(k === 'page' && v === '1') && !(k === 'sort' && v === 'newest')) {
        qs.set(k, v);
      }
    });
    navigate(`/listings${qs.toString() ? `?${qs.toString()}` : ''}`);
  };

  const resetFilters = () => {
    navigate('/listings');
  };

  const headingTitle =
    purpose === 'sale'
      ? 'Properties for Sale'
      : purpose === 'rent'
      ? 'Properties for Rent'
      : 'Explore Verified Properties';

  return (
    <div className="bg-[#F8F7F4] min-h-screen">
      {/* Page Header */}
      <div className="bg-[#0D1B2A] text-white py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-[#C49A5C] mb-2">NexaHome Directory</p>
            <h1 className="font-serif text-3xl sm:text-4xl font-semibold">{headingTitle}</h1>
            <p className="text-sm text-slate-300 mt-1.5 tabular-nums">
              {loading ? 'Loading listings...' : `${total} verified ${total === 1 ? 'property' : 'properties'} available`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {(
              [
                { value: '', label: 'All' },
                { value: 'sale', label: 'Buy' },
                { value: 'rent', label: 'Rent' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.label}
                type="button"
                onClick={() => applyUrl({ purpose: opt.value })}
                className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  purpose === opt.value
                    ? 'bg-white text-[#0D1B2A]'
                    : 'bg-white/10 text-slate-200 hover:bg-white/20'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-12 gap-7">
        {/* Filter Sidebar */}
        <aside className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-slate-200 p-5 sticky top-20 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h2 className="font-serif text-base font-semibold text-[#0D1B2A] flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#C49A5C]" />
                Filter Listings
              </h2>
              <button
                type="button"
                onClick={resetFilters}
                className="text-xs font-medium text-slate-500 hover:text-[#0D1B2A] inline-flex items-center gap-1"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Keyword / Area</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && applyUrl({ search })}
                placeholder="DHA, Clifton, Villa..."
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:border-[#0D1B2A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">City</label>
              <select
                value={city}
                onChange={(e) => applyUrl({ city: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0D1B2A]"
              >
                <option value="">All Cities</option>
                {cities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">Property Type</label>
              <select
                value={category}
                onChange={(e) => applyUrl({ category: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 bg-white focus:outline-none focus:border-[#0D1B2A]"
              >
                <option value="">All Types</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.slug}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Price (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  placeholder="0"
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0D1B2A]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Max Price (PKR)</label>
                <input
                  type="number"
                  min={0}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  placeholder="Any"
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 tabular-nums focus:outline-none focus:border-[#0D1B2A]"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Beds</label>
                <select
                  value={beds}
                  onChange={(e) => applyUrl({ beds: e.target.value })}
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 bg-white"
                >
                  <option value="">Any</option>
                  <option value="2">2+ Beds</option>
                  <option value="3">3+ Beds</option>
                  <option value="4">4+ Beds</option>
                  <option value="5">5+ Beds</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Min Area (sqft)</label>
                <input
                  type="number"
                  min={0}
                  value={minArea}
                  onChange={(e) => setMinArea(e.target.value)}
                  placeholder="e.g. 2000"
                  className="w-full px-2.5 py-2 text-sm rounded-lg border border-slate-300 tabular-nums"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => applyUrl({ search, minPrice, maxPrice, minArea })}
              className="w-full py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40] transition-colors"
            >
              Apply Filters
            </button>
          </div>
        </aside>

        {/* Results Column */}
        <div className="lg:col-span-9">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-5 bg-white px-4 py-3 rounded-xl border border-slate-200">
            <p className="text-xs sm:text-sm text-slate-600 tabular-nums">
              Showing <strong className="text-[#0D1B2A]">{items.length}</strong> of{' '}
              <strong className="text-[#0D1B2A]">{total}</strong> results
            </p>
            <div className="flex items-center gap-2">
              <label htmlFor="sort-select" className="text-xs font-medium text-slate-500">
                Sort by
              </label>
              <select
                id="sort-select"
                value={sort}
                onChange={(e) => applyUrl({ sort: e.target.value })}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-300 bg-white text-[#0D1B2A]"
              >
                <option value="newest">Newest Listed</option>
                <option value="featured">Featured First</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="area_desc">Largest Area</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <div key={n} className="bg-white rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-slate-200" />
                  <div className="p-4 space-y-2.5">
                    <div className="h-4 bg-slate-200 rounded w-3/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                    <div className="h-4 bg-slate-200 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : items.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <h3 className="font-serif text-xl font-semibold text-[#0D1B2A]">No matching properties found</h3>
              <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
                Try broadening your price range, clearing the bedroom filter, or exploring listings in Lahore, Karachi, and Islamabad.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-5 px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40]"
              >
                Reset All Filters
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {items.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => applyUrl({ page: page - 1 })}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0D1B2A] disabled:opacity-40 flex items-center gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Prev
                  </button>
                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const pNum = idx + 1;
                    return (
                      <button
                        key={pNum}
                        type="button"
                        onClick={() => applyUrl({ page: pNum })}
                        className={`w-9 h-9 rounded-lg text-xs font-semibold tabular-nums ${
                          pNum === page
                            ? 'bg-[#0D1B2A] text-white'
                            : 'bg-white border border-slate-300 text-[#0D1B2A] hover:bg-slate-50'
                        }`}
                      >
                        {pNum}
                      </button>
                    );
                  })}
                  <button
                    type="button"
                    disabled={page >= totalPages}
                    onClick={() => applyUrl({ page: page + 1 })}
                    className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-xs font-semibold text-[#0D1B2A] disabled:opacity-40 flex items-center gap-1"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
