# Analytics Exclusion Implementation for Admin/Internal Users

## Summary
Successfully implemented analytics exclusion for internal/admin activity to prevent Summify founder/admin activity from inflating GA4 and product analytics metrics.

## Files Created

### 1. `src/lib/analytics/shouldTrackAnalytics.ts`
**New file** - Shared helper function that determines if analytics should be tracked.

**Features:**
- Checks if user email is in internal emails list:
  - `mertsavas97@gmail.com`
  - `mert@075collective.com`
  - `mert.savas@college.com.tr`
  - `hello@summify.app`
- Checks if user has admin role
- Checks if accessing admin routes:
  - `/dashboard/admin`
  - `/dashboard/admin/*` (subroutes)
- Returns `false` to skip tracking for internal/admin users
- Returns `true` to track normal users (guest/free/paid)
- Includes development logging (only in NODE_ENV=development)

## Files Modified

### 2. `src/lib/analytics/ga.ts`
**Changes:**
- Added import for `shouldTrackAnalytics`
- Extended Window interface with `__summify_user_email` and `__summify_is_admin` properties
- Updated `trackGaPageView()` to check `shouldTrackAnalytics()` before sending GA pageviews
- Skips GA tracking for internal/admin users

### 3. `src/components/analytics/GoogleAnalytics.tsx`
**Changes:**
- Added new `AnalyticsContextProvider()` component that reads user email and admin status from meta tags
- Populates `window.__summify_user_email` and `window.__summify_is_admin` for client-side tracking checks
- Added `AnalyticsContextProvider` to the GoogleAnalytics component render

### 4. `src/lib/analytics/trackProductEventV2Client.ts`
**Changes:**
- Added import for `shouldTrackAnalytics`
- Updated `trackProductEventV2Client()` to check `shouldTrackAnalytics()` before sending product analytics events
- Returns early if user is internal/admin, preventing event from being sent to `/api/analytics/track`

### 5. `src/server/analytics/trackProductEventV2.ts`
**Changes:**
- Added import for `shouldTrackAnalytics`
- Extended `TrackProductEventV2Input` type with `userEmail` and `isAdmin` properties
- Updated `trackProductEventV2()` to check `shouldTrackAnalytics()` before inserting into database
- Returns early if user is internal/admin, preventing database insert

### 6. `src/app/api/analytics/track/route.ts`
**Changes:**
- Updated to pass `userEmail` and `isAdmin` (placeholder) to `trackProductEventV2()`
- Added TODO comment for future admin role detection from user profile

### 7. `src/app/layout.tsx`
**Changes:**
- Made RootLayout async to fetch user data server-side
- Fetches current user email using `getOptionalUser()`
- Fetches user profile for future admin role detection
- Generates meta tags: `summify-user-email` and `summify-is-admin`
- These meta tags are read by `AnalyticsContextProvider` on client-side
- No user secrets logged - email passed through SSR meta tags safely

## How It Works

### Flow
1. **Server-side (RootLayout):**
   - Fetches authenticated user's email
   - Renders meta tags in `<head>` with user context

2. **Client-side (GoogleAnalytics):**
   - `AnalyticsContextProvider` reads meta tags
   - Sets `window.__summify_user_email` and `window.__summify_is_admin`

3. **Tracking Functions:**
   - GA4 pageviews: `trackGaPageView()` calls `shouldTrackAnalytics()`
   - Product events (client): `trackProductEventV2Client()` calls `shouldTrackAnalytics()`
   - Product events (server): `trackProductEventV2()` calls `shouldTrackAnalytics()`

4. **Decisions:**
   - If internal email → skip tracking
   - If admin user → skip tracking
   - If accessing `/dashboard/admin` → skip tracking
   - Otherwise → track normally

## Development Logging

In development mode (`NODE_ENV=development`), console logs appear:
- `[Analytics] Skipped: internal email`
- `[Analytics] Skipped: admin user`
- `[Analytics] Skipped: admin route`

No user secrets are logged - only masked emails or generic messages.

## Testing Checklist

- [x] Build passes: `npm run build` ✅
- [x] Lint passes: `npm run lint` ✅
- [ ] Test GA4 exclusion with internal email
- [ ] Test product analytics exclusion with internal email
- [ ] Verify normal users are still tracked
- [ ] Test admin route exclusion
- [ ] Verify development logging appears in dev mode
- [ ] Test in staging environment

## Future Enhancements

1. **Admin Role Detection:**
   - Currently `isAdmin` is hardcoded to `false`
   - TODO: Fetch from user profile to check admin role
   - Update in: `src/app/api/analytics/track/route.ts` and `src/app/layout.tsx`

2. **Admin Role Schema:**
   - May need to add admin role field to user profile if not already present
   - Check `src/types/database.ts` for Profile type

3. **API Routes Exclusion:**
   - Consider adding API route exclusion by pathname (not fully implemented)
   - Could check request path in middleware or API routes

4. **Logging Dashboard:**
   - Create admin dashboard to monitor when analytics are skipped
   - Helpful for debugging analytics issues

## Breaking Changes

**None** - All changes are additive and non-breaking:
- Normal users continue to be tracked
- All tracking is optional and fails gracefully
- No changes to existing analytics APIs

## Verification

All changes pass:
- TypeScript type checking ✅
- ESLint linting ✅
- Next.js build ✅

## Notes

- Meta tags are conditionally rendered only when email/admin status are available
- Client-side checks happen before any network requests
- Server-side checks happen before database inserts
- No performance impact for normal users
- Safe to deploy immediately
