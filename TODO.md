# TODO — Asterot Website Reorganization

## Completed (Phase 1)
- [x] Fix migration 002: Remove `featured_image` FK from `news` table (forward reference to `media`)
- [x] Fix migration 003: Add `featured_image` FK on `news` table after `media` is created
- [x] Fix package.json: Align `eslint` and `eslint-config-next` versions with `next` 14.0.0
- [x] Update `db/schema.sql`: Align with uuid-based migration schema
- [x] Connect contact form: Update `lib/contact.ts` to insert into `contact_messages` table
- [x] Run type-check and build to verify

## Phase 2: Multi-Page Corporate Architecture

### 1. Shared Data & Components
- [x] Create `lib/leadership.ts` - single source of truth for leadership team data (6 members, name, role, image path, short bio)
- [x] Create `lib/about.ts` - shared about content (values, story, mission, vision, future vision)
- [x] Create `lib/events.ts` - shared events data (upcoming, past, documentation categories)
- [x] Create placeholder portrait system (local SVG/div placeholders, replaceable)

### 2. About Section Pages
- [x] `/about` - Overview hub with cards linking to sub-pages (Learn More →)
- [x] `/about/our-story` - Story page
- [x] `/about/mission-vision` - Mission & Vision page
- [x] `/about/values` - 6 values page (Youth, Innovation, Excellence, Integrity, Impact, Growth)
- [x] `/about/leadership` - Premium leadership page with grayscale→color hover portraits
- [x] `/about/future-vision` - Visual roadmap (current vs planned stages)
- [x] Remove/replace old `/mission-vision` page (now `/about/mission-vision`)

### 3. Events Section Pages
- [x] `/events` - Landing hub with Upcoming/Featured/Past/Documentation cards
- [x] `/events/upcoming` - Upcoming events page
- [x] `/events/past` - Past events page
- [x] `/events/documentation` - Photo+video gallery with filters

### 4. News Section
- [x] `/news` - Latest/updates/announcements page
- [x] `/news/[slug]` - Article detail page (dynamic route)

### 5. Navigation Updates
- [x] Update `components/Navbar.tsx`:
  - [x] About Us dropdown → Our Story, Mission & Vision, Our Values, Leadership, Future Vision
  - [x] Events dropdown → Upcoming Events, Past Events, Event Documentation
  - [x] News dropdown → Latest News, Announcements, Articles/Updates
  - [x] Fix dropdown hover gap bug (remove closeTimer delay, keep dropdown open while cursor moves into panel)
  - [x] Update activeSection logic for new routes

### 6. Footer Updates
- [x] Update `components/Footer.tsx` to include new sub-page links

### 7. Testing & Verification
- [x] npm run type-check
- [x] npm run build
- [x] Verify every route works
- [x] Verify navigation/dropdowns work correctly
- [x] Verify footer renders once per page
- [x] Verify responsive (desktop/tablet/mobile)
- [x] Verify no horizontal overflow
- [x] Verify grayscale→color hover on leadership portraits
