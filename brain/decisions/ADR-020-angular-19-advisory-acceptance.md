# ADR-020 - Angular 19 advisory acceptance in staging demo

## Status

Accepted on 2026-09-19.

## Context

`npm audit --omit=dev` reports 7 advisories (3 high, 4 moderate) against `@angular/common`, `@angular/compiler`, `@angular/core`, `@angular/forms`, `@angular/platform-browser*` and `@angular/router` at `19.2.25`, which is the last release of the 19 line. The advisories cover `HttpTransferCache` cache-key ambiguity and information leak, a `formatDate` denial of service and a two-way binding sanitization bypass. No patch exists inside the 19 line, so the only remediation is a major upgrade.

The FlowCore staging surface is a portfolio demo: a single Angular SPA on Netlify talking to one Laravel API, with demo accounts, seeded data and no real user data. The SPA is client-rendered and does not run server-side rendering, which is the delivery mode the `HttpTransferCache` advisories target.

`npm run fitness` chains `audit` as its last step, so the gate stays red while the advisories are open.

## Options considered

- Upgrade Angular to a supported major line before closing phase 9. Clears the advisories, but pulls a breaking framework migration into a phase whose scope is external smoke, and risks the builder surface built on `@foblex/flow`.
- Drop `audit` from `npm run fitness`. Rejected: it hides the signal instead of deciding on it, and weakens a gate for every future task.
- Accept the risk for the staging demo and keep the gate red until a dedicated upgrade task. Chosen.

## Decision

Accept the advisories for the staging demo. `npm run fitness` is expected to fail on its `audit` step while they are open, and that failure does not block phase 9. The Angular major upgrade is a separate task, not part of external smoke work.

## Consequences

- Any task that runs `npm run fitness` must read the audit step failure against this ADR before treating it as a regression, and must confirm the failing advisories are still only these Angular ones.
- The acceptance covers the staging demo only. Real user data, authentication against a real identity provider or server-side rendering would each void it and require the upgrade first.
- `brain/canonico/KNOWN_ISSUES.md` carries the open limitation while it lasts.
- The upgrade task must revisit this ADR and supersede it once the advisories clear.
