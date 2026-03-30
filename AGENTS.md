# CampusBite — Project Brain

## What This App Is
A college campus food discovery PWA for LPU campus called CampusBite. 
Students swipe food item cards from campus kiosks 
(Left = Dislike, Right = Like, Up = Want to Try). 
The app collects engagement data and surfaces it to kiosk owners 
and a super admin.

## Tech Stack
- Framework: Next.js 14 App Router (TypeScript)
- Backend: Supabase (PostgreSQL + Auth + Realtime)
- Styling: Tailwind CSS
- Swipe Engine: Framer Motion (custom drag — NOT react-tinder-card)
- PWA: next-pwa with Workbox
- Font: Plus Jakarta Sans (Google Fonts)

## Auth Rules
- Students: Google OAuth only → role = 'student'
- Kiosk Owners: Email + Password only → role = 'kiosk_owner'
- Super Admin: Email + Password at hidden route /x-control-9f3k → role = 'super_admin'
- After login, middleware reads role from profiles table and redirects:
  student → /student/home
  kiosk_owner → /kiosk/items
  super_admin → /admin/kiosks

## Route Structure
/ → Landing page (Student button | Kiosk Owner button)
/auth/student → Google OAuth screen
/auth/kiosk → Email/password login + forgot password OTP flow
/auth/callback → Supabase auth callback handler
/x-control-9f3k → Super Admin login (hidden, no link anywhere)
/student/home → Swipe deck + poll banner
/student/trends → Trending food items
/student/stats → Campus analytics
/student/profile → User profile + history + feedback
/kiosk/items → Kiosk item management
/kiosk/polls → Poll results (subscribed only)
/kiosk/feedback → Student feedback (subscribed only)
/kiosk/stats → Kiosk performance stats
/admin/kiosks → Manage all kiosks
/admin/feedback → Global feedback view
/admin/polls → Poll manager
/admin/settings → Daily limit + category manager

## Supabase Tables
profiles, kiosks, categories, items, swipes,
daily_swipe_counts, polls, poll_votes, feedback, config

## Critical Business Rules
1. Swipe deck filters: is_available=true, deleted_at IS NULL,
   exclude items where a swipes row already exists for current user
2. Daily swipe limit is read from config table key='daily_swipe_limit'
3. When limit hit: show DailyLimitScreen, other tabs still accessible
4. Feedback INSERT blocked by RLS if user has 3+ rows in last 1 hour
5. Feedback SELECT only for subscribed kiosk owners (is_subscribed=true)
6. Soft delete kiosks: set deleted_at timestamp, never hard delete
7. Only 1 active poll at a time (enforced by DB check constraint)
8. Veg-only mode stored in localStorage, filters entire app client-side
9. Swipe history reset: only liked+disliked rows deleted,
   want_to_try rows are kept permanently
10. Trending uses timestamp-based WHERE clauses on swipes table
    (no separate counter columns)
11. Top Rated uses wilson_score() SQL function (defined in migration)
12. Unsubscribed kiosks: items still shown in student deck,
    owner sees basic stats only, no feedback access
13. PWA install prompt triggers only after swipeCount >= 5
14. One-time kiosk owner password shown once on screen, never again
15. Wilson Score formula: 95% confidence interval lower bound

## Design System (read /stitch-designs/design_system/ before any styling)
### Color Tokens
- Background base: #131313 (surface)
- Deepest background: #0E0E0E
- Primary accent: #FF8C00 (primary_container)
- Primary light: #FFB77D (primary)
- Card surface: #201F1F (surface_container)
- Glass layer: #3A3939 at 40% opacity + backdrop-blur: 20px
- Text primary: #E5E2E1 (NEVER use pure #FFFFFF)
- Border radius: 1.5rem (xl) on all cards

### Typography
- Font: Plus Jakarta Sans (import from Google Fonts)
- Headlines: font-weight 700
- Body: line-height 1.5
- Micro-copy: letter-spacing +5%

### Hard Styling Rules (NEVER break these)
1. NEVER use 1px solid borders — use background shifts instead
2. NEVER use #000000 shadows — use Lume Shadow only
   (Lume Shadow = primary_container at 8% opacity, blur 1.5rem)
3. NEVER use #FFFFFF for text — always use #E5E2E1
4. ALL cards use glassmorphism: backdrop-blur + semi-transparent bg
5. Card border glow = linear-gradient from #FFB77D 30% to #FF8C00 0%
6. 8-point spacing grid throughout
7. Student app accent = orange (#FF8C00)
8. Kiosk owner panel accent = blue (#3b82f6)
9. Super admin panel accent = blue (#3b82f6), desktop layout

## Design Files Location
All screen designs are in /stitch-designs/ — read the relevant
folder before building each component. Match designs exactly.

- campusbite_landing_screen     → Landing page
- student_login_screen          → Student Google login
- campusbite_home_swipe_screen  → Student swipe deck
- swipe_feedback_states         → Like/Nope overlay states
- all_caught_up                 → Daily limit screen
- trending_now                  → Trends tab
- campus_analytics_stats        → Stats tab
- profile_tab                   → Profile tab
- food_review_modal             → Feedback modal
- kiosk_owner_dashboard         → Kiosk items tab
- add_new_item_form             → Add item modal
- kiosk_customer_feedback       → Kiosk feedback tab
- kiosk_performance_stats       → Kiosk stats tab
- kiosk_polls_tab               → Kiosk polls tab
- super_admin_dashboard         → Super admin kiosks tab
- poll_manager_dashboard        → Super admin polls tab
- super_admin_feedback          → Super admin feedback tab
- super_admin_settings          → Super admin settings tab
- design_system                 → Full design tokens and style guide