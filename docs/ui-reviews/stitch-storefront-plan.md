# Stitch storefront implementation plan

## Scope

Translate the approved Stitch direction into the existing Next.js storefront using `Package/DESIGN.md` theme values reconciled into root `DESIGN.md`. Preserve backend contracts and content safety.

## Components and pages

- `src/components/site-header.tsx`: real logo, compact desktop nav, accessible mobile disclosure, persistent quote CTA.
- `src/components/site-footer.tsx`: Stitch-inspired navy footer with product/support navigation and no invented company facts.
- `src/components/mobile-actions.tsx`: one dominant quote action plus a contact link; hidden on quote/admin routes.
- `src/app/page.tsx`: image-led hero, asymmetric capability grid, factual workflow proof, editorial work preview, customer-stage offers, process CTA.
- `src/app/products/page.tsx` and product detail pages: image-aware category presentation and retained brief requirements.
- `src/app/solutions/page.tsx` and solution details: overview route and Stitch-like cream/technical structure without fabricated claims.
- `src/app/gallery/page.tsx` and `src/components/gallery-grid.tsx`: centered editorial heading, filters-as-context, asymmetric media grid, explicit empty/error states.
- `src/app/company/page.tsx`: supplied factory imagery with qualified, non-certification copy.
- `src/app/contact/page.tsx` and quote surfaces: Stitch split composition while retaining the existing canonical lead form and omitting unconfirmed contact data.
- `src/styles/globals.css`: Package theme tokens, Libre Franklin-compatible stack with Thai fallbacks, responsive layouts, interaction states, reduced motion, and admin compatibility.

## Assets

Copy only owner-supplied logo, factory, and unbranded packaging imagery into `public/images`. Stitch screenshots/HTML remain local design references and are excluded from version control.

## Behavior preserved

- `/api/leads` request/response contract, schema validation, idempotency, consent, error focus, and confirmation routing.
- CMS gallery publish gate and explicit unavailable/empty states.
- Existing metadata and canonical routes, extended only for new overview/company pages.

## Acceptance

- Visual hierarchy closely matches Stitch at desktop and mobile without using prototype runtime dependencies.
- Works at 320px, keyboard-only, Escape/mobile-menu flow, reduced motion, and safe-area mobile action bar.
- No unverified business fact, customer brand, dead contact link, or placeholder logo.
- Typecheck, lint, unit tests, production build, and visual review complete.
