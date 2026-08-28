# Stitch storefront critique

Reference: Google Stitch project `DD Box Printing E-Commerce Storefront` (`1683649861335380565`) and its desktop/mobile Home, Solutions, Gallery, Company, and Contact screens.

## Gate

PASS WITH CONSTRAINTS. Adopt the Stitch composition, visual rhythm, yellow/red/navy palette, image-led hierarchy, and responsive navigation. Do not ship generated prototype facts, placeholder brands, customer-branded images without publish permission, fake contact details, MOQ, certifications, delivery claims, or CDN-dependent prototype code.

## Findings

- REPLACE the abstract yellow hero and drawn package boxes with the Stitch image-led factory hero. Acceptance: one dominant headline, one supporting paragraph, one primary quote action, one secondary product action, readable over the image at 320px through desktop.
- REPLACE the text-only brand mark with the supplied DD Box Printing logo. Acceptance: intrinsic dimensions, descriptive home link, no layout shift.
- REPLACE the desktop-only navigation with the Stitch header composition plus an accessible mobile disclosure. Acceptance: real links to Products, Solutions, Gallery, Company, Contact, and Quote; Escape closes the mobile menu and focus returns to its trigger.
- MERGE the two oversized audience path cards into the hero CTA pair. Acceptance: both `has_specifications` and `needs_guidance` paths remain reachable without competing primary buttons.
- MOVE packaging categories into an asymmetric image-led capability section modeled on Stitch. Acceptance: hierarchy comes from media scale, not repeated identical cards.
- KEEP approved CMS gallery data, its empty/error states, and publish-permission boundary. Acceptance: no Stitch placeholder brand strip or branded mockup is shipped.
- REPLACE the current list-heavy gallery presentation with the Stitch editorial grid while retaining server-loaded content and factual captions.
- REDUCE heavy black rules, block shadows, and oversized yellow surfaces. Acceptance: separators use design tokens and yellow is reserved for action/highlight.
- EMPHASIZE the existing quote flow as the primary conversion path across header, hero, footer, and mobile sticky action.
- REMOVE fake claims from the Stitch screens, including ISO, cost/delivery guarantees, MOQ, and sample phone/address/LINE data. Acceptance: unavailable facts are omitted or explicitly marked as awaiting owner confirmation.
- KEEP the existing backend/API, idempotent lead submission, consent, validation, and data-safe content behavior unchanged.

## Evidence and task fit

The current storefront is a strong functional vertical slice but reads as a graphic prototype: abstract boxes, thick outlines, shadow blocks, and row lists dominate. The Stitch reference is an editorial industrial storefront with a compact header, photographic hero, asymmetric capability media, cream content sections, and navy footer. The redesign must close that visual gap without weakening the repository's stronger content-safety and accessibility controls.
