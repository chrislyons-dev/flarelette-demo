# Brand overview

- Name: Flarelette
- Positioning: A cross-language API and JWT toolkit built for Cloudflare Workers — “Starlette for the edge.”
- Essence: Minimalist, security-first developer tooling: engineered, precise, and trustworthy.
- Promise: Clear, secure JWT handling at the edge with explicit guidance on trade-offs and limitations.
- Primary audiences: Backend/edge engineers, security engineers, library maintainers, developer experience teams.

## Voice and writing system

- Core tone: Confident, precise, security-conscious, and educational.
- Personality traits: Intelligent; security-first; educator; trustworthy; minimalist.
- Sentence-level patterns
  - Prefer active voice and direct verbs: “Sign the token” not “The token should be signed.”
  - Short, information-dense sentences. One primary idea per sentence.
  - When recommending: state what to do, why it matters, and trade-offs. Example: “Rotate keys regularly to limit exposure; this increases operational complexity but reduces long-term risk.”
- Guidelines for docs & messages
  - Headers: action-oriented, security-aware (e.g., “Rotate keys safely”).
  - Explanations: start with a one-line summary, then short elaboration, then an example or code snippet.
  - Warnings: explicit, factual, and prescriptive. Use a neutral label (“Warning”) rather than alarmist language.
  - Avoid marketing language. No hyperbole, no vague promises.

## Visual identity

- Logo: Standalone torch/flame mark. Use full-color mark on light backgrounds; off-white or desaturated flame for dark mode; single-color silhouettes for minimal contexts. Maintain clearspace = 1× flare tip width; min height 24px on screen.
- Color palette (primary uses):
  - Deep Navy — #0F2B45 (wordmark, large surfaces)
  - Flare Orange — #FF7A00 (critical highlights, security CTAs)
  - Edge Teal — #00C2A8 (success, secondary accents)
  - Flame gradient — #E74C3C → #F39C12 → #F1C40F (large/flame artwork)
  - Neutrals — #F8FAFC (light), #0B0F12 (dark)
- Typography
  - Primary: Inter or IBM Plex Sans (variable) for UI and docs.
  - Weights: 400 body, 600 UI labels, 700 headings.
  - Code: system or monospace stack for examples.
  - Scale: H1 28–36px semibold; H2 20–28px semibold; Body 14–16px regular.
- Iconography & imagery
  - Icon style: geometric, single-stroke icons matching the mark’s stroke weight.
  - Imagery: technical diagrams, simplified flows, and schematic edge topologies; avoid generic stock photos. Use navy/teal overlays with orange sparing for emphasis.
- Texture & effects
  - Avoid heavy bevels and glossy effects. Subtle inner glow on flame for dark backgrounds only.

## UI components and patterns

- Buttons
  - Primary: navy background, white text; accent border or small orange indicator for security actions (e.g., “Sign”, “Rotate”).
  - Secondary: outline navy on neutral background.
  - Critical: orange background with navy text for highest-attention security CTAs (use sparingly).
- Forms and inputs
  - Clear labels, compact layout, 4px baseline grid. Inline validation with explicit reasons for failures. Use teal for success, orange for errors/warnings.
- Notifications & status
  - Info: navy label + neutral background.
  - Success: edge teal.
  - Warning/error: flare orange (warnings) or deep navy (errors with orange accent). Always state impact and recommended next step.
- Diagrams and flows
  - Use navy for baseline components, teal for allowed/successful flows, orange only for signing, verification, and alerting points. Annotate threat boundaries and trust assumptions.

## Documentation, API, and code style

- API docs
  - Each endpoint: one-line purpose → security implications → inputs/outputs (types, required/optional) → examples (curl, JS, Python).
  - Explicitly document failure modes and recommended mitigations.
- Code examples
  - Provide two canonical samples for every feature: JavaScript (Cloudflare Workers) and Python. Keep examples minimal and focused on the security-relevant lines.
  - Always include brief comments explaining security rationale: key rotation cadence, minimum algorithms, TTL choices.
- Readme & landing copy
  - Tagline example: flarelette — secure JWTs at the edge.
  - Short lead: one or two lines that state what it is, who it’s for, and a concise security guarantee.
- Changelog & release notes
  - Keep entries technical and concise. Call out security fixes and migration steps up front. Label breaking changes clearly.

## Security, legal, and accessibility

- Security-first defaults
  - Document recommended secure defaults (algorithms, TTLs, rotation). Flag any optional insecure choices clearly and explain risks.
  - Include a short “Threat model” section in the docs that states assumptions and limits of protection.
- Legal & licensing
  - State license prominently in the repo root; include a short “security policy” and disclosure process in CONTRIBUTING.
- Accessibility
  - Color contrast: verify navy/neutral and orange text combinations meet WCAG AA for text and AA/AAA where possible for UI components.
  - Keyboard focus states: visible, 3–4px outline using teal or navy.
  - Screen reader text: provide concise aria labels for interactive security actions and token state changes.

## Implementation checklist and deliverables

- Brand tokens (hex, rgba, font stack, spacing scale) in a simple JSON or design tokens file.
- Master SVG of mark with componentized paths for flame segments and handle.
- Monochrome SVG variants and PNG exports at standard sizes.
- UI component snippets (buttons, inputs, alerts) in CSS variables and a small React/Vue/vanilla example.
- One-page usage sheet combining logo rules, color hexes, typography tokens, clearspace, and min-size.
- Documentation templates: README header, API endpoint template, security/THREAT MODEL stub, changelog format.
