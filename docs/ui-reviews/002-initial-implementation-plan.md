# Initial public-shell implementation plan

Mode: Implementation Plan Mode  
Approved critique: `docs/ui-reviews/001-home-critique.md`  
Primary task: choose a quote path and submit a validated lead  
Primary visual anchor: code-native package geometry plus server-rendered gallery work

## Files and reuse

- `src/app/layout.tsx`, `src/components/site-header.tsx`, and `src/components/site-footer.tsx`: shared semantic shell and real navigation.
- `src/app/page.tsx`: audience-specific hero, two path links, continuous three-stage offer comparison, process context, and gallery preview.
- `src/app/gallery/page.tsx` plus `src/lib/content-api.ts`: server-render published API content with useful empty/error states.
- `src/app/quote/page.tsx` and `src/features/leads/quote-form.tsx`: progressive client form with path-dependent fields, error summary, idempotency key, loading state, and thank-you navigation.
- `src/styles/globals.css`: canonical semantic tokens, non-card section hierarchy, responsive layout, focus states, and reduced motion.

## Responsive and accessibility behavior

- Collapse hero and offer comparison to one column without changing reading order.
- Maintain 44px targets, visible labels, high-contrast focus, status announcements, error summary focus, and entered values after failure.
- Add the mobile action bar only outside form pages and respect safe-area insets.
- All primary copy, navigation, canonical metadata, and gallery output remain available in server HTML.

## Data and failure states

- Gallery fetch failure and empty collection produce distinct Thai messages without manufacturing proof.
- Lead API problems map to a general user-safe message while retaining request ID for support.
- Admin route remains `noindex`; Firebase ID tokens authorize API calls only and never grant browser Firestore access.

## Unchanged behavior and risk

- Python API contracts, Firebase authorization, Firestore ownership, customer-permission rules, and business facts remain unchanged.
- Risk: approved business content and authentic high-resolution media are absent, so launch-quality claims/proof sections remain intentionally omitted.

Gate result: PASS for implementation.
