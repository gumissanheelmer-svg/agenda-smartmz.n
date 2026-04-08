

# Security Hardening Plan — Agenda Smart

## Current Security Assessment

The system already has solid foundations:
- RLS policies on all tables with role-based access (superadmin, admin, manager, barber)
- Security Definer RPCs for sensitive operations (appointments, payments)
- Global unique transaction codes (anti-fraud)
- JWT-based auth via Supabase
- Edge functions verify superadmin role via `getClaims()`

Gaps identified:
- No client-side rate limiting on login/register forms
- No audit/security log table
- No automatic account lockout after failed attempts
- No session timeout mechanism
- Generic error messages already in place (good), but some `console.error` calls expose internal details
- Admin dashboard guards are client-side only (redirect in useEffect) — RLS covers the data layer but UI routes lack server-side enforcement
- No IP-based restrictions (not feasible in a pure client-side app without a proxy)

## Implementation Plan

### 1. Rate Limiting (Client + Edge Function)

**Client-side**: Add a rate limiter utility using localStorage timestamps.
- Login: 5 attempts per 60 seconds; show cooldown timer
- Register: 3 attempts per 60 seconds

**Edge Function** (`security-guard`): Create a new function for server-side rate limiting using an `auth_events` table to track attempts by IP/email.

Files: `src/lib/rateLimiter.ts`, `src/pages/Login.tsx`, `src/pages/BarbershopRegister.tsx`

### 2. Security Audit Log Table

Create `security_events` table:
- `id`, `created_at`, `event_type` (login_success, login_failed, account_locked, suspicious_activity, password_reset, role_change)
- `user_id` (nullable), `email`, `ip_address` (nullable), `metadata` (jsonb)
- RLS: superadmin read-only

Create edge function `log-security-event` to record events server-side with IP capture from request headers.

Migration: new table + RLS policies

### 3. Automatic Account Lockout

In the `log-security-event` edge function:
- After 10 failed login attempts within 15 minutes for the same email, set a lockout flag
- Return lockout status to the client
- Lockout duration: 15 minutes (auto-expire)

Client: check lockout status before allowing login attempt.

### 4. Input Sanitization Layer

Create `src/lib/sanitize.ts`:
- `sanitizeText(input)`: trim, strip HTML tags, limit length
- `sanitizePhone(input)`: allow only digits and `+`
- `sanitizeEmail(input)`: trim, lowercase, validate format

Apply to: Login form, Register form, BookingForm, all admin input forms.

### 5. Error Handling Hardening

- Audit all `catch` blocks: remove `console.error` with raw error objects in production
- Create `src/lib/errorHandler.ts` with a safe logger that strips sensitive data
- User-facing errors remain generic ("Ocorreu um erro. Tente novamente.")

### 6. Session Expiration

Configure Supabase client with explicit session timeout:
- Add idle timeout detection (30 minutes of inactivity → auto sign-out)
- Create `src/hooks/useSessionTimeout.tsx` that monitors user activity and calls `signOut()` after inactivity
- Integrate into `App.tsx` inside `AuthProvider`

### 7. Route Protection Component

Create `src/components/ProtectedRoute.tsx`:
- Wraps admin/superadmin routes
- Checks auth state + required role
- Redirects to `/login` if unauthorized
- Replaces current `useEffect` redirect pattern in `AdminDashboard` and `SuperAdminDashboard`

### 8. Payment Validation Hardening

Already implemented (unique transaction codes, anti-reuse). Add:
- Maximum confirmation text length validation (2000 chars) in `submit_payment_confirmation`
- Rate limit payment submissions: max 3 per appointment per hour

### 9. IP-Based Restrictions

Since this is a client-side app, true IP blocking requires an edge function proxy. Implementation:
- The `log-security-event` edge function captures `x-forwarded-for` from request headers
- If an IP has 20+ failed events in 1 hour, subsequent requests from that IP are rejected
- Applied to login and payment endpoints only

### 10. Security Headers

Add security headers to `vercel.json`:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` to restrict camera, microphone, geolocation

## Files to Create/Edit

| File | Action |
|---|---|
| `src/lib/rateLimiter.ts` | Create — client-side rate limiter |
| `src/lib/sanitize.ts` | Create — input sanitization utilities |
| `src/lib/errorHandler.ts` | Create — safe error logging |
| `src/hooks/useSessionTimeout.tsx` | Create — idle timeout hook |
| `src/components/ProtectedRoute.tsx` | Create — role-based route guard |
| `src/pages/Login.tsx` | Edit — add rate limiting + sanitization |
| `src/pages/BarbershopRegister.tsx` | Edit — add rate limiting + sanitization |
| `src/App.tsx` | Edit — wrap routes with ProtectedRoute |
| `supabase/functions/log-security-event/index.ts` | Create — audit logging + lockout + IP tracking |
| `supabase/migrations/xxx_security_hardening.sql` | Create — security_events table |
| `vercel.json` | Edit — add security headers |
| `supabase/config.toml` | Edit — register new edge function |

## What Will NOT Be Changed
- Existing RLS policies (already solid)
- Payment flow logic
- Booking flow
- Existing edge functions
- `src/integrations/supabase/client.ts` (auto-generated)

