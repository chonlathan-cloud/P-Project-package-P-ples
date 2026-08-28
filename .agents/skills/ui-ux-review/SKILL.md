---
name: ui-ux-review
description: Review DD Box frontend pages and components against the canonical design system before implementation or completion. Use for UI critique, approved implementation planning, and final visual-quality review; do not use for backend, API, data, infrastructure, or operational changes.
---

# DD Box UI/UX review

Read repository-root `DESIGN.md` completely before every review. Inspect the target components, their data states, and neighboring pages. Identify the primary user task and primary visual anchor before making recommendations.

Prefer existing components, patterns, and semantic tokens. Review product and task clarity, visual hierarchy, information density, responsive behavior, semantics and accessibility, design-system consistency, and maintainability. Detect excessive cards, nested rounded containers, decorative gradients, weak hierarchy, duplicate CTAs, excessive whitespace, badges, ornamental icons, and unnecessary helper text.

Prefer `remove > simplify > merge > restructure > add`. Preserve backend behavior, API contracts, authentication, domain models, business rules, and factual approval boundaries.

## Choose one mode

### Critique Mode

Review only; do not modify files. For every finding use exactly one recommendation label: `REMOVE`, `MERGE`, `MOVE`, `REDUCE`, `EMPHASIZE`, `REPLACE`, or `KEEP`. Tie each finding to a user task, evidence in the inspected UI, and a testable acceptance condition. Separate blocking findings from optional refinements.

### Implementation Plan Mode

Do not modify files. Convert only approved critique into a focused plan that names affected files, components to reuse, layout changes, responsive behavior, accessibility behavior, data/error states, and regression risks. Explicitly state unchanged API or business behavior.

### Final Review Mode

Review the rendered result and relevant implementation. Score each dimension from 1–5:

1. product and task clarity;
2. visual hierarchy;
3. information density;
4. responsive behavior;
5. semantics and accessibility;
6. design-system consistency;
7. maintainability.

Assign AI-template smell `LOW`, `MEDIUM`, or `HIGH` with concrete evidence. Never approve `HIGH`. A `MEDIUM` result must list the remaining tradeoff and responsible owner; `LOW` may pass when independent accessibility, responsive, and token checks also pass.

## Output

State mode, inspected scope, primary task, and visual anchor. Report findings in priority order with file or screen locations. End with a clear gate result: `PASS`, `PASS WITH ACCEPTED MEDIUM RISK`, or `FAIL`.
