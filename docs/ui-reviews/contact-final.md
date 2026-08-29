# Contact final UI review

## Review scope

- Mode: Final Review Mode
- Screen: `/contact`
- Primary task: start and continue a customer conversation through DD Box LINE Official Account, with direct sales, phone, Facebook, email, and a structured brief as secondary paths
- Visual anchor: a named responsible contact followed by a prominent LINE OA add-friend action and approved QR code
- Reference: `DESIGN.md` and the approved Contact critique
- Review date: 2026-08-29

## Score

| Dimension | Score | Evidence |
| --- | ---: | --- |
| Product and task clarity | 5/5 | LINE OA is explicitly named and prioritized in the hero, the recommended-channel block, footer, and global mobile shortcut; direct sales and other channels retain distinct purposes. |
| Visual hierarchy | 5/5 | The page progresses from one primary LINE OA action to its QR proof, then to four editorial secondary-channel rows, brief preparation, and factory location without competing primary CTAs. |
| Information density | 5/5 | The recommended channel receives one focused surface while LINE Sales, phone, Facebook, and email remain compact rule-separated rows with clear use cases. |
| Responsive behavior | 4/5 | Desktop and narrow mobile checks showed no horizontal overflow; the QR remains crisp on desktop and is intentionally omitted on mobile in favor of a full-width add-friend action. Independent 320px physical-device and 200% zoom testing remain advisable. |
| Semantics and accessibility | 4/5 | Heading order, labelled primary and secondary contact navigation, descriptive native links, QR alt text, an address element, focus-visible styling, and touch-sized actions are present. Screen-reader testing remains a production follow-up. |
| Design-system consistency | 5/5 | The featured OA surface uses canonical cream, red, typography, and editorial rules without gradients or nested cards; the persistent quote CTA remains the only header-level high-emphasis action. |
| Maintainability | 5/5 | OA, sales LINE, phone, email, and Facebook values are centralized in the typed company model; contact, footer, and mobile actions consume the same canonical fields, with focused tests covering the approved QR and routes. |

## AI-template smell

MEDIUM — the page is organized around DD Box's approved LINE OA identity, direct-sales contact, verified channels, brief inputs, and actual location rather than generic contact cards. The supplied QR and channel data are authentic, but the hero remains an AI-generated development image. The non-identifying hands-only composition and explicit caption prevent it from representing a named person, customer project, or factual factory proof.

Responsible owner: the business/content owner must replace the generated hero with an approved real consultation, team, or packaging-development photo before production.

## Remaining risks

- Replace the generated hero and its development caption together before production.
- The remaining factory-location image is authentic but low resolution; replace it with an approved high-resolution original when available.
- If campaign attribution or automated CRM synchronization is required, define tracking consent, source parameters, webhook ownership, and retention separately; this change only routes customers to LINE OA.
- Add business hours or factory-visit instructions only after owner confirmation.
- Complete independent screen-reader and 200% zoom testing before production release.

## Gate

PASS WITH ACCEPTED MEDIUM RISK
