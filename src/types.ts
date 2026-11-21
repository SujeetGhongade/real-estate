export interface CategoryItem {
  id: number;
  name: string;
  slug: string;
  subtitle: string;
  imageUrl: string;
  sortOrder: number;
}

export interface CityItem {
  id: number;
  name: string;
  province: string;
  isFeatured: boolean;
}

export interface AgentItem {
  id: number;
  name: string;
  title: string;
  email: string;
  phone: string;
  city: string;
  bio: string;
  avatarUrl: string;
  experienceYears: number;
}

export interface PropertyItem {
  id: number;
  title: string;
  slug: string;
  description: string;
  purpose: 'sale' | 'rent';
  categoryId: number | null;
  cityId: number | null;
  agentId: number | null;
  submittedByUserId: number | null;
  location: string;
  price: number;
  bedrooms: number;
  bathrooms: number;
  areaValue: number;
  areaLabel: string;
  status: 'available' | 'sold' | 'rented';
  approvalStatus: 'pending' | 'approved' | 'rejected';
  isFeatured: boolean;
  images: string[];
  amenities: string[];
  latitude: number | null;
  longitude: number | null;
  viewsCount: number;
  createdAt: string;
  category?: CategoryItem | null;
  city?: CityItem | null;
  agent?: AgentItem | null;
}

export interface ProjectItem {
  id: number;
  title: string;
  slug: string;
  city: string;
  location: string;
  developer: string;
  startingPrice: number;
  expectedRoi: string;
  completionDate: string;
  status: string;
  description: string;
  imageUrl: string;
  highlights: string[];
  createdAt: string;
}

export interface TestimonialItem {
  id: number;
  clientName: string;
  clientRole: string;
  rating: number;
  quote: string;
  avatarUrl: string;
  isActive: boolean;
}

export interface BlogPostItem {
  id: number;
  title: string;
  slug: string;
  category: string;
  author: string;
  excerpt: string;
  content: string;
  coverImage: string;
  readTime: string;
  isPublished: boolean;
  createdAt: string;
}

export interface UserProfile {
  id: number;
  uid: string;
  email: string;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  role: 'user' | 'admin';
  isBlocked?: boolean;
  createdAt?: string;
}

export interface InquiryItem {
  id: number;
  propertyId: number | null;
  propertyTitle?: string | null;
  type: string;
  name: string;
  email: string;
  phone: string;
  subject: string | null;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  adminReply: string | null;
  repliedAt: string | null;
  createdAt: string;
}

export interface VisitRequestItem {
  id: number;
  propertyId: number | null;
  propertyTitle?: string | null;
  propertyLocation?: string | null;
  name: string;
  email: string;
  phone: string;
  preferredDate: string;
  preferredTime: string;
  notes: string | null;
  status: 'new' | 'contacted' | 'closed';
  adminReply: string | null;
  createdAt: string;
}

export interface ConsultationItem {
  id: number;
  name: string;
  email: string;
  phone: string;
  serviceType: string;
  budgetRange: string | null;
  preferredDate: string;
  message: string | null;
  status: 'new' | 'contacted' | 'closed';
  adminReply: string | null;
  createdAt: string;
}

export interface SubscriberItem {
  id: number;
  email: string;
  createdAt: string;
}

export interface ActivityLogItem {
  id: number;
  actorEmail: string;
  action: string;
  entityType: string;
  entityId: string | null;
  details: string | null;
  createdAt: string;
}
