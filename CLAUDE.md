# Avoqado Consumer App — Project Instructions

React Native + Expo Router consumer mobile app for the Avoqado platform. Lets users (consumers) discover Avoqado-powered venues, sign in with Google or Apple, and book appointments / classes / services — paying any deposit via Stripe Connect.

## 🔴 CRITICAL — Ask which payment tier BEFORE building or changing anything

Avoqado is a tier-gated SaaS (**FREE · PRO · PREMIUM · ENTERPRISE**). Whenever you add a new
feature, modify existing behavior, or expose a new capability, **STOP and ask the founder which
paid tier it falls under** — then wire the gating to match. A change shipped without a tier
decision is unfinished: it either leaks paid value into a lower tier or hides a free capability
behind a paywall. (Consumer-facing surfaces may expose venue features that depend on the venue's tier.)

- **Backend (authoritative):** `avoqado-server/src/services/access/basePlan.service.ts` +
  `avoqado-server/src/middlewares/checkFeatureAccess.middleware.ts`. Obligatory gating questions:
  `avoqado-server/.claude/rules/feature-gating.md`. PREMIUM-only codes today: `CFDI`, `INVENTORY_TRACKING`.
- **Dashboard display/CTA map:** `avoqado-web-dashboard/src/config/plan-catalog.ts`
  (`TierId`, `PLAN_TIERS`, `getTierForFeature()` → FeatureGate upsell).
- **Enforcement status:** ✅ only **avoqado-web-dashboard** enforces tiers today.
  ⚠️ **avoqado-ios** and **avoqado-android** have NO tier gating yet — they will mirror the backend
  feature codes by exact name. Treat tier codes like permissions: a name mismatch fails silently.

## Stack

- **Runtime**: Expo SDK 54, React Native 0.81, React 19, New Architecture enabled
- **Navigation**: `expo-router` (file-based, in `/app`)
- **State**: `zustand` (auth store in `src/store/authStore.ts`)
- **Data**: `@tanstack/react-query`
- **Auth**: `expo-apple-authentication` + `@react-native-google-signin/google-signin`, token persisted via `expo-secure-store`. Backend issues a JWT; consumer is scoped to the Avoqado platform (cross-venue identity).
- **Validation**: `zod`
- **API client**: `src/api/client.ts`, base URL via `EXPO_PUBLIC_API_URL`
- **Backend**: separate repo at `../avoqado-server` (Stripe Connect, reservations, consumer auth all live there)

## Repo conventions

- File-based routes in `/app`. Layouts in `_layout.tsx`. Dynamic segments use `[param]`.
- Reusable code in `/src` (`api/`, `auth/`, `components/`, `store/`, `theme/`).
- All UI copy in **Spanish (mexicano natural)**.
- Light mode only — locked via `app.json` `userInterfaceStyle: "light"`. Do not introduce dark mode unless explicitly asked.
- No CSS-in-JS library; use `StyleSheet.create` with tokens from `src/theme/colors.ts`.
- The legacy `App.tsx` at the root is unused (entry is `expo-router/entry` per `package.json`); leave it alone unless cleaning up.

## Build & Release

- App Store / Play Store releases go through **EAS Build + EAS Submit** (config in `eas.json`).
- Bundle ID iOS: `com.avoqado.consumer` · Apple Team `ZPSQA32NDL`.
- Package Android: `com.avoqado.consumer`.
- Versioning: `version` (semver) + `ios.buildNumber` + `android.versionCode` in `app.json`. Production profile in `eas.json` has `autoIncrement: true`.
- Sign in with Apple is **required** (not optional) because the app offers Google Sign-In — App Store guideline 4.8 will reject without it.

## Behavioral Rules

- Always read a file before editing it.
- Never commit secrets, API keys, or `.env` files.
- Never proactively create `*.md` or README files unless explicitly requested. (Project memory files like this one are an exception when explicitly authored.)
- Edit existing files in preference to creating new ones.
- Keep files under ~500 lines.
- Validate input at system boundaries.

---

## Design Context

**Source of truth**: see `.impeccable.md` in this directory for the full design brief. This section is a condensed summary so any session has the design guardrails loaded by default.

### Users

Mid-to-upper-income urban Mexican (CDMX, GDL, MTY) booking **personal services and appointments** — *not* restaurant reservations. Verticals, in priority order: **fitness classes, spa & wellness, beauty & grooming (hair, barber, nails, aesthetics), retail-by-appointment (jewelry, ateliers), healthcare (dental, medical, therapy)**. Mobile-first, often on the go, sometimes aspirational. Authenticates with Google or Apple.

### Brand Personality

**Curada · Acogedora · Confiable** (curated · welcoming · trustworthy).

- *Curada* — Avoqado is intentionally edited, not yellow-pages.
- *Acogedora* — warm and human; closer to entering a beautiful boutique than logging into a banking app.
- *Confiable* — for sensitive bookings (dentist, aesthetic, medical) the user is handing over body and money. Grounded and legible, never clinical or cold.

### Aesthetic Direction

**Airbnb-leaning warm discovery, with multi-vertical tonal sensitivity.** Photo-led, warm, aspirational. Venue photography is the protagonist. Search and discovery are heroic. Cards breathe.

References, in order of weight: **Airbnb** (photo-as-hero, warm aspirational mass-friendly) → **Resy / Tock** (editorial typographic confidence on detail screens) → **ClassPass / Mindbody** (efficient time-slot picking) → **Aesop / Kinfolk / Apartamento** (typographic personality, generous whitespace, restrained palette as a background filter — not the primary mode).

**Tonal variation by vertical** — same design system, vertical-aware accents:

| Vertical | Accent register | Photography mood |
|---|---|---|
| Wellness & beauty (spa, hair, fitness) | Warm — terracotta, ochre, dusty rose | Golden-hour, soft skin, hands, fabric |
| Healthcare (dental, medical, aesthetics) | Calm — sage deepened to muted teal, off-white | Clean but human, never sterile |
| Retail by appointment (jewelry, ateliers) | Refined — deep ink, thin gold hairlines | Object-focused, tactile, near-macro |

**Theme**: light mode only.

**Surface palette** (already in `src/theme/colors.ts` — extend, don't replace):
- `background #F8F6F1` (warm bone, never pure white)
- `surface #FFFFFF` · `surfaceMuted #EFEAE1`
- `text #1E1C18` (warm near-black, never `#000`) · `muted #6F6A60`
- `border #DED7CA` (hairline taupe)
- `primary #1F4D3A` (deep forest) · `accent #C7834A` (terracotta) · `danger #A33A2F`

**Typography**: System fonts are placeholder only. Production must pair a **display** with quiet personality (Tiempos Headline / Söhne Breit / GT Alpina, or free: Fraunces / Newsreader) and a **text** sans with high small-size legibility (Söhne / GT America, or free: Geist / General Sans). Shipping system fonts will read "templated" instantly.

### Anti-references — red lines

Reject any choice that would fit on these boards:

1. **Generic SaaS / AI** — purple-blue gradients, glass cards, neon-on-dark, identical rounded-rect grids, hero-metric templates, gradient text.
2. **Corporate banking cold** — institutional blue, no personality, all 8px borders, white-card fortress.
3. **Mexican hipster cliché** — cactus, rosa mexicano + amarillo, talavera as decoration, "artesanal" hand-drawn type, anything tourist-facing.
4. **Loud fitness gym** — black + neon, all-caps industrial type, sweating-people stock, exclamation marks, motivational copy.

### Design Principles

1. **Photo of the venue earns the screen.** Photography is the trust signal, not decoration. Typography hierarchy is for screens *without* a photo (lists, settings, confirmations).
2. **Warm trust over cold precision.** Even for medical/financial moments, warm clarity beats clinical sterility. Hairline rule on warm bone > hard shadow on pure white.
3. **Vertical-aware, not vertical-fragmented.** One system. Vertical accents are subtle filters on the same components — never a parallel component library or different layout grammar.
4. **Discovery-led copy, not transactional.** "Encuentra tu próximo espacio" / "Reserva con confianza" / "Vuelve cuando quieras" — never "Manage bookings" / "Submit reservation" / "Process payment". Spanish first, mexicano natural, never robotic.
5. **Density is earned, not assumed.** Booking calendars / time slots are tight (ClassPass). Discovery screens (home, search, venue detail) breathe (Airbnb). Switch modes deliberately by screen function — never average them.

## 🔴 CRITICAL — Keep the Avoqado MCP in sync

The Avoqado MCP (`avoqado-server/scripts/mcp/`) is a **first-class interface**: it exposes
the platform's data and actions to AI agents (internal ops today, customer-facing tomorrow).
It must never fall behind the platform.

**Whenever you add or change a feature, Prisma model, service, endpoint, permission, or any
capability the MCP should expose, you MUST add or update the matching MCP tool in
`avoqado-server/scripts/mcp/` as part of the SAME change — never "later".** A capability that
exists but isn't reachable through the MCP is unfinished. Treat the MCP like permissions: kept
in lockstep, never an afterthought.

## 🔴 CRITICAL — Keep the sales presentation in sync

The partner sales presentation (`~/Documents/Programming/Avoqado-HQ/operations/marketing/platform-presentation/`)
is the canonical "what Avoqado does" document — third parties sell from it. It must never fall
behind the platform.

**Whenever you add, change, or remove a customer-visible capability (feature, module, product,
payment method, supported sector, tier packaging), you MUST update BOTH deliverables as part of
the SAME change — never "later":** the full deck (`avoqado-presentacion.html`) AND the one-pager
(`avoqado-one-pager.html`), then regenerate both PDFs following that folder's `README.md`.
Updating only one of the two is an incomplete change. Internal refactors and bugfixes with no
customer-visible impact are exempt.
