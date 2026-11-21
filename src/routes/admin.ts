import { Router } from 'express';
import crypto from 'crypto';
import { eq, desc, asc, sql } from 'drizzle-orm';
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
  users,
  subscribers,
  siteSettings,
  activityLogs,
} from '../db/schema.ts';
import { requireAdmin, type AuthRequest } from '../middleware/auth.ts';
import { slugify, IMAGES, DEFAULT_SITE_SETTINGS } from '../lib/constants.ts';
import { sanitizeUrl, csvEscape } from '../lib/security.ts';

const router = Router();
router.use(requireAdmin);

async function logActivity(
  actorEmail: string,
  action: string,
  entityType: string,
  entityId?: string | number | null,
  details?: string
) {
  try {
    await db.insert(activityLogs).values({
      actorEmail,
      action,
      entityType,
      entityId: entityId !== undefined && entityId !== null ? String(entityId) : null,
      details: details || null,
    });
  } catch (err) {
    console.error('Failed to write activity log:', err);
  }
}

// 1. Dashboard Overview & Chart Datasets
router.get('/dashboard', async (_req, res) => {
  try {
    const [
      allProperties,
      allCategories,
      allCities,
      allInquiries,
      allVisits,
      allConsultations,
      allUsers,
      allSubscribers,
      recentLogs,
    ] = await Promise.all([
      db.select().from(properties).orderBy(desc(properties.createdAt)),
      db.select().from(categories),
      db.select().from(cities),
      db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
      db.select().from(visitRequests).orderBy(desc(visitRequests.createdAt)),
      db.select().from(consultations).orderBy(desc(consultations.createdAt)),
      db.select({ id: users.id, role: users.role, isBlocked: users.isBlocked, createdAt: users.createdAt }).from(users),
      db.select().from(subscribers),
      db.select().from(activityLogs).orderBy(desc(activityLogs.createdAt)).limit(10),
    ]);

    const cityMap = new Map(allCities.map((c) => [c.id, c.name]));
    const catMap = new Map(allCategories.map((c) => [c.id, c.name]));

    const byCityCounts: Record<string, number> = {};
    const byCategoryCounts: Record<string, number> = {};
    const byPurposeCounts: Record<string, number> = { Sale: 0, Rent: 0 };

    for (const p of allProperties) {
      const cName = (p.cityId && cityMap.get(p.cityId)) || 'Other';
      byCityCounts[cName] = (byCityCounts[cName] || 0) + 1;

      const catName = (p.categoryId && catMap.get(p.categoryId)) || 'Other';
      byCategoryCounts[catName] = (byCategoryCounts[catName] || 0) + 1;

      if (p.purpose === 'rent') byPurposeCounts.Rent += 1;
      else byPurposeCounts.Sale += 1;
    }

    const pendingApprovals = allProperties.filter((p) => p.approvalStatus === 'pending').length;
    const newInquiries = allInquiries.filter((i) => i.status === 'new').length;
    const newVisits = allVisits.filter((v) => v.status === 'new').length;

    res.json({
      totals: {
        properties: allProperties.length,
        pendingApprovals,
        inquiries: allInquiries.length,
        newInquiries,
        visits: allVisits.length,
        newVisits,
        consultations: allConsultations.length,
        users: allUsers.length,
        subscribers: allSubscribers.length,
      },
      charts: {
        byCity: {
          labels: Object.keys(byCityCounts),
          values: Object.values(byCityCounts),
        },
        byCategory: {
          labels: Object.keys(byCategoryCounts),
          values: Object.values(byCategoryCounts),
        },
        byPurpose: {
          labels: Object.keys(byPurposeCounts),
          values: Object.values(byPurposeCounts),
        },
        leadBreakdown: {
          labels: ['Inquiries', 'Visit Requests', 'Consultations', 'Subscribers'],
          values: [allInquiries.length, allVisits.length, allConsultations.length, allSubscribers.length],
        },
      },
      recentInquiries: allInquiries.slice(0, 5),
      recentLogs,
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({ error: 'Unable to load dashboard analytics.' });
  }
});

// 2. Properties Management
router.get('/properties', async (_req, res) => {
  try {
    const [rows, allCats, allCities, allAgents] = await Promise.all([
      db.select().from(properties).orderBy(desc(properties.createdAt)),
      db.select().from(categories),
      db.select().from(cities),
      db.select().from(agents),
    ]);
    const catMap = new Map(allCats.map((c) => [c.id, c]));
    const cityMap = new Map(allCities.map((c) => [c.id, c]));
    const agentMap = new Map(allAgents.map((a) => [a.id, a]));
    res.json({
      items: rows.map((p) => ({
        ...p,
        category: p.categoryId ? catMap.get(p.categoryId) || null : null,
        city: p.cityId ? cityMap.get(p.cityId) || null : null,
        agent: p.agentId ? agentMap.get(p.agentId) || null : null,
      })),
    });
  } catch (error) {
    console.error('Admin fetch properties error:', error);
    res.status(500).json({ error: 'Unable to fetch properties.' });
  }
});

router.post('/properties', async (req: AuthRequest, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    if (title.length < 3) return res.status(400).json({ error: 'Property title is required.' });

    const images = Array.isArray(body.images)
      ? body.images.map((u: unknown) => sanitizeUrl(String(u))).filter(Boolean)
      : [];
    const amenities = Array.isArray(body.amenities)
      ? body.amenities.map((a: unknown) => String(a).trim()).filter(Boolean)
      : [];

    const slug = `${slugify(title)}-${crypto.randomBytes(2).toString('hex')}`;
    const inserted = await db
      .insert(properties)
      .values({
        title,
        slug,
        description: String(body.description || 'Verified luxury property listed by NexaHome Real Estate.').trim(),
        purpose: body.purpose === 'rent' ? 'rent' : 'sale',
        categoryId: body.categoryId ? Number(body.categoryId) : null,
        cityId: body.cityId ? Number(body.cityId) : null,
        agentId: body.agentId ? Number(body.agentId) : null,
        submittedByUserId: req.authUser!.id,
        location: String(body.location || 'Lahore, Pakistan').trim(),
        price: Math.max(0, Number(body.price) || 0),
        bedrooms: Math.max(0, Number(body.bedrooms) || 0),
        bathrooms: Math.max(0, Number(body.bathrooms) || 0),
        areaValue: Math.max(0, Number(body.areaValue) || 1800),
        areaLabel: String(body.areaLabel || '10 Marla').trim(),
        status: ['available', 'sold', 'rented'].includes(body.status) ? body.status : 'available',
        approvalStatus: ['pending', 'approved', 'rejected'].includes(body.approvalStatus) ? body.approvalStatus : 'approved',
        isFeatured: Boolean(body.isFeatured),
        images: images.length > 0 ? images : [IMAGES.modernHouse],
        amenities: amenities.length > 0 ? amenities : ['24/7 Security', 'Covered Parking'],
        latitude: body.latitude ? Number(body.latitude) : 31.5204,
        longitude: body.longitude ? Number(body.longitude) : 74.3587,
      })
      .returning();

    await logActivity(req.authUser!.email, 'CREATE', 'property', inserted[0].id, `Added property "${title}"`);
    res.status(201).json({ property: inserted[0] });
  } catch (error) {
    console.error('Admin create property error:', error);
    res.status(500).json({ error: 'Failed to create property.' });
  }
});

router.put('/properties/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const body = req.body || {};
    const existing = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'Property not found.' });

    const images = Array.isArray(body.images)
      ? body.images.map((u: unknown) => sanitizeUrl(String(u))).filter(Boolean)
      : existing[0].images;
    const amenities = Array.isArray(body.amenities)
      ? body.amenities.map((a: unknown) => String(a).trim()).filter(Boolean)
      : existing[0].amenities;

    const updated = await db
      .update(properties)
      .set({
        title: body.title !== undefined ? String(body.title).trim() : existing[0].title,
        description: body.description !== undefined ? String(body.description).trim() : existing[0].description,
        purpose: body.purpose === 'rent' ? 'rent' : body.purpose === 'sale' ? 'sale' : existing[0].purpose,
        categoryId: body.categoryId !== undefined ? (body.categoryId ? Number(body.categoryId) : null) : existing[0].categoryId,
        cityId: body.cityId !== undefined ? (body.cityId ? Number(body.cityId) : null) : existing[0].cityId,
        agentId: body.agentId !== undefined ? (body.agentId ? Number(body.agentId) : null) : existing[0].agentId,
        location: body.location !== undefined ? String(body.location).trim() : existing[0].location,
        price: body.price !== undefined ? Math.max(0, Number(body.price)) : existing[0].price,
        bedrooms: body.bedrooms !== undefined ? Math.max(0, Number(body.bedrooms)) : existing[0].bedrooms,
        bathrooms: body.bathrooms !== undefined ? Math.max(0, Number(body.bathrooms)) : existing[0].bathrooms,
        areaValue: body.areaValue !== undefined ? Math.max(0, Number(body.areaValue)) : existing[0].areaValue,
        areaLabel: body.areaLabel !== undefined ? String(body.areaLabel).trim() : existing[0].areaLabel,
        status: ['available', 'sold', 'rented'].includes(body.status) ? body.status : existing[0].status,
        approvalStatus: ['pending', 'approved', 'rejected'].includes(body.approvalStatus)
          ? body.approvalStatus
          : existing[0].approvalStatus,
        isFeatured: body.isFeatured !== undefined ? Boolean(body.isFeatured) : existing[0].isFeatured,
        images: images.length > 0 ? images : existing[0].images,
        amenities,
        latitude: body.latitude !== undefined ? Number(body.latitude) : existing[0].latitude,
        longitude: body.longitude !== undefined ? Number(body.longitude) : existing[0].longitude,
        updatedAt: new Date(),
      })
      .where(eq(properties.id, id))
      .returning();

    await logActivity(req.authUser!.email, 'UPDATE', 'property', id, `Updated property "${updated[0].title}"`);
    res.json({ property: updated[0] });
  } catch (error) {
    console.error('Admin update property error:', error);
    res.status(500).json({ error: 'Failed to update property.' });
  }
});

router.post('/properties/:id/duplicate', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const existing = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'Property not found.' });
    const src = existing[0];
    const newTitle = `${src.title} (Copy)`;
    const inserted = await db
      .insert(properties)
      .values({
        title: newTitle,
        slug: `${slugify(src.title)}-copy-${crypto.randomBytes(2).toString('hex')}`,
        description: src.description,
        purpose: src.purpose,
        categoryId: src.categoryId,
        cityId: src.cityId,
        agentId: src.agentId,
        submittedByUserId: req.authUser!.id,
        location: src.location,
        price: src.price,
        bedrooms: src.bedrooms,
        bathrooms: src.bathrooms,
        areaValue: src.areaValue,
        areaLabel: src.areaLabel,
        status: src.status,
        approvalStatus: src.approvalStatus,
        isFeatured: false,
        images: src.images,
        amenities: src.amenities,
        latitude: src.latitude,
        longitude: src.longitude,
      })
      .returning();

    await logActivity(req.authUser!.email, 'DUPLICATE', 'property', inserted[0].id, `Duplicated "${src.title}"`);
    res.status(201).json({ property: inserted[0] });
  } catch (error) {
    console.error('Admin duplicate property error:', error);
    res.status(500).json({ error: 'Failed to duplicate property.' });
  }
});

router.delete('/properties/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(properties).where(eq(properties.id, id));
    await logActivity(req.authUser!.email, 'DELETE', 'property', id, `Deleted property #${id}`);
    res.json({ message: 'Property deleted.' });
  } catch (error) {
    console.error('Admin delete property error:', error);
    res.status(500).json({ error: 'Failed to delete property.' });
  }
});

// 3. Categories CRUD
router.get('/categories', async (_req, res) => {
  const rows = await db.select().from(categories).orderBy(asc(categories.sortOrder), asc(categories.id));
  res.json({ items: rows });
});

router.post('/categories', async (req: AuthRequest, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const subtitle = String(req.body?.subtitle || 'Explore listings').trim();
    const imageUrl = sanitizeUrl(req.body?.imageUrl, IMAGES.modernHouse);
    if (!name) return res.status(400).json({ error: 'Category name is required.' });
    const inserted = await db
      .insert(categories)
      .values({ name, slug: slugify(name), subtitle, imageUrl, sortOrder: Number(req.body?.sortOrder) || 0 })
      .returning();
    await logActivity(req.authUser!.email, 'CREATE', 'category', inserted[0].id, `Created category "${name}"`);
    res.status(201).json({ item: inserted[0] });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(400).json({ error: 'Category could not be created (name may already exist).' });
  }
});

router.put('/categories/:id', async (req: AuthRequest, res) => {
  try {
    const id = Number(req.params.id);
    const name = String(req.body?.name || '').trim();
    const subtitle = String(req.body?.subtitle || '').trim();
    const imageUrl = sanitizeUrl(req.body?.imageUrl, IMAGES.modernHouse);
    const updated = await db
      .update(categories)
      .set({ name, slug: slugify(name), subtitle, imageUrl, sortOrder: Number(req.body?.sortOrder) || 0 })
      .where(eq(categories.id, id))
      .returning();
    await logActivity(req.authUser!.email, 'UPDATE', 'category', id, `Updated category "${name}"`);
    res.json({ item: updated[0] });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(400).json({ error: 'Failed to update category.' });
  }
});

router.delete('/categories/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(categories).where(eq(categories.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'category', id, `Deleted category #${id}`);
  res.json({ message: 'Category deleted.' });
});

// 4. Cities CRUD
router.get('/cities', async (_req, res) => {
  const rows = await db.select().from(cities).orderBy(asc(cities.name));
  res.json({ items: rows });
});

router.post('/cities', async (req: AuthRequest, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const province = String(req.body?.province || 'Punjab').trim();
    if (!name) return res.status(400).json({ error: 'City name is required.' });
    const inserted = await db
      .insert(cities)
      .values({ name, province, isFeatured: Boolean(req.body?.isFeatured ?? true) })
      .returning();
    await logActivity(req.authUser!.email, 'CREATE', 'city', inserted[0].id, `Added city "${name}"`);
    res.status(201).json({ item: inserted[0] });
  } catch (error) {
    console.error('Create city error:', error);
    res.status(400).json({ error: 'City could not be added (may already exist).' });
  }
});

router.put('/cities/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const name = String(req.body?.name || '').trim();
  const province = String(req.body?.province || '').trim();
  const updated = await db
    .update(cities)
    .set({ name, province, isFeatured: Boolean(req.body?.isFeatured) })
    .where(eq(cities.id, id))
    .returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'city', id, `Updated city "${name}"`);
  res.json({ item: updated[0] });
});

router.delete('/cities/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(cities).where(eq(cities.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'city', id, `Deleted city #${id}`);
  res.json({ message: 'City deleted.' });
});

// 5. Agents CRUD
router.get('/agents', async (_req, res) => {
  const rows = await db.select().from(agents).orderBy(asc(agents.id));
  res.json({ items: rows });
});

router.post('/agents', async (req: AuthRequest, res) => {
  try {
    const b = req.body || {};
    const name = String(b.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Agent name is required.' });
    const inserted = await db
      .insert(agents)
      .values({
        name,
        title: String(b.title || 'Property Advisor').trim(),
        email: String(b.email || 'advisor@nexahome.pk').trim(),
        phone: String(b.phone || '+92 300 000 0000').trim(),
        city: String(b.city || 'Lahore').trim(),
        bio: String(b.bio || '').trim(),
        avatarUrl: sanitizeUrl(b.avatarUrl, IMAGES.agentMale),
        experienceYears: Number(b.experienceYears) || 5,
      })
      .returning();
    await logActivity(req.authUser!.email, 'CREATE', 'agent', inserted[0].id, `Added agent "${name}"`);
    res.status(201).json({ item: inserted[0] });
  } catch (error) {
    console.error('Create agent error:', error);
    res.status(500).json({ error: 'Failed to create agent.' });
  }
});

router.put('/agents/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const updated = await db
    .update(agents)
    .set({
      name: String(b.name || '').trim(),
      title: String(b.title || '').trim(),
      email: String(b.email || '').trim(),
      phone: String(b.phone || '').trim(),
      city: String(b.city || '').trim(),
      bio: String(b.bio || '').trim(),
      avatarUrl: sanitizeUrl(b.avatarUrl, IMAGES.agentMale),
      experienceYears: Number(b.experienceYears) || 5,
    })
    .where(eq(agents.id, id))
    .returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'agent', id, `Updated agent "${updated[0]?.name}"`);
  res.json({ item: updated[0] });
});

router.delete('/agents/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(agents).where(eq(agents.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'agent', id, `Deleted agent #${id}`);
  res.json({ message: 'Agent removed.' });
});

// 6. Projects CRUD
router.get('/projects', async (_req, res) => {
  const rows = await db.select().from(projects).orderBy(desc(projects.createdAt));
  res.json({ items: rows });
});

router.post('/projects', async (req: AuthRequest, res) => {
  try {
    const b = req.body || {};
    const title = String(b.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Project title is required.' });
    const highlights = Array.isArray(b.highlights)
      ? b.highlights.map((h: unknown) => String(h).trim()).filter(Boolean)
      : [];
    const inserted = await db
      .insert(projects)
      .values({
        title,
        slug: `${slugify(title)}-${crypto.randomBytes(2).toString('hex')}`,
        city: String(b.city || 'Lahore').trim(),
        location: String(b.location || '').trim(),
        developer: String(b.developer || 'Nexa Developments').trim(),
        startingPrice: Math.max(0, Number(b.startingPrice) || 25000000),
        expectedRoi: String(b.expectedRoi || '14% Annual').trim(),
        completionDate: String(b.completionDate || 'Q4 2027').trim(),
        status: String(b.status || 'Under Construction').trim(),
        description: String(b.description || '').trim(),
        imageUrl: sanitizeUrl(b.imageUrl, IMAGES.bannerInvest),
        highlights,
      })
      .returning();
    await logActivity(req.authUser!.email, 'CREATE', 'project', inserted[0].id, `Created project "${title}"`);
    res.status(201).json({ item: inserted[0] });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ error: 'Failed to create project.' });
  }
});

router.put('/projects/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const highlights = Array.isArray(b.highlights)
    ? b.highlights.map((h: unknown) => String(h).trim()).filter(Boolean)
    : [];
  const updated = await db
    .update(projects)
    .set({
      title: String(b.title || '').trim(),
      city: String(b.city || '').trim(),
      location: String(b.location || '').trim(),
      developer: String(b.developer || '').trim(),
      startingPrice: Math.max(0, Number(b.startingPrice) || 0),
      expectedRoi: String(b.expectedRoi || '').trim(),
      completionDate: String(b.completionDate || '').trim(),
      status: String(b.status || 'Under Construction').trim(),
      description: String(b.description || '').trim(),
      imageUrl: sanitizeUrl(b.imageUrl, IMAGES.bannerInvest),
      highlights,
    })
    .where(eq(projects.id, id))
    .returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'project', id, `Updated project "${updated[0]?.title}"`);
  res.json({ item: updated[0] });
});

router.delete('/projects/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(projects).where(eq(projects.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'project', id, `Deleted project #${id}`);
  res.json({ message: 'Project deleted.' });
});

// 7. Testimonials CRUD
router.get('/testimonials', async (_req, res) => {
  const rows = await db.select().from(testimonials).orderBy(desc(testimonials.createdAt));
  res.json({ items: rows });
});

router.post('/testimonials', async (req: AuthRequest, res) => {
  const b = req.body || {};
  const inserted = await db
    .insert(testimonials)
    .values({
      clientName: String(b.clientName || '').trim(),
      clientRole: String(b.clientRole || 'Verified Client').trim(),
      rating: Math.min(5, Math.max(1, Number(b.rating) || 5)),
      quote: String(b.quote || '').trim(),
      avatarUrl: sanitizeUrl(b.avatarUrl, IMAGES.agentMale),
      isActive: Boolean(b.isActive ?? true),
    })
    .returning();
  await logActivity(req.authUser!.email, 'CREATE', 'testimonial', inserted[0].id, `Added testimonial from ${inserted[0].clientName}`);
  res.status(201).json({ item: inserted[0] });
});

router.put('/testimonials/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const updated = await db
    .update(testimonials)
    .set({
      clientName: String(b.clientName || '').trim(),
      clientRole: String(b.clientRole || 'Verified Client').trim(),
      rating: Math.min(5, Math.max(1, Number(b.rating) || 5)),
      quote: String(b.quote || '').trim(),
      avatarUrl: sanitizeUrl(b.avatarUrl, IMAGES.agentMale),
      isActive: Boolean(b.isActive ?? true),
    })
    .where(eq(testimonials.id, id))
    .returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'testimonial', id, `Updated testimonial #${id}`);
  res.json({ item: updated[0] });
});

router.delete('/testimonials/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(testimonials).where(eq(testimonials.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'testimonial', id, `Deleted testimonial #${id}`);
  res.json({ message: 'Testimonial deleted.' });
});

// 8. Blog Posts CRUD
router.get('/blog', async (_req, res) => {
  const rows = await db.select().from(blogPosts).orderBy(desc(blogPosts.createdAt));
  res.json({ items: rows });
});

router.post('/blog', async (req: AuthRequest, res) => {
  const b = req.body || {};
  const title = String(b.title || '').trim();
  if (!title) return res.status(400).json({ error: 'Article title is required.' });
  const inserted = await db
    .insert(blogPosts)
    .values({
      title,
      slug: `${slugify(title)}-${crypto.randomBytes(2).toString('hex')}`,
      category: String(b.category || 'Market Insights').trim(),
      author: String(b.author || req.authUser!.name).trim(),
      excerpt: String(b.excerpt || '').trim(),
      content: String(b.content || '').trim(),
      coverImage: sanitizeUrl(b.coverImage, IMAGES.modernHouse),
      readTime: String(b.readTime || '5 min read').trim(),
      isPublished: Boolean(b.isPublished ?? true),
    })
    .returning();
  await logActivity(req.authUser!.email, 'CREATE', 'blog', inserted[0].id, `Published blog "${title}"`);
  res.status(201).json({ item: inserted[0] });
});

router.put('/blog/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const b = req.body || {};
  const updated = await db
    .update(blogPosts)
    .set({
      title: String(b.title || '').trim(),
      category: String(b.category || 'Market Insights').trim(),
      author: String(b.author || '').trim(),
      excerpt: String(b.excerpt || '').trim(),
      content: String(b.content || '').trim(),
      coverImage: sanitizeUrl(b.coverImage, IMAGES.modernHouse),
      readTime: String(b.readTime || '5 min read').trim(),
      isPublished: Boolean(b.isPublished ?? true),
    })
    .where(eq(blogPosts.id, id))
    .returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'blog', id, `Updated blog "${updated[0]?.title}"`);
  res.json({ item: updated[0] });
});

router.delete('/blog/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(blogPosts).where(eq(blogPosts.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'blog', id, `Deleted blog #${id}`);
  res.json({ message: 'Article deleted.' });
});

// 9. Inquiries, Visit Requests & Consultations
router.get('/leads', async (_req, res) => {
  const [allInquiries, allVisits, allConsultations, allProps] = await Promise.all([
    db.select().from(inquiries).orderBy(desc(inquiries.createdAt)),
    db.select().from(visitRequests).orderBy(desc(visitRequests.createdAt)),
    db.select().from(consultations).orderBy(desc(consultations.createdAt)),
    db.select({ id: properties.id, title: properties.title }).from(properties),
  ]);
  const propMap = new Map(allProps.map((p) => [p.id, p.title]));
  res.json({
    inquiries: allInquiries.map((i) => ({ ...i, propertyTitle: i.propertyId ? propMap.get(i.propertyId) || null : null })),
    visits: allVisits.map((v) => ({ ...v, propertyTitle: v.propertyId ? propMap.get(v.propertyId) || null : null })),
    consultations: allConsultations,
  });
});

router.patch('/inquiries/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const status = ['new', 'contacted', 'closed'].includes(req.body?.status) ? req.body.status : undefined;
  const adminReply = req.body?.adminReply !== undefined ? String(req.body.adminReply).trim() : undefined;

  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (adminReply !== undefined) {
    updates.adminReply = adminReply;
    updates.repliedAt = new Date();
    if (!status) updates.status = 'contacted';
  }

  const updated = await db.update(inquiries).set(updates).where(eq(inquiries.id, id)).returning();
  await logActivity(
    req.authUser!.email,
    adminReply ? 'REPLY' : 'UPDATE',
    'inquiry',
    id,
    adminReply ? `Sent reply to ${updated[0]?.email}` : `Changed status to ${status}`
  );
  res.json({ item: updated[0], message: adminReply ? 'Reply saved and logged for client.' : 'Inquiry updated.' });
});

router.patch('/visits/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const status = ['new', 'contacted', 'closed'].includes(req.body?.status) ? req.body.status : undefined;
  const adminReply = req.body?.adminReply !== undefined ? String(req.body.adminReply).trim() : undefined;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (adminReply !== undefined) {
    updates.adminReply = adminReply;
    if (!status) updates.status = 'contacted';
  }
  const updated = await db.update(visitRequests).set(updates).where(eq(visitRequests.id, id)).returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'visit', id, `Updated visit request #${id}`);
  res.json({ item: updated[0] });
});

router.patch('/consultations/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  const status = ['new', 'contacted', 'closed'].includes(req.body?.status) ? req.body.status : undefined;
  const adminReply = req.body?.adminReply !== undefined ? String(req.body.adminReply).trim() : undefined;
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (adminReply !== undefined) {
    updates.adminReply = adminReply;
    if (!status) updates.status = 'contacted';
  }
  const updated = await db.update(consultations).set(updates).where(eq(consultations.id, id)).returning();
  await logActivity(req.authUser!.email, 'UPDATE', 'consultation', id, `Updated consultation #${id}`);
  res.json({ item: updated[0] });
});

// CSV Exports
router.get('/export/:entity', async (req: AuthRequest, res) => {
  try {
    const entity = req.params.entity;
    let header: string[] = [];
    let rows: unknown[][] = [];

    if (entity === 'inquiries') {
      const data = await db.select().from(inquiries).orderBy(desc(inquiries.createdAt));
      header = ['ID', 'Type', 'Name', 'Email', 'Phone', 'Subject', 'Message', 'Status', 'Reply', 'Created At'];
      rows = data.map((r) => [r.id, r.type, r.name, r.email, r.phone, r.subject, r.message, r.status, r.adminReply, r.createdAt]);
    } else if (entity === 'visits') {
      const data = await db.select().from(visitRequests).orderBy(desc(visitRequests.createdAt));
      header = ['ID', 'Property ID', 'Name', 'Email', 'Phone', 'Date', 'Time', 'Notes', 'Status', 'Created At'];
      rows = data.map((r) => [r.id, r.propertyId, r.name, r.email, r.phone, r.preferredDate, r.preferredTime, r.notes, r.status, r.createdAt]);
    } else if (entity === 'consultations') {
      const data = await db.select().from(consultations).orderBy(desc(consultations.createdAt));
      header = ['ID', 'Name', 'Email', 'Phone', 'Service', 'Budget', 'Date', 'Status', 'Created At'];
      rows = data.map((r) => [r.id, r.name, r.email, r.phone, r.serviceType, r.budgetRange, r.preferredDate, r.status, r.createdAt]);
    } else if (entity === 'users') {
      const data = await db.select().from(users).orderBy(desc(users.createdAt));
      header = ['ID', 'Name', 'Email', 'Phone', 'Role', 'Blocked', 'Created At'];
      rows = data.map((r) => [r.id, r.name, r.email, r.phone, r.role, r.isBlocked, r.createdAt]);
    } else if (entity === 'subscribers') {
      const data = await db.select().from(subscribers).orderBy(desc(subscribers.createdAt));
      header = ['ID', 'Email', 'Subscribed At'];
      rows = data.map((r) => [r.id, r.email, r.createdAt]);
    } else {
      return res.status(400).json({ error: 'Invalid export type.' });
    }

    const csv = [header.map(csvEscape).join(','), ...rows.map((row) => row.map(csvEscape).join(','))].join('\n');
    await logActivity(req.authUser!.email, 'EXPORT_CSV', entity, null, `Exported ${rows.length} ${entity} rows`);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="nexahome-${entity}.csv"`);
    res.send(csv);
  } catch (error) {
    console.error('CSV export error:', error);
    res.status(500).json({ error: 'Export failed.' });
  }
});

// 10. Users & Subscribers
router.get('/users', async (_req, res) => {
  const [allUsers, allSubs] = await Promise.all([
    db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        name: users.name,
        phone: users.phone,
        role: users.role,
        isBlocked: users.isBlocked,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(desc(users.createdAt)),
    db.select().from(subscribers).orderBy(desc(subscribers.createdAt)),
  ]);
  res.json({ users: allUsers, subscribers: allSubs });
});

router.patch('/users/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (id === req.authUser!.id && req.body?.isBlocked === true) {
    return res.status(400).json({ error: 'You cannot block your own administrator account.' });
  }
  const updates: Record<string, unknown> = {};
  if (typeof req.body?.isBlocked === 'boolean') updates.isBlocked = req.body.isBlocked;
  if (req.body?.role === 'admin' || req.body?.role === 'user') updates.role = req.body.role;

  const updated = await db
    .update(users)
    .set(updates)
    .where(eq(users.id, id))
    .returning({
      id: users.id,
      email: users.email,
      name: users.name,
      role: users.role,
      isBlocked: users.isBlocked,
    });
  await logActivity(req.authUser!.email, 'UPDATE', 'user', id, `Updated user #${id} (${JSON.stringify(updates)})`);
  res.json({ user: updated[0] });
});

router.delete('/users/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  if (id === req.authUser!.id) {
    return res.status(400).json({ error: 'You cannot delete your own account.' });
  }
  await db.delete(users).where(eq(users.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'user', id, `Deleted user #${id}`);
  res.json({ message: 'User deleted.' });
});

router.delete('/subscribers/:id', async (req: AuthRequest, res) => {
  const id = Number(req.params.id);
  await db.delete(subscribers).where(eq(subscribers.id, id));
  await logActivity(req.authUser!.email, 'DELETE', 'subscriber', id, `Removed subscriber #${id}`);
  res.json({ message: 'Subscriber removed.' });
});

// 11. Site Settings Live Update
router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const incoming = req.body?.settings || req.body || {};
    const merged: Record<string, unknown> = { ...DEFAULT_SITE_SETTINGS };
    for (const key of Object.keys(DEFAULT_SITE_SETTINGS)) {
      if (incoming[key] !== undefined) {
        const val = String(incoming[key]);
        if (key.toLowerCase().includes('image') || key.toLowerCase().includes('url') || key.startsWith('social')) {
          merged[key] = val.trim() ? sanitizeUrl(val, (DEFAULT_SITE_SETTINGS as unknown as Record<string, string>)[key]) : '';
        } else {
          merged[key] = val;
        }
      }
    }

    await db
      .insert(siteSettings)
      .values({ key: 'main', value: merged, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: siteSettings.key,
        set: { value: merged, updatedAt: new Date() },
      });

    await logActivity(req.authUser!.email, 'UPDATE', 'site_settings', 'main', 'Updated live site settings');
    res.json({ settings: merged, message: 'Site settings saved and published live.' });
  } catch (error) {
    console.error('Update site settings error:', error);
    res.status(500).json({ error: 'Failed to update site settings.' });
  }
});

// 12. Activity Logs
router.get('/logs', async (_req, res) => {
  const rows = await db
    .select()
    .from(activityLogs)
    .orderBy(desc(activityLogs.createdAt))
    .limit(100);
  res.json({ items: rows });
});

// Unused import suppression safeguard check
void sql;

export default router;
