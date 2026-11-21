import { Router } from 'express';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../db/index.ts';
import {
  wishlists,
  properties,
  inquiries,
  visitRequests,
  consultations,
  categories,
  cities,
  agents,
} from '../db/schema.ts';
import { requireAuth, type AuthRequest } from '../middleware/auth.ts';
import { slugify, IMAGES } from '../lib/constants.ts';
import { sanitizeUrl } from '../lib/security.ts';

const router = Router();

// Get user wishlist IDs & properties
router.get('/wishlist', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const rows = await db
      .select({
        wishlistId: wishlists.id,
        property: properties,
      })
      .from(wishlists)
      .innerJoin(properties, eq(wishlists.propertyId, properties.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));

    res.json({
      ids: rows.map((r) => r.property.id),
      items: rows.map((r) => r.property),
    });
  } catch (error) {
    console.error('Failed to fetch wishlist:', error);
    res.status(500).json({ error: 'Unable to load saved properties.' });
  }
});

// Toggle wishlist item
router.post('/wishlist/:propertyId', requireAuth, async (req: AuthRequest, res) => {
  try {
    const userId = req.authUser!.id;
    const propertyId = Number(req.params.propertyId);
    if (!propertyId) return res.status(400).json({ error: 'Invalid property ID.' });

    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.propertyId, propertyId)))
      .limit(1);

    if (existing.length > 0) {
      await db.delete(wishlists).where(eq(wishlists.id, existing[0].id));
      return res.json({ saved: false, message: 'Removed from saved properties.' });
    }

    await db.insert(wishlists).values({ userId, propertyId });
    res.json({ saved: true, message: 'Saved to your wishlist.' });
  } catch (error) {
    console.error('Failed to toggle wishlist:', error);
    res.status(500).json({ error: 'Could not update wishlist.' });
  }
});

// User Dashboard summary (inquiries, visits, consultations, submitted listings)
router.get('/dashboard', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.authUser!;
    const [myWishlist, myInquiries, myVisits, myConsultations, myListings] = await Promise.all([
      db
        .select({ property: properties })
        .from(wishlists)
        .innerJoin(properties, eq(wishlists.propertyId, properties.id))
        .where(eq(wishlists.userId, user.id))
        .orderBy(desc(wishlists.createdAt)),
      db.select().from(inquiries).where(eq(inquiries.userId, user.id)).orderBy(desc(inquiries.createdAt)),
      db
        .select({
          visit: visitRequests,
          propertyTitle: properties.title,
          propertyLocation: properties.location,
        })
        .from(visitRequests)
        .leftJoin(properties, eq(visitRequests.propertyId, properties.id))
        .where(eq(visitRequests.userId, user.id))
        .orderBy(desc(visitRequests.createdAt)),
      db.select().from(consultations).where(eq(consultations.userId, user.id)).orderBy(desc(consultations.createdAt)),
      db.select().from(properties).where(eq(properties.submittedByUserId, user.id)).orderBy(desc(properties.createdAt)),
    ]);

    res.json({
      wishlist: myWishlist.map((w) => w.property),
      inquiries: myInquiries,
      visits: myVisits.map((v) => ({
        ...v.visit,
        propertyTitle: v.propertyTitle,
        propertyLocation: v.propertyLocation,
      })),
      consultations: myConsultations,
      listings: myListings,
    });
  } catch (error) {
    console.error('Failed to load user dashboard:', error);
    res.status(500).json({ error: 'Unable to load account dashboard.' });
  }
});

// Submit a property listing (goes to admin approval queue)
router.post('/listings', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.authUser!;
    const title = String(req.body?.title || '').trim();
    const description = String(req.body?.description || '').trim();
    const purpose = req.body?.purpose === 'rent' ? 'rent' : 'sale';
    const categoryId = req.body?.categoryId ? Number(req.body.categoryId) : null;
    const cityId = req.body?.cityId ? Number(req.body.cityId) : null;
    const location = String(req.body?.location || '').trim();
    const price = Number(req.body?.price) || 0;
    const bedrooms = Math.max(0, Number(req.body?.bedrooms) || 0);
    const bathrooms = Math.max(0, Number(req.body?.bathrooms) || 0);
    const areaValue = Math.max(0, Number(req.body?.areaValue) || 0);
    const areaLabel = String(req.body?.areaLabel || '').trim() || `${areaValue} sqft`;
    const rawImages = Array.isArray(req.body?.images) ? req.body.images : [];
    const safeImages = rawImages
      .map((u: unknown) => sanitizeUrl(String(u)))
      .filter((u: string) => u.length > 0);
    const rawAmenities = Array.isArray(req.body?.amenities) ? req.body.amenities : [];
    const amenities = rawAmenities
      .map((a: unknown) => String(a).trim())
      .filter((a: string) => a.length > 0)
      .slice(0, 20);

    if (title.length < 4) return res.status(400).json({ error: 'Property title must be at least 4 characters.' });
    if (description.length < 15) return res.status(400).json({ error: 'Please provide a more detailed property description.' });
    if (location.length < 3) return res.status(400).json({ error: 'Please enter the property location.' });
    if (price <= 0) return res.status(400).json({ error: 'Please enter a valid price in PKR.' });

    // Assign default agent and fallback category/city if omitted
    const [firstAgent, firstCat, firstCity] = await Promise.all([
      db.select().from(agents).limit(1),
      categoryId ? Promise.resolve([]) : db.select().from(categories).limit(1),
      cityId ? Promise.resolve([]) : db.select().from(cities).limit(1),
    ]);

    const uniqueSlug = `${slugify(title)}-${crypto.randomBytes(3).toString('hex')}`;
    const inserted = await db
      .insert(properties)
      .values({
        title,
        slug: uniqueSlug,
        description,
        purpose,
        categoryId: categoryId || firstCat[0]?.id || null,
        cityId: cityId || firstCity[0]?.id || null,
        agentId: firstAgent[0]?.id || null,
        submittedByUserId: user.id,
        location,
        price,
        bedrooms,
        bathrooms,
        areaValue: areaValue || 1800,
        areaLabel,
        status: 'available',
        approvalStatus: user.role === 'admin' ? 'approved' : 'pending',
        isFeatured: false,
        images: safeImages.length > 0 ? safeImages : [IMAGES.modernHouse],
        amenities: amenities.length > 0 ? amenities : ['Verified Ownership', '24/7 Security'],
        latitude: 31.5204,
        longitude: 74.3587,
      })
      .returning();

    res.status(201).json({
      property: inserted[0],
      message:
        user.role === 'admin'
          ? 'Property published directly to NexaHome listings.'
          : 'Property submitted! It is now pending admin review and approval.',
    });
  } catch (error) {
    console.error('Submit listing failed:', error);
    res.status(500).json({ error: 'Failed to submit property listing.' });
  }
});

// Delete own pending/rejected listing
router.delete('/listings/:id', requireAuth, async (req: AuthRequest, res) => {
  try {
    const user = req.authUser!;
    const id = Number(req.params.id);
    const existing = await db.select().from(properties).where(eq(properties.id, id)).limit(1);
    if (!existing.length) return res.status(404).json({ error: 'Listing not found.' });
    if (existing[0].submittedByUserId !== user.id && user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized to remove this listing.' });
    }
    await db.delete(properties).where(eq(properties.id, id));
    res.json({ message: 'Listing deleted.' });
  } catch (error) {
    console.error('Delete own listing failed:', error);
    res.status(500).json({ error: 'Could not delete listing.' });
  }
});

export default router;
