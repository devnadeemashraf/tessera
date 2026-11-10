# Verified versions and external facts

Verification date: 2026-11-10; pins in executable manifests are authoritative; future frameworks are not installed until their scoped spike verifies them.
Go 1.27.3 — installed and official stable release verified; BSD-3-Clause; https://go.dev/dl/?mode=json and https://go.dev/LICENSE.
Node 24.22.0 — installed; official release checksum list verified; maintained LTS line, MIT with bundled notices; https://nodejs.org/dist/v24.22.0/SHASUMS256.txt and https://github.com/nodejs/node/blob/main/LICENSE.
npm 11.19.1 — installed with Node; Artistic-2.0; exact package verification belongs to P0-02; https://github.com/npm/cli/blob/latest/LICENSE.
just 1.59.0 — installed; CC0-1.0; https://github.com/casey/just/releases/tag/1.59.0 and https://github.com/casey/just/blob/master/LICENSE.
mise 2026.10.19 — installed; MIT; optional toolchain installer; https://github.com/jdx/mise/releases/tag/v2026.10.19 and https://github.com/jdx/mise/blob/main/LICENSE.
Prettier 3.9.10 / ESLint 10.14.0 / @eslint/js 10.0.1 / fast-check 4.10.2 — current public npm metadata verified, MIT; registry.npmjs.org package metadata and upstream LICENSE files.
TypeScript 7.0.2 — current public npm metadata verified, Apache-2.0; https://registry.npmjs.org/typescript/latest.
c8 12.0.0 — current public npm metadata verified, ISC; https://github.com/bcoe/c8 and npm metadata.
@types/node 24.19.2 — available Node-24 declarations verified; MIT, verify license on installation; https://www.npmjs.com/package/@types/node.
Gitleaks 8.30.1 — maintained release verified, MIT CLI (not paid hosted action); https://github.com/gitleaks/gitleaks/releases/tag/v8.30.1 and repository LICENSE.
Trivy 0.76.2 — maintained release verified, Apache-2.0; https://github.com/aquasecurity/trivy/releases/tag/v0.76.2 and repository LICENSE.
gosec 2.30.0 — maintained release verified, Apache-2.0; https://github.com/securego/gosec/releases/tag/v2.30.0 and repository LICENSE.txt.
GitHub actions/checkout 7.0.1, setup-node 7.1.0, setup-go 7.0.0 — official latest releases verified; MIT; immutable commit pins and licenses verified in P0-02.
Render Free — sleeps after 15 idle minutes, cold start about one minute, ephemeral filesystem, 750 instance hours/workspace/month; Free Postgres expires after 30 days; provider discourages production use; https://render.com/docs/free.
Neon Free — non-expiring, no card required, 1 GB storage and 100 CU-hours per project/month at verification; shared service capacity is finite; https://neon.com/pricing.
Cloudflare Pages / GitHub Releases — free static hosting and binary distribution selected; current account limits must be verified at P0-06 before deployment; https://developers.cloudflare.com/pages/platform/limits/ and https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases.
Paddle / Dodo — candidate merchants only, not approved accounts; verify fees, password-manager eligibility, India onboarding and payout terms in P0-06; https://www.paddle.com/pricing and https://docs.dodopayments.com/miscellaneous/merchant-acceptance.
React / Capacitor / Wails / gomobile / Astro / crypto and database libraries — UNVERIFIED pins, intentionally not dependencies yet; P0-03/06/07 must verify official versions, APIs, licenses and native compatibility before adoption.
