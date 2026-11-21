export const IMAGES = {
  hero: '/src/assets/images/hero_luxury_residence_1795251286450.jpg',
  modernHouse: '/src/assets/images/prop_modern_house_1795251277008.jpg',
  luxuryApartment: '/src/assets/images/prop_luxury_apartment_1795251287545.jpg',
  elegantVilla: '/src/assets/images/prop_elegant_villa_1795251274109.jpg',
  primeCommercial: '/src/assets/images/prop_prime_commercial_1795251286551.jpg',
  penthouseSuite: '/src/assets/images/prop_penthouse_suite_1795251286451.jpg',
  gardenBungalow: '/src/assets/images/prop_garden_bungalow_1795251288017.jpg',
  bannerDream: '/src/assets/images/banner_dream_home_1795251288770.jpg',
  bannerInvest: '/src/assets/images/banner_skyline_invest_1795251286557.jpg',
  agentMale: '/src/assets/images/agent_portrait_male_1795251277037.jpg',
  agentFemale: '/src/assets/images/agent_portrait_female_1795251275928.jpg',
} as const;

export interface SiteSettingsData {
  brandName: string;
  brandSubtitle: string;
  logoUrl: string;
  heroKicker: string;
  heroHeadline: string;
  heroSubtitle: string;
  heroImage: string;
  banner1Title: string;
  banner1Subtitle: string;
  banner1Cta: string;
  banner1Image: string;
  banner2Title: string;
  banner2Subtitle: string;
  banner2Cta: string;
  banner2Image: string;
  stat1Value: string;
  stat1Label: string;
  stat2Value: string;
  stat2Label: string;
  stat3Value: string;
  stat3Label: string;
  stat4Value: string;
  stat4Label: string;
  whyTitle: string;
  whyBody: string;
  whyImage: string;
  whyAccentPhrase: string;
  contactPhone: string;
  contactEmail: string;
  contactAddress: string;
  contactHours: string;
  socialFacebook: string;
  socialInstagram: string;
  socialLinkedin: string;
  socialYoutube: string;
  seoTitle: string;
  seoDescription: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettingsData = {
  brandName: 'NEXAHOME',
  brandSubtitle: 'REAL ESTATE',
  logoUrl: '',
  heroKicker: 'Find a Better Tomorrow',
  heroHeadline: 'More Than Properties',
  heroSubtitle: 'We help you find a place to call home — with trust, transparency, and expertise.',
  heroImage: IMAGES.hero,
  banner1Title: 'A Home for Every Dream',
  banner1Subtitle: 'From modern apartments to luxurious villas, we help you find the perfect space.',
  banner1Cta: 'Explore Properties',
  banner1Image: IMAGES.bannerDream,
  banner2Title: 'Invest in A Brighter Tomorrow',
  banner2Subtitle: 'Discover high-return investment opportunities in prime locations.',
  banner2Cta: 'View Investment Options',
  banner2Image: IMAGES.bannerInvest,
  stat1Value: '1,200+',
  stat1Label: 'Properties Listed',
  stat2Value: '500+',
  stat2Label: 'Happy Clients',
  stat3Value: '10+',
  stat3Label: 'Years of Experience',
  stat4Value: '25+',
  stat4Label: 'Prime Locations',
  whyTitle: 'Why Choose NexaHome?',
  whyBody:
    "We're more than just a real estate company — we're your trusted partner in finding the right property. With verified listings, expert guidance, and a client-first approach, we make your property journey simple and rewarding.",
  whyImage: IMAGES.bannerDream,
  whyAccentPhrase: 'Good Spaces, Brighter Lives',
  contactPhone: '+92 300 123 4567',
  contactEmail: 'hello@nexahome.pk',
  contactAddress: '123 Main Boulevard, Gulberg III, Lahore, Pakistan',
  contactHours: 'Mon - Sat: 9:00 AM - 6:00 PM',
  socialFacebook: 'https://facebook.com',
  socialInstagram: 'https://instagram.com',
  socialLinkedin: 'https://linkedin.com',
  socialYoutube: 'https://youtube.com',
  seoTitle: 'NexaHome Real Estate — More Than Properties',
  seoDescription:
    'Explore verified houses, apartments, villas, commercial spaces, and prime investment projects across Lahore, Karachi, and Islamabad.',
};

export function formatPKR(amount: number, purpose?: string): string {
  const formatted = `PKR ${Number(amount || 0).toLocaleString('en-US')}`;
  return purpose === 'rent' ? `${formatted} / month` : formatted;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
