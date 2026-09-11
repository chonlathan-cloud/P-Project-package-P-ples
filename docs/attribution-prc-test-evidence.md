# Attribution and Lead export — PR-C Test evidence

Date: 2026-09-10
Environment: Test only (`ddbox-test`)

## Deployed revisions

- Content API: `ddbox-content-api-test-00011-xkf`, image digest `sha256:1d157d55b01409f3928946b9be6eaee5ce2148511ab7a4c262f8380191099d67`, 100% traffic.
- Web: `ddbox-web-test-00024-gvc`, image digest `sha256:80b99e11047e169ecc70e408d3f2f320b3cfa869cd1cb351110ff1b5df8d46f1`, 100% traffic.
- Production was not changed.

## Automated verification

- Content API: ruff passed, mypy passed for 34 source files, pytest passed 59 tests. One upstream Starlette/httpx deprecation warning remains.
- Web: Prettier passed, TypeScript passed, ESLint passed, Vitest passed 143 tests in 32 files, and the Next.js production build completed.
- Covered behavior includes attribution parsing/TTL/first-last/revoke, consent snapshots, sanitized page fields, idempotency compatibility, Firestore export ranges, formula-safe XLSX cells, unauthorized export, binary download headers, and Admin loading/error/duplicate guards.

## Live Test verification

- Authenticated Admin export completed for a seven-day Bangkok range and returned a generated workbook with 9 Test records.
- The API rejected an unauthenticated export with 403 and exposed `Content-Disposition`, `X-DDBox-Export-ID`, `X-DDBox-Record-Count`, and `X-Request-ID` through CORS.
- Synthetic Web → BFF → API → Firestore → notification test reference: `DD-60A7ED3936`.
- Firestore stored `lead_origin=website_form`, `attribution_status=captured`, consent mode `all`, campaign `qa_attribution`, a present test-only GCLID, sanitized `/quote` paths, fingerprint version 2, and notification status `sent`.
- Both deployed revisions reported zero ERROR-level Cloud Run log entries during the verification window.

## Deferred gates

- No Production deployment or Google Ads change was made.
- Privacy wording, server retention, access policy, and deletion/revocation process still require business approval before Production attribution capture.
- PR-D must validate repeat import, non-overwrite of sales-owned fields, and the New → Won-with-test-PO workflow in the master workbook.
