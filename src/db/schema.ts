import {
  pgTable,
  serial,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  jsonb,
  doublePrecision,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  phone: text('phone'),
  avatarUrl: text('avatar_url'),
  passwordHash: text('password_hash'),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  isBlocked: boolean('is_blocked').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const categories = pgTable('categories', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  slug: text('slug').notNull().unique(),
  subtitle: text('subtitle').notNull(),
  imageUrl: text('image_url').notNull(),
  sortOrder: integer('sort_order').notNull().default(0),
});

export const cities = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull().unique(),
  province: text('province').notNull(),
  isFeatured: boolean('is_featured').notNull().default(true),
});

export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  title: text('title').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  city: text('city').notNull(),
  bio: text('bio').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  experienceYears: integer('experience_years').notNull().default(5),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const properties = pgTable('properties', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description').notNull(),
  purpose: text('purpose').notNull(), // 'sale' | 'rent'
  categoryId: integer('category_id').references(() => categories.id, { onDelete: 'set null' }),
  cityId: integer('city_id').references(() => cities.id, { onDelete: 'set null' }),
  agentId: integer('agent_id').references(() => agents.id, { onDelete: 'set null' }),
  submittedByUserId: integer('submitted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  location: text('location').notNull(),
  price: bigint('price', { mode: 'number' }).notNull(),
  bedrooms: integer('bedrooms').notNull().default(0),
  bathrooms: integer('bathrooms').notNull().default(0),
  areaValue: integer('area_value').notNull().default(0),
  areaLabel: text('area_label').notNull(),
  status: text('status').notNull().default('available'), // 'available' | 'sold' | 'rented'
  approvalStatus: text('approval_status').notNull().default('approved'), // 'pending' | 'approved' | 'rejected'
  isFeatured: boolean('is_featured').notNull().default(false),
  images: jsonb('images').$type<string[]>().notNull().default([]),
  amenities: jsonb('amenities').$type<string[]>().notNull().default([]),
  latitude: doublePrecision('latitude'),
  longitude: doublePrecision('longitude'),
  viewsCount: integer('views_count').notNull().default(0),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const wishlists = pgTable(
  'wishlists',
  {
    id: serial('id').primaryKey(),
    userId: integer('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    propertyId: integer('property_id')
      .references(() => properties.id, { onDelete: 'cascade' })
      .notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [uniqueIndex('wishlists_user_property_idx').on(table.userId, table.propertyId)]
);

export const projects = pgTable('projects', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  city: text('city').notNull(),
  location: text('location').notNull(),
  developer: text('developer').notNull(),
  startingPrice: bigint('starting_price', { mode: 'number' }).notNull(),
  expectedRoi: text('expected_roi').notNull(),
  completionDate: text('completion_date').notNull(),
  status: text('status').notNull().default('Under Construction'),
  description: text('description').notNull(),
  imageUrl: text('image_url').notNull(),
  highlights: jsonb('highlights').$type<string[]>().notNull().default([]),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const inquiries = pgTable('inquiries', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  type: text('type').notNull().default('property'), // 'property' | 'contact' | 'project'
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  subject: text('subject'),
  message: text('message').notNull(),
  status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'closed'
  adminReply: text('admin_reply'),
  repliedAt: timestamp('replied_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const visitRequests = pgTable('visit_requests', {
  id: serial('id').primaryKey(),
  propertyId: integer('property_id').references(() => properties.id, { onDelete: 'set null' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  preferredDate: text('preferred_date').notNull(),
  preferredTime: text('preferred_time').notNull(),
  notes: text('notes'),
  status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'closed'
  adminReply: text('admin_reply'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const consultations = pgTable('consultations', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name').notNull(),
  email: text('email').notNull(),
  phone: text('phone').notNull(),
  serviceType: text('service_type').notNull(),
  budgetRange: text('budget_range'),
  preferredDate: text('preferred_date').notNull(),
  message: text('message'),
  status: text('status').notNull().default('new'), // 'new' | 'contacted' | 'closed'
  adminReply: text('admin_reply'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const testimonials = pgTable('testimonials', {
  id: serial('id').primaryKey(),
  clientName: text('client_name').notNull(),
  clientRole: text('client_role').notNull().default('Verified Client'),
  rating: integer('rating').notNull().default(5),
  quote: text('quote').notNull(),
  avatarUrl: text('avatar_url').notNull(),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const blogPosts = pgTable('blog_posts', {
  id: serial('id').primaryKey(),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  category: text('category').notNull(),
  author: text('author').notNull(),
  excerpt: text('excerpt').notNull(),
  content: text('content').notNull(),
  coverImage: text('cover_image').notNull(),
  readTime: text('read_time').notNull().default('5 min read'),
  isPublished: boolean('is_published').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const subscribers = pgTable('subscribers', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const siteSettings = pgTable('site_settings', {
  id: serial('id').primaryKey(),
  key: text('key').notNull().unique(),
  value: jsonb('value').$type<Record<string, unknown>>().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  actorEmail: text('actor_email').notNull(),
  action: text('action').notNull(),
  entityType: text('entity_type').notNull(),
  entityId: text('entity_id'),
  details: text('details'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const propertiesRelations = relations(properties, ({ one }) => ({
  category: one(categories, {
    fields: [properties.categoryId],
    references: [categories.id],
  }),
  city: one(cities, {
    fields: [properties.cityId],
    references: [cities.id],
  }),
  agent: one(agents, {
    fields: [properties.agentId],
    references: [agents.id],
  }),
  submitter: one(users, {
    fields: [properties.submittedByUserId],
    references: [users.id],
  }),
}));
