# DD Box Printing design system

Status: canonical implementation authority  
Target: Thai-first, conversion-focused B2B packaging website  
Accessibility target: WCAG 2.2 AA

## Context and goals

The interface must help two audiences act quickly: customers who already know their packaging specifications and customers who need packaging guidance. Real product work, manufacturing evidence, and clear next actions must carry the visual hierarchy. The site must not imitate a generic e-commerce dashboard or imply instant pricing.

## Foundations

### Color tokens

| Token | Value | Use |
| --- | --- | --- |
| `--color-brand-primary` | `#FFCC00` | Primary brand surfaces and highlights |
| `--color-brand-primary-hover` | `#E6B800` | Primary hover/active state |
| `--color-action` | `#E63946` | High-emphasis CTA and focus accent |
| `--color-action-strong` | `#C92A36` | Accessible action text and CTA surface |
| `--color-action-hover` | `#A91F2A` | CTA hover/active state |
| `--color-text` | `#111827` | Primary text |
| `--color-text-muted` | `#4B5563` | Secondary text |
| `--color-text-on-action` | `#FFFFFF` | Text on action surfaces |
| `--color-surface` | `#FFFFFF` | Base background |
| `--color-surface-subtle` | `#FFF9E6` | Section emphasis |
| `--color-surface-strong` | `#111827` | Footer and strong proof sections |
| `--color-border` | `#D1D5DB` | Controls and separators |
| `--color-error` | `#B42318` | Validation and destructive warnings |
| `--color-success` | `#067647` | Confirmed success state |

White text must not be used on brand yellow. Body text and interactive states must maintain WCAG AA contrast.

### Typography

- The primary family is `Libre Franklin`; Thai-first text must fall back to `Noto Sans Thai`, `Thonburi`, `Tahoma`, or a compatible sans-serif. Libre Franklin must not be the sole Thai font.
- Base body size is `20px/1.5` on desktop and `16px/1.6` below `768px`.
- Display scale: `clamp(2.5rem, 7vw, 5.5rem)`; H1: `clamp(2.25rem, 5vw, 4.5rem)`; H2: `clamp(1.75rem, 3vw, 3rem)`; H3: `clamp(1.25rem, 2vw, 1.75rem)`.
- Headings must be concise, use tight line height (`1.05–1.2`), and avoid decorative all-caps Thai text.
- Paragraph measure should stay within `68ch`.

### Spacing, shape, and motion

- Spacing scale: `4, 8, 12, 16, 24, 32, 48, 64, 96, 128px`.
- Content width: `min(100% - 32px, 1200px)`; use `48px` side gutters on wide screens when space permits.
- Control radius: `3px`; emphasized action radius: `24px`; compact pill radius (`50px`) may be used only for filters/status.
- Avoid nested rounded containers. A section should normally use layout, rules, or background contrast instead of a card wrapper.
- Motion must communicate state, complete in `120–240ms`, and respect `prefers-reduced-motion`.

### Responsive breakpoints

- Small: `< 640px`; medium: `640–1023px`; large: `>= 1024px`.
- Layouts must be content-driven and work at 320px width, 200% zoom, and with long Thai copy.
- Mobile sticky contact actions must respect safe-area insets and must not cover focused fields, submit actions, validation summaries, or consent controls.

## Component rules

### Header and navigation

- The header must expose real links for Products, Solutions, Gallery, Contact, and Quote.
- Desktop may use a sticky header. Mobile navigation must be operable by keyboard and touch, trap no focus, close on Escape, and restore focus to its trigger.
- The quote action is the only persistent high-emphasis header CTA.

### Buttons and links

- Labels must describe outcomes, such as “ส่งรายละเอียดเพื่อขอราคา” or “ดูผลงานจริง”. Do not use “Submit”, “Learn more”, or duplicated CTAs without context.
- Buttons must define default, hover, focus-visible, active, disabled, loading, success, and error behavior.
- Focus-visible must use a 3px high-contrast outline with at least 2px offset.
- Touch targets must be at least 44×44px.

### Forms

- Every control must have a persistent visible label, optional hint only when useful, and an error associated with `aria-describedby`.
- Required state must be communicated in text, not color alone. On failure, focus an error summary and preserve entered values.
- Progressive quote steps must disclose their current position and show only fields relevant to the selected customer path.
- Loading must prevent duplicate actions while keeping status announced through an appropriate live region.

### Gallery and media

- Gallery hierarchy must come from image scale and editorial grouping, not one rounded card per item.
- Images must include dimensions, meaningful Thai alt text when informative, responsive sources, and an explicit empty/error state.
- Customer branding must not be published until the content record confirms permission.
- Dialogs/lightboxes must be keyboard-operable, close on Escape, contain focus, restore focus, and retain a visible close action.

### Content and proof

- Claims, MOQ, lead time, delivery coverage, ratings, and case-study outcomes must be rendered only from approved structured fields.
- Unavailable evidence must result in section omission, not placeholder claims or fabricated client logos.
- Offers must be compared by customer stage and operating need, not by invented price tiers.

### Feedback states

- Loading, empty, success, warning, forbidden, validation, server error, and retry states must be designed for every data-backed surface.
- Error messages must identify what failed and the safe next action without exposing internals or sensitive data.

## Page hierarchy

- Home: audience-specific hero → factual trust strip → work preview → customer fit → three offers → categories → process → risk reduction → factory proof → approved case study → qualified delivery guidance → FAQ → lead form → contact.
- Product: product evidence and fit → specifications → guidance/quote path → related work → FAQ.
- Gallery: useful filters → editorial image grid → contextual details and quote action.
- Quote: customer-path choice → job details → packaging guidance → contact and consent → confirmation.
- Admin: task-first forms and tables; no marketing decoration; minimum necessary PII exposure.

## Content standards

- Thai is authoritative. English terms may appear only where they are standard industry vocabulary and improve comprehension.
- Copy should be concise, concrete, and qualified. Prefer “แจ้งสเปกเพื่อให้ทีมประเมิน” over claims of immediate or guaranteed pricing.
- Do not publish business facts that have not been supplied and approved by the owner.

## Prohibited patterns

- Excessive cards, badges, decorative gradients, floating blobs, icon grids, nested containers, or ornamental animation.
- Multiple competing primary CTAs in one viewport.
- Placeholder brands, fake testimonials, generic factory claims, dead links, or prototype-only copy.
- Autoplay carousels, JavaScript-only navigation, hidden labels, color-only status, or focus suppression.
- Arbitrary HTML from CMS content.

## QA checklist

- One dominant task and visual anchor are evident above the fold.
- Primary content and links remain useful without client-side JavaScript.
- Heading order, landmarks, names, labels, focus order, and error announcements are valid.
- All interactive states and reduced-motion behavior are testable.
- 320px, tablet, desktop, 200% zoom, long Thai copy, empty data, and failure states are verified.
- No unapproved fact, brand asset, contact detail, or SEO claim is present.
- Final `$ui-ux-review` result has AI-template smell `LOW` or an explicitly accepted `MEDIUM`, never `HIGH`.
