# Custom Boxes & Custom Packaging

## Mission

Create implementation-ready, token-driven UI guidance for Custom Boxes & Custom Packaging that is optimized for consistency, accessibility, and fast delivery across e-commerce storefront.

## Brand

- Product/brand: DD Box Printing (Custom Boxes & Custom Packaging)
- URL: https://www.ddboxprinting.com/
- Audience: B2B clients, online shoppers, and consumers
- Product surface: e-commerce storefront

## Style Foundations

- Visual style: clean, functional, energetic, implementation-oriented
- Main font style: `font.family.primary=Libre Franklin`, `font.family.stack=Libre Franklin, Arial, sans-serif`, `font.size.base=20px`, `font.weight.base=400`, `font.lineHeight.base=30px`
- Typography scale: `font.size.xs=12px`, `font.size.sm=14px`, `font.size.md=16px`, `font.size.lg=20px`, `font.size.xl=26px`, `font.size.2xl=32px`, `font.size.3xl=48px`, `font.size.4xl=58px`

### Color Palette (Updated for Customer Theme)
*Note: Text colors are set to dark shades to maintain WCAG 2.2 AA contrast ratios against the yellow/white surfaces.*
- Brand colors: `color.brand.primary=#FFCC00` (Energetic Yellow), `color.brand.secondary=#E63946` (Action Red)
- Text colors: `color.text.primary=#111827` (Near Black for readability), `color.text.secondary=#4B5563` (Dark Gray), `color.text.on-primary=#000000` (Black text on Yellow background), `color.text.on-secondary=#FFFFFF` (White text on Red background)
- Surface/Border colors: `color.surface.base=#FFFFFF` (Clean White), `color.surface.raised=#FFF9E6` (Very faint yellow tint for raised cards), `color.border.strong=#E5E7EB`

- Spacing scale: `space.1=7px`, `space.2=8px`, `space.3=12px`, `space.4=14px`, `space.5=16px`, `space.6=20px`, `space.7=21px`, `space.8=23px`
- Radius/shadow/motion tokens: `radius.xs=3px`, `radius.sm=24px`, `radius.md=50px` | `motion.duration.instant=200ms`, `motion.duration.fast=300ms`, `motion.duration.normal=500ms`, `motion.duration.slow=1000ms`

## Accessibility

- Target: WCAG 2.2 AA
- Keyboard-first interactions required.
- Focus-visible rules required. (Use `color.brand.secondary` or a dark outline for focus rings on yellow buttons).
- Contrast constraints required. (Never use white text on `color.brand.primary` yellow).

## Writing Tone

Concise, confident, implementation-focused, and inviting.

## Rules: Do

- Use semantic tokens, not raw hex values, in component guidance.
- Every component must define states for default, hover, focus-visible, active, disabled, loading, and error.
- Component behavior should specify responsive and edge-case handling.
- Interactive components must document keyboard, pointer, and touch behavior.
- Accessibility acceptance criteria must be testable in implementation.

## Rules: Don't

- Do not allow low-contrast text (e.g., no yellow text on white background) or hidden focus indicators.
- Do not introduce one-off spacing or typography exceptions.
- Do not use ambiguous labels or non-descriptive actions.
- Do not ship component guidance without explicit state rules.

## Guideline Authoring Workflow

1. Restate design intent in one sentence.
2. Define foundations and semantic tokens.
3. Define component anatomy, variants, interactions, and state behavior.
4. Add accessibility acceptance criteria with pass/fail checks.
5. Add anti-patterns, migration notes, and edge-case handling.
6. End with a QA checklist.

## Required Output Structure

- Context and goals.
- Design tokens and foundations.
- Component-level rules (anatomy, variants, states, responsive behavior).
- Accessibility requirements and testable acceptance criteria.
- Content and tone standards with examples.
- Anti-patterns and prohibited implementations.
- QA checklist.

## Component Rule Expectations

- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.
- Include known page component density: links (117), buttons (28), lists (28), inputs (15), cards (6), navigation (5).

## Quality Gates

- Every non-negotiable rule must use "must".
- Every recommendation should use "should".
- Every accessibility rule must be testable in implementation.
- Teams should prefer system consistency over local visual exceptions.
