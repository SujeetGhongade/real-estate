# NexaHome Real Estate

Full-stack real estate platform built for buying, renting, and investing in verified properties across Lahore, Karachi, and Islamabad, powered by **Cloud SQL (PostgreSQL + Drizzle ORM)**, **Firebase Authentication**, **Express**, **Chart.js**, and **Tailwind CSS**.

## Features

### Public Website
- **Hero & Live Search**: Segmented Buy / Rent / Projects search with city, type, and PKR price range filtering.
- **Categories & Featured Properties**: Dynamic category cards (`Houses`, `Apartments`, `Villas`, `Commercial`) and featured property cards with wishlist toggle.
- **Listings Directory**: Multi-facet filters (purpose, type, city, PKR price range, bedrooms, area), sorting, and pagination.
- **Property Detail Page**: Image gallery, specifications, amenities, interactive map preview, advisor card, inquiry submission, tour scheduling, and link sharing.
- **Content & Lead Generation**: Signature Projects showcase, About & Advisors, Services with Consultation Booking, Market Insights Blog, Contact desk, Privacy & Terms, and Newsletter subscription.
- **Member Portal**: Google Sign-In and email/password accounts, profile management, wishlist, inquiry history, scheduled tours, and owner listing submission (pending admin approval).

### Admin Panel (`/admin`)
- **Dashboard & Analytics**: Live KPI totals and Chart.js visualizations (city distribution, category breakdown, leads & engagement).
- **Properties Management**: Add, edit, duplicate, delete, multi-image upload, availability status (`available`/`sold`/`rented`), featured toggle, and user listing approve/reject workflow.
- **Full Catalog CRUD**: Categories, Cities, Agents, Projects, Testimonials, and Blog Posts.
- **Lead Management**: View inquiries, scheduled visits, and consultations, update statuses (`new`/`contacted`/`closed`), record client replies, and export CSV files.
- **Users & Subscribers**: Block/unblock accounts, manage subscribers, and export CSVs.
- **Live Site Settings & Audit Log**: Edit brand info, hero copy, banners, stats strip, contact info, and SEO metadata live, plus view activity logs and update passwords.

## Environment Variables
- `SQL_HOST`, `SQL_DB_NAME`, `SQL_USER`, `SQL_PASSWORD`, `SQL_ADMIN_USER`, `SQL_ADMIN_PASSWORD`: Provisioned automatically by Cloud SQL in AI Studio.
- `ADMIN_PASSCODE` *(optional)*: Server-side passcode for password-based admin access. If unset, `/admin` presents a one-time First-Run Admin Setup form (in addition to Google Sign-In for the owner account).

## Running Locally
```bash
npm install
npm run dev
```
