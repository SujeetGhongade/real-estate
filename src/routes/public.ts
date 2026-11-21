import { Router } from 'express';
import { eq, and, ilike, gte, lte, desc, asc, sql, or } from 'drizzle-orm';
import { db } from '../db/index.ts';
import {
  properties,
  categories,
  cities,
  agents,
  projects,
  testimonials,
  blogPosts,
  inquiries,
  visitRequests,
  consultations,
  subscribers,
  siteSettings,
} from '../db/schema.ts';
import { DEFAULT_SITE_SETTINGS } from '../lib/constants.ts';
import { optionalAuth, type AuthRequest } from '../middleware/auth.ts';
import { isValidEmail } from '../lib/security.ts';

const router = Router();

// Public site settings
router.get('/settings', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(siteSettings)
      .where(eq(siteSettings.key, 'main'))
      .limit(1);
    const merged = {
      ...DEFAULT_SITE_SETTINGS,
      ...(rows[0]?.value || {}),
    };
    res.json({ settings: merged });
  } catch (error) {
    console.error('Failed to fetch site settings:', error);
    res.json({ settings: DEFAULT_SITE_SETTINGS });
  }
});

// Categories & Cities & Agents metadata
router.get('/meta', async (_req, res) => {
  try {
    const [allCategories, allCities, allAgents] = await Promise.all([
      db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id)),
      db.select().from(cities).orderBy(asc(cities.name)),
      db.select().from(agents).orderBy(asc(agents.id)),
    ]);
    res.json({ categories: allCategories, cities: allCities, agents: allAgents });
  } catch (error) {
    console.error('Failed to load catalog metadata:', error);
    res.status(500).json({ error: 'Unable to load categories and locations.' });
  }
});

// Listings with filtering, sorting, and pagination
router.get('/properties', async (req, res) => {
  try {
    const purpose = typeof req.query.purpose === 'string' ? req.query.purpose.trim() : '';
    const categorySlug = typeof req.query.category === 'string' ? req.query.category.trim() : '';
    const cityName = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
    const featured = req.query.featured === 'true';
    const minPrice = Number(req.query.minPrice) || 0;
    const maxPrice = Number(req.query.maxPrice) || 0;
    const minBeds = Number(req.query.beds) || 0;
    const minArea = Number(req.query.minArea) || 0;
    const sort = typeof req.query.sort === 'string' ? req.query.sort : 'newest';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 9));
    const offset = (page - 1) * limit;

    const conditions = [eq(properties.approvalStatus, 'approved')];

    if (purpose === 'sale' || purpose === 'rent') {
      conditions.push(eq(properties.purpose, purpose));
    }
    if (featured) {
      conditions.push(eq(properties.isFeatured, true));
    }
    if (minPrice > 0) {
      conditions.push(gte(properties.price, minPrice));
    }
    if (maxPrice > 0) {
      conditions.push(lte(properties.price, maxPrice));
    }
    if (minBeds > 0) {
      conditions.push(gte(properties.bedrooms, minBeds));
    }
    if (minArea > 0) {
      conditions.push(gte(properties.areaValue, minArea));
    }
    if (categorySlug) {
      const cat = await db.select().from(categories).where(eq(categories.slug, categorySlug)).limit(1);
      if (cat.length > 0) {
        conditions.push(eq(properties.categoryId, cat[0].id));
      } else {
        return res.json({ items: [], total: 0, page, totalPages: 1 });
      }
    }
    if (cityName) {
      const cityRows = await db.select().from(cities).where(ilike(cities.name, cityName)).limit(1);
      if (cityRows.length > 0) {
        conditions.push(eq(properties.cityId, cityRows[0].id));
      } else {
        conditions.push(ilike(properties.location, `%${cityName}%`));
      }
    }
    if (search) {
      const pattern = `%${search}%`;
      conditions.push(
        or(
          ilike(properties.title, pattern),
          ilike(properties.location, pattern),
          ilike(properties.description, pattern)
        )!
      );
    }

    let orderByClause = desc(properties.createdAt);
    if (sort === 'price_asc') orderByClause = asc(properties.price);
    else if (sort === 'price_desc') orderByClause = desc(properties.price);
    else if (sort === 'area_desc') orderByClause = desc(properties.areaValue);
    else if (sort === 'featured') orderByClause = desc(properties.isFeatured);

    const whereClause = and(...conditions);

    const [rows, countResult, allCats, allCities, allAgents] = await Promise.all([
      db.select().from(properties).where(whereClause).orderBy(orderByClause, desc(properties.id)).limit(limit).offset(offset),
      db.select({ count: sql<number>`count(*)::int` }).from(properties).where(whereClause),
      db.select().from(categories),
      db.select().from(cities),
      db.select().from(agents),
    ]);

    const catMap = new Map(allCats.map((c) => [c.id, c]));
    const cityMap = new Map(allCities.map((c) => [c.id, c]));
    const agentMap = new Map(allAgents.map((a) => [a.id, a]));

    const items = rows.map((p) => ({
      ...p,
      category: p.categoryId ? catMap.get(p.categoryId) || null : null,
      city: p.cityId ? cityMap.get(p.cityId) || null : null,
      agent: p.agentId ? agentMap.get(p.agentId) || null : null,
    }));

    const total = countResult[0]?.count || 0;
    res.json({
      items,
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error('Failed to fetch properties:', error);
    res.status(500).json({ error: 'Unable to load properties right now.' });
  }
});

// Single property detail by id or slug
router.get('/properties/:idOrSlug', async (req, res) => {
  try {
    const param = req.params.idOrSlug;
    const isNumeric = /^\d+$/.test(param);

    const rows = await db
      .select()
      .from(properties)
      .where(isNumeric ? eq(properties.id, Number(param)) : eq(properties.slug, param))
      .limit(1);

    if (!rows.length) {
      return res.status(404).json({ error: 'Property not found.' });
    }

    const prop = rows[0];
    // Increment views count non-blockingly
    db.update(properties)
      .set({ viewsCount: (prop.viewsCount || 0) + 1 })
      .where(eq(properties.id, prop.id))
      .catch(() => {});

    const [catRows, cityRows, agentRows, similarRows] = await Promise.all([
      prop.categoryId ? db.select().from(categories).where(eq(categories.id, prop.categoryId)).limit(1) : Promise.resolve([]),
      prop.cityId ? db.select().from(cities).where(eq(cities.id, prop.cityId)).limit(1) : Promise.resolve([]),
      prop.agentId ? db.select().from(agents).where(eq(agents.id, prop.agentId)).limit(1) : Promise.resolve([]),
      db
        .select()
        .from(properties)
        .where(and(eq(properties.approvalStatus, 'approved'), eq(properties.purpose, prop.purpose)))
        .orderBy(desc(properties.isFeatured), desc(properties.createdAt))
        .limit(5),
    ]);

    res.json({
      property: {
        ...prop,
        category: catRows[0] || null,
        city: cityRows[0] || null,
        agent: agentRows[0] || null,
      },
      similar: similarRows.filter((s) => s.id !== prop.id).slice(0, 3),
    });
  } catch (error) {
    console.error('Failed to fetch property detail:', error);
    res.status(500).json({ error: 'Unable to load property details.' });
  }
});

// Projects
router.get('/projects', async (req, res) => {
  try {
    const city = typeof req.query.city === 'string' ? req.query.city.trim() : '';
    const rows = city
      ? await db.select().from(projects).where(ilike(projects.city, city)).orderBy(desc(projects.createdAt))
      : await db.select().from(projects).orderBy(desc(projects.createdAt));
    res.json({ items: rows });
  } catch (error) {
    console.error('Failed to load projects:', error);
    res.status(500).json({ error: 'Unable to load investment projects.' });
  }
});

// Active testimonials
router.get('/testimonials', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(testimonials)
      .where(eq(testimonials.isActive, true))
      .orderBy(asc(testimonials.id));
    res.json({ items: rows });
  } catch (error) {
    console.error('Failed to load testimonials:', error);
    res.status(500).json({ error: 'Unable to load testimonials.' });
  }
});

// Blog posts list & detail
router.get('/blog', async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.isPublished, true))
      .orderBy(desc(blogPosts.createdAt));
    res.json({ items: rows });
  } catch (error) {
    console.error('Failed to load blog posts:', error);
    res.status(500).json({ error: 'Unable to load articles.' });
  }
});

router.get('/blog/:slug', async (req, res) => {
  try {
    const rows = await db
      .select()
      .from(blogPosts)
      .where(eq(blogPosts.slug, req.params.slug))
      .limit(1);
    if (!rows.length) {
      return res.status(404).json({ error: 'Article not found.' });
    }
    res.json({ post: rows[0] });
  } catch (error) {
    console.error('Failed to load blog post:', error);
    res.status(500).json({ error: 'Unable to load article.' });
  }
});

// Submit Inquiry (property, project, or general contact)
router.post('/inquiries', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const subject = String(req.body?.subject || '').trim();
    const message = String(req.body?.message || '').trim();
    const type = ['property', 'contact', 'project'].includes(req.body?.type) ? req.body.type : 'property';
    const propertyId = req.body?.propertyId ? Number(req.body.propertyId) : null;

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (phone.length < 7) return res.status(400).json({ error: 'Please enter a valid phone number.' });
    if (message.length < 5) return res.status(400).json({ error: 'Please enter a message.' });

    const inserted = await db
      .insert(inquiries)
      .values({
        propertyId,
        userId: req.authUser?.id || null,
        type,
        name,
        email,
        phone,
        subject: subject || 'General Inquiry',
        message,
        status: 'new',
      })
      .returning();

    res.status(201).json({ inquiry: inserted[0], message: 'Your inquiry has been submitted. Our advisor will reach out shortly.' });
  } catch (error) {
    console.error('Inquiry submission failed:', error);
    res.status(500).json({ error: 'Could not submit inquiry. Please try again.' });
  }
});

// Schedule Property Visit
router.post('/visits', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const propertyId = req.body?.propertyId ? Number(req.body.propertyId) : null;
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const preferredDate = String(req.body?.preferredDate || '').trim();
    const preferredTime = String(req.body?.preferredTime || '').trim();
    const notes = String(req.body?.notes || '').trim();

    if (!propertyId) return res.status(400).json({ error: 'Property reference is required.' });
    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (phone.length < 7) return res.status(400).json({ error: 'Please enter a valid phone number.' });
    if (!preferredDate || !preferredTime) return res.status(400).json({ error: 'Please select a preferred date and time.' });

    const inserted = await db
      .insert(visitRequests)
      .values({
        propertyId,
        userId: req.authUser?.id || null,
        name,
        email,
        phone,
        preferredDate,
        preferredTime,
        notes: notes || null,
        status: 'new',
      })
      .returning();

    res.status(201).json({ visit: inserted[0], message: 'Property visit scheduled! Our agent will confirm your appointment.' });
  } catch (error) {
    console.error('Visit request failed:', error);
    res.status(500).json({ error: 'Could not schedule visit. Please try again.' });
  }
});

// Book Consultation
router.post('/consultations', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim().toLowerCase();
    const phone = String(req.body?.phone || '').trim();
    const serviceType = String(req.body?.serviceType || '').trim();
    const budgetRange = String(req.body?.budgetRange || '').trim();
    const preferredDate = String(req.body?.preferredDate || '').trim();
    const message = String(req.body?.message || '').trim();

    if (name.length < 2) return res.status(400).json({ error: 'Please enter your name.' });
    if (!isValidEmail(email)) return res.status(400).json({ error: 'Please enter a valid email address.' });
    if (phone.length < 7) return res.status(400).json({ error: 'Please enter a valid phone number.' });
    if (!serviceType || !preferredDate) return res.status(400).json({ error: 'Please choose a service and date.' });

    const inserted = await db
      .insert(consultations)
      .values({
        userId: req.authUser?.id || null,
        name,
        email,
        phone,
        serviceType,
        budgetRange: budgetRange || null,
        preferredDate,
        message: message || null,
        status: 'new',
      })
      .returning();

    res.status(201).json({ consultation: inserted[0], message: 'Consultation booked! We have reserved your slot.' });
  } catch (error) {
    console.error('Consultation booking failed:', error);
    res.status(500).json({ error: 'Could not book consultation.' });
  }
});

// Newsletter Subscribe
router.post('/subscribe', async (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const existing = await db.select().from(subscribers).where(eq(subscribers.email, email)).limit(1);
    if (existing.length > 0) {
      return res.json({ message: 'You are already subscribed to NexaHome updates.' });
    }

    await db.insert(subscribers).values({ email });
    res.status(201).json({ message: 'Subscribed! You will receive curated listings and market insights.' });
  } catch (error) {
    console.error('Newsletter subscribe failed:', error);
    res.status(500).json({ error: 'Could not subscribe at the moment.' });
  }
});

export default router;
