import React, { useEffect, useState } from 'react';
import {
  Search,
  MapPin,
  Home,
  CircleDollarSign,
  ShieldCheck,
  BadgeCheck,
  Users,
  Headphones,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Star,
  Building2,
  Award,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { PropertyCard, SafeImage } from '../components/UI';
import type { PropertyItem, TestimonialItem } from '../types';

export const HomePage: React.FC = () => {
  const { settings, categories, cities, navigate, apiFetch } = useApp();
  const [heroTab, setHeroTab] = useState<'sale' | 'rent' | 'projects'>('sale');
  const [locationInput, setLocationInput] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [priceRange, setPriceRange] = useState('');

  const [featuredProperties, setFeaturedProperties] = useState<PropertyItem[]>([]);
  const [testimonials, setTestimonials] = useState<TestimonialItem[]>([]);
  const [testimonialIdx, setTestimonialIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([
      apiFetch<{ items: PropertyItem[] }>('/api/public/properties?featured=true&limit=4'),
      apiFetch<{ items: TestimonialItem[] }>('/api/public/testimonials'),
    ])
      .then(([propsRes, testRes]) => {
        if (!active) return;
        setFeaturedProperties(propsRes.items || []);
        setTestimonials(testRes.items || []);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [apiFetch]);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (heroTab === 'projects') {
      const p = new URLSearchParams();
      if (locationInput.trim()) p.set('city', locationInput.trim());
      navigate(`/projects${p.toString() ? `?${p.toString()}` : ''}`);
      return;
    }

    const params = new URLSearchParams();
    params.set('purpose', heroTab);
    if (locationInput.trim()) {
      const matchedCity = cities.find((c) => c.name.toLowerCase() === locationInput.trim().toLowerCase());
      if (matchedCity) params.set('city', matchedCity.name);
      else params.set('search', locationInput.trim());
    }
    if (selectedCategory) params.set('category', selectedCategory);
    if (priceRange) {
      const [min, max] = priceRange.split('-');
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }
    navigate(`/listings?${params.toString()}`);
  };

  const currentTestimonial = testimonials[testimonialIdx] || null;
  const prevTestimonial = () => {
    if (testimonials.length === 0) return;
    setTestimonialIdx((i) => (i === 0 ? testimonials.length - 1 : i - 1));
  };
  const nextTestimonial = () => {
    if (testimonials.length === 0) return;
    setTestimonialIdx((i) => (i + 1) % testimonials.length);
  };

  return (
    <div className="bg-white">
      {/* 1. HERO SECTION */}
      <section className="relative overflow-hidden bg-[#0D1B2A]">
        <div className="absolute inset-0">
          <SafeImage
            src={settings.heroImage}
            alt="Luxury architectural residence at twilight"
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0A1522]/90 via-[#0D1B2A]/68 to-[#0A1522]/30" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0A1522]/85 via-transparent to-[#0A1522]/25" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-10 lg:pt-24 lg:pb-12">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8">
            <div className="max-w-2xl">
              <p className="text-xs sm:text-sm font-medium tracking-[0.22em] uppercase text-[#E5DEC9] mb-3">
                {settings.heroKicker}
              </p>
              <h1
                className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold text-white leading-[1.08] tracking-tight"
                style={{ textWrap: 'balance' }}
              >
                {settings.heroHeadline}
              </h1>
              <p className="mt-4 text-base sm:text-lg text-slate-200 max-w-xl leading-relaxed">
                {settings.heroSubtitle}
              </p>
            </div>

            <div className="hidden lg:flex flex-col items-end text-right pt-4 max-w-[220px]">
              <p className="font-serif italic text-xl text-white/90 leading-snug">
                Your Next Chapter Starts Here
              </p>
              <p className="mt-20 font-serif italic text-base text-[#E5DEC9]/90 leading-snug">
                Live Better. Invest Smarter.
              </p>
            </div>
          </div>

          {/* Search Card */}
          <div className="mt-8 max-w-4xl">
            <div className="inline-flex rounded-t-xl overflow-hidden bg-[#0D1B2A]/85 backdrop-blur-sm border border-white/15 border-b-0">
              {(
                [
                  { id: 'sale', label: 'Buy' },
                  { id: 'rent', label: 'Rent' },
                  { id: 'projects', label: 'Projects' },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setHeroTab(tab.id);
                    setPriceRange('');
                  }}
                  className={`px-6 py-2.5 text-sm font-semibold transition-colors whitespace-nowrap ${
                    heroTab === tab.id
                      ? 'bg-white text-[#0D1B2A]'
                      : 'text-slate-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <form
              onSubmit={handleHeroSearch}
              className="bg-white rounded-b-xl rounded-tr-xl shadow-2xl p-3 sm:p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center"
            >
              <div className="lg:col-span-4 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 focus-within:border-[#0D1B2A]">
                <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="hero-loc" className="block text-[11px] font-semibold text-slate-500">
                    Location
                  </label>
                  <input
                    id="hero-loc"
                    list="city-suggestions"
                    value={locationInput}
                    onChange={(e) => setLocationInput(e.target.value)}
                    placeholder="Enter city or area"
                    className="w-full text-sm text-[#0D1B2A] placeholder:text-slate-400 focus:outline-none bg-transparent"
                  />
                  <datalist id="city-suggestions">
                    {cities.map((c) => (
                      <option key={c.id} value={c.name} />
                    ))}
                    <option value="DHA Phase 6, Lahore" />
                    <option value="Clifton, Karachi" />
                    <option value="Sector F-7, Islamabad" />
                  </datalist>
                </div>
              </div>

              <div className="lg:col-span-3 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 focus-within:border-[#0D1B2A]">
                <Home className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="hero-type" className="block text-[11px] font-semibold text-slate-500">
                    Property Type
                  </label>
                  <select
                    id="hero-type"
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    disabled={heroTab === 'projects'}
                    className="w-full text-sm text-[#0D1B2A] bg-transparent focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Any type</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-3 flex items-center gap-2.5 px-3 py-2 rounded-lg border border-slate-200 focus-within:border-[#0D1B2A]">
                <CircleDollarSign className="w-4 h-4 text-slate-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <label htmlFor="hero-price" className="block text-[11px] font-semibold text-slate-500">
                    Price Range
                  </label>
                  <select
                    id="hero-price"
                    value={priceRange}
                    onChange={(e) => setPriceRange(e.target.value)}
                    disabled={heroTab === 'projects'}
                    className="w-full text-sm text-[#0D1B2A] bg-transparent focus:outline-none disabled:opacity-50"
                  >
                    <option value="">Any range</option>
                    {heroTab === 'rent' ? (
                      <>
                        <option value="0-150000">Up to PKR 150,000 / mo</option>
                        <option value="150000-300000">PKR 150,000 – 300,000</option>
                        <option value="300000-">PKR 300,000+</option>
                      </>
                    ) : (
                      <>
                        <option value="0-50000000">Up to PKR 50M</option>
                        <option value="50000000-100000000">PKR 50M – 100M</option>
                        <option value="100000000-">PKR 100M+</option>
                      </>
                    )}
                  </select>
                </div>
              </div>

              <div className="lg:col-span-2">
                <button
                  type="submit"
                  className="w-full h-12 px-5 rounded-lg bg-[#0D1B2A] text-white text-sm font-semibold hover:bg-[#162A40] transition-colors flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  <Search className="w-4 h-4" />
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Hero Bottom Trust Bar */}
        <div className="relative border-t border-white/15 bg-[#0A1522]/75 backdrop-blur-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: ShieldCheck, title: 'Trusted Listings', desc: 'Title & deed checked' },
              { icon: BadgeCheck, title: 'Verified Properties', desc: 'On-site inspection' },
              { icon: Users, title: 'Expert Agents', desc: 'City-level advisors' },
              { icon: Headphones, title: 'Dedicated Support', desc: 'End-to-end closing' },
            ].map((item) => (
              <div key={item.title} className="flex items-center gap-3 text-white">
                <item.icon className="w-5 h-5 text-[#C49A5C] shrink-0" />
                <div>
                  <p className="text-xs sm:text-sm font-semibold leading-tight">{item.title}</p>
                  <p className="text-[11px] text-slate-300">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 2. CATEGORY CARDS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {categories.slice(0, 4).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => navigate(`/listings?category=${encodeURIComponent(cat.slug)}`)}
              className="group text-left bg-white rounded-xl border border-slate-200/90 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="aspect-[16/10] overflow-hidden bg-slate-100">
                <SafeImage
                  src={cat.imageUrl}
                  alt={cat.name}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="font-serif text-base font-semibold text-[#0D1B2A]">{cat.name}</h2>
                  <p className="text-xs text-slate-500 mt-0.5">{cat.subtitle}</p>
                </div>
                <span className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-[#0D1B2A] group-hover:bg-[#0D1B2A] group-hover:text-white group-hover:border-[#0D1B2A] transition-colors shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* 3. FEATURED PROPERTIES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="flex items-end justify-between gap-4 mb-6">
          <div>
            <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0D1B2A]">
              Featured Properties
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Handpicked residences and prime commercial addresses across Pakistan.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('/listings')}
            className="text-sm font-semibold text-[#0D1B2A] hover:text-[#A87E43] inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-colors"
          >
            View All Properties
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="rounded-xl border border-slate-200 overflow-hidden animate-pulse">
                <div className="aspect-[4/3] bg-slate-200" />
                <div className="p-4 space-y-2.5">
                  <div className="h-4 bg-slate-200 rounded w-3/4" />
                  <div className="h-3 bg-slate-100 rounded w-1/2" />
                  <div className="h-4 bg-slate-200 rounded w-2/3 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {featuredProperties.map((prop) => (
              <PropertyCard key={prop.id} property={prop} />
            ))}
          </div>
        )}
      </section>

      {/* 4. TWO PROMO BANNERS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Warm Banner */}
          <div className="lg:col-span-7 relative rounded-2xl overflow-hidden bg-[#F1EDE5] border border-[#E5DEC9] min-h-[260px] grid grid-cols-1 sm:grid-cols-12 items-stretch">
            <div className="sm:col-span-5 relative min-h-[180px]">
              <SafeImage
                src={settings.banner1Image}
                alt={settings.banner1Title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="sm:col-span-7 p-7 sm:p-8 flex flex-col justify-center">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0D1B2A] leading-tight">
                {settings.banner1Title}
              </h2>
              <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                {settings.banner1Subtitle}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/listings')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40] transition-colors whitespace-nowrap"
                >
                  {settings.banner1Cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Right Dark Navy Banner */}
          <div className="lg:col-span-5 relative rounded-2xl overflow-hidden bg-[#0D1B2A] min-h-[260px] flex flex-col justify-center p-7 sm:p-8">
            <div className="absolute inset-0">
              <SafeImage
                src={settings.banner2Image}
                alt={settings.banner2Title}
                className="w-full h-full object-cover opacity-45"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#0D1B2A]/95 via-[#0D1B2A]/75 to-[#0D1B2A]/35" />
            </div>
            <div className="relative z-10 max-w-xs">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-white leading-tight">
                {settings.banner2Title}
              </h2>
              <p className="mt-3 text-sm text-slate-200 leading-relaxed">
                {settings.banner2Subtitle}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/projects')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-white text-[#0D1B2A] text-xs font-semibold hover:bg-slate-100 transition-colors whitespace-nowrap"
                >
                  {settings.banner2Cta}
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. STATS STRIP */}
      <section className="border-y border-slate-200 bg-[#F8F7F4]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-9 grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Building2, value: settings.stat1Value, label: settings.stat1Label },
            { icon: Users, value: settings.stat2Value, label: settings.stat2Label },
            { icon: Award, value: settings.stat3Value, label: settings.stat3Label },
            { icon: MapPin, value: settings.stat4Value, label: settings.stat4Label },
          ].map((st) => (
            <div key={st.label} className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0D1B2A] shrink-0">
                <st.icon className="w-5 h-5 text-[#A87E43]" />
              </div>
              <div>
                <p className="font-serif text-2xl font-bold text-[#0D1B2A] tabular-nums leading-none">
                  {st.value}
                </p>
                <p className="text-xs text-slate-500 mt-1">{st.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 6. WHY CHOOSE US + TESTIMONIALS SLIDER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Why Choose Us */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            <div className="sm:col-span-7 space-y-4">
              <h2 className="font-serif text-2xl sm:text-3xl font-semibold text-[#0D1B2A]">
                {settings.whyTitle}
              </h2>
              <p className="text-sm text-slate-600 leading-relaxed">
                {settings.whyBody}
              </p>
              <div className="pt-2 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => navigate('/about')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0D1B2A] text-white text-xs font-semibold hover:bg-[#162A40] transition-colors"
                >
                  Learn More About Us
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => navigate('/services')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-300 text-[#0D1B2A] text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  Book a Consultation
                </button>
              </div>
            </div>
            <div className="sm:col-span-5">
              <p className="font-serif italic text-lg text-[#0D1B2A] mb-3 leading-snug">
                {settings.whyAccentPhrase}
              </p>
              <div className="aspect-[4/3] rounded-xl overflow-hidden border border-slate-200">
                <SafeImage
                  src={settings.whyImage}
                  alt={settings.whyAccentPhrase}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>

          {/* Testimonials Slider */}
          <div className="lg:col-span-5 bg-[#F8F7F4] rounded-2xl border border-slate-200/90 p-6 sm:p-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#0D1B2A]">
                What Our Clients Say
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={prevTestimonial}
                  aria-label="Previous testimonial"
                  className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextTestimonial}
                  aria-label="Next testimonial"
                  className="w-8 h-8 rounded-full border border-slate-300 bg-white flex items-center justify-center text-[#0D1B2A] hover:bg-[#0D1B2A] hover:text-white transition-colors"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {currentTestimonial ? (
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-sm shrink-0">
                  <SafeImage
                    src={currentTestimonial.avatarUrl}
                    alt={currentTestimonial.clientName}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-0.5 mb-2">
                    {Array.from({ length: currentTestimonial.rating || 5 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-[#C49A5C] text-[#C49A5C]" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed italic">
                    &ldquo;{currentTestimonial.quote}&rdquo;
                  </p>
                  <div className="mt-3">
                    <p className="text-sm font-semibold text-[#0D1B2A]">
                      {currentTestimonial.clientName}
                    </p>
                    <p className="text-xs text-slate-500">{currentTestimonial.clientRole}</p>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Client stories will appear here shortly.</p>
            )}

            {testimonials.length > 1 && (
              <div className="mt-5 pt-4 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500 tabular-nums">
                <span>
                  Review {testimonialIdx + 1} of {testimonials.length}
                </span>
                <div className="flex items-center gap-1.5">
                  {testimonials.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      aria-label={`View review ${i + 1}`}
                      onClick={() => setTestimonialIdx(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        i === testimonialIdx ? 'w-5 bg-[#0D1B2A]' : 'w-1.5 bg-slate-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
