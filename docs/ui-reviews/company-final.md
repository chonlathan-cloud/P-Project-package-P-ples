# Company final UI review

## Review scope

- Mode: Final Review Mode
- Screen: `/company`
- Primary task: establish B2B confidence and route visitors into the correct quote path based on whether they already have specifications
- Visual anchor: team collaboration hero followed by confirmed company facts and real factory references
- Reference: `DESIGN.md` and the approved About Us direction
- Review date: 2026-08-29

## Score

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Product and task clarity | 5/5 | The hero states DD Box's packaging-partner role and gives separate outcomes for visitors with specifications and visitors who need guidance. |
| Visual hierarchy | 5/5 | The page moves from role and verified facts to origin, process, production evidence, responsibility, customer fit, location, and a final two-path CTA. The closing CTA now uses a cream surface and yellow entry rule, so it is visibly distinct from the dark footer. |
| Information density | 5/5 | Six substantive themes use editorial grids, rules, and contrasting sections instead of repeated cards or a long company-history narrative. |
| Responsive behavior | 4/5 | Desktop and narrow mobile checks showed no horizontal overflow; hero actions, factory media, and the two closing paths stack correctly and keep 48px touch targets above the sticky contact bar. A dedicated 200% zoom audit remains advisable before production. |
| Semantics and accessibility | 4/5 | Heading order, labelled facts region, figures and captions, ordered process and customer lists, labelled aside, address, meaningful alt text, and outcome-based links are present. Screen-reader testing remains a production follow-up. |
| Design-system consistency | 5/5 | The implementation uses the canonical yellow, cream emphasis surface, dark footer, square editorial media, concise Thai headings, and primary/secondary action hierarchy without decorative gradients, badges, or nested rounded cards. |
| Maintainability | 5/5 | Approved company facts are centralized in the typed content model and protected by invariant tests; unapproved proof and universal MOQ claims remain omitted. |

## AI-template smell

MEDIUM — the layout and copy are specific to DD Box's B2B qualification journey, but the hero is an AI-generated development placeholder on a credibility-sensitive page. It is visibly labelled as simulated and contains no customer branding, which limits development-stage risk.

Responsible owner: the business/content owner must replace the generated hero with an approved real team or factory image before production. The existing low-resolution factory references should also be replaced with higher-resolution originals when available.

## Remaining risks

- Replace the generated hero before production and remove its development caption at the same time.
- Replace or reshoot the low-resolution factory images; they are genuine references but soft at large display sizes.
- Publish certifications, reviews, client logos, and case studies only after approval is represented in structured content.
- Keep exact MOQ omitted until it is qualified and approved per product configuration.
- Complete independent screen-reader and 200% zoom testing before production release.

## Gate

PASS WITH ACCEPTED MEDIUM RISK
