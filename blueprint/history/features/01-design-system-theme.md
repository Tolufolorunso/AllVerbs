# Feature: Design system & theme

**From build-plan:** feature 1
**Build attempt:** 1
**Branch:** feature/design-system-theme
**Status:** verified

## Goal

Lay the UI foundation every later screen imports: typed theme tokens (dark-first
palette plus an accessible light variant for the automatic system scheme), the
`useTheme` hook, and the UI primitive layer (`Text`, `Button`, `Card`, `Badge`,
`Input`, and feedback components). Port the locked look from `prototypes/theme.css`
into the app's real theme before any feature UI is built. No navigation, no data
model, no feature screens.

## Design reference

Visual replication from the approved mockups. Port shared tokens first, then match
the primitive styling to these references:

- `prototypes/theme.css` - the token source of truth (surfaces, text, accent,
  semantic study states, CEFR colors, type scale, spacing, radii, shadows).
- `prototypes/today.html`, `browse.html`, `verb.html`, `flashcards.html`,
  `progress.html` - show the primitives in context (cards, badges, buttons,
  list rows, bars, tab bar).

The mockups are desktop HTML/CSS. This feature re-expresses the same tokens with
React Native `StyleSheet` primitives; the CSS class layer (`.card`, `.btn`,
`.badge`, `.bar`, `.tabbar`) is reference only and is rebuilt as RN components.

## In scope

- `src/constants/theme.ts`: typed token contract. Per-scheme `Colors` (dark +
  light) and scheme-agnostic `spacing`, `radius`, `font`, `shadows`. Export
  `lightTheme`, `darkTheme`, the shared scale constants, and the `CefrLevel`,
  `Scheme`, `Colors`, and `Theme` types.
- `src/hooks/use-theme.ts`: `useTheme()` resolves the active `Theme` from the
  system color scheme (`useColorScheme` from `react-native`), defaulting to dark
  when the scheme is unset (dark-first).
- UI primitives in `src/components/ui/` (kebab-case files, PascalCase exports,
  explicit prop interfaces): `text.tsx`, `button.tsx`, `card.tsx`, `badge.tsx`,
  `input.tsx`, and feedback `spinner.tsx`, `empty-state.tsx`, `progress-bar.tsx`.
- A temporary design-system preview at `src/app/index.tsx` that renders the palette
  and every primitive, used only to verify this feature. Feature 2 replaces it with
  the tab shell.

## Out of scope

- Navigation shell, tab navigator, route structure, placeholder screens (feature 2).
- Verb data model, dataset, data-loading, and domain components such as
  `VerbListItem`, `FlashCard`, `QuizOption` (feature 3 and later).
- The conic CEFR progress ring and mastery dot widgets (features 12 and 4); the
  linear `ProgressBar` primitive is in scope, the ring is not.
- A user-selectable theme override (light/dark/system) and its settings UI
  (feature 19). This feature follows the automatic system scheme only.
- Bundling the Inter font. The stated look is "Inter/system"; this feature ships
  the platform system sans and reserves `font.family` for Inter if it is bundled
  later via `expo-font`. No new dependency now.
- Any new dependency (no NativeWind, Tailwind, styled-components, or UI kit).
- Installing a test runner (testing stays opt-in; none is configured).

## Build loop

Config is `workflow.stepReview: "feature"` and `workflow.checkpointCommits:
"disabled"`. Implement every step below in order, keeping the app runnable and
`tsc`/`lint` green after each, then present one review packet for the whole
feature. No per-step approval pauses and no checkpoint commits. `/complete`
creates the single final feature commit on `feature/design-system-theme`.

## Build steps

- [x] **Theme tokens.** Create `src/constants/theme.ts`. Port the dark palette 1:1
  from `prototypes/theme.css` `:root`, add the derived light palette (Data /
  contracts), and define the scheme-agnostic `spacing` (xs..xxxl from `--s1..--s7`),
  `radius` (sm/md/lg/pill), `font` (family + size xs..xxl + weight), and `shadows`
  (CSS box-shadow re-expressed as RN shadow props plus Android `elevation`).
  Export `lightTheme`, `darkTheme`, the shared constants, and all types.
  Done when: `npx tsc --noEmit` exits 0 and `darkTheme.colors` values equal the
  prototype hex/rgba tokens.
- [x] **useTheme hook.** Create `src/hooks/use-theme.ts` exporting `useTheme(): Theme`
  that reads `useColorScheme()` and returns `darkTheme` for `"dark"` or unset,
  `lightTheme` for `"light"`.
  Done when: `npx tsc --noEmit` exits 0 and the hook returns a full `Theme`
  (colors + shared scales) for the active scheme.
- [x] **Preview harness.** Rewrite `src/app/index.tsx` into a temporary, scrollable
  design-system preview that calls `useTheme()`, paints the screen background and
  text from tokens, and shows a swatch grid of every color token with its name.
  Keep it clearly temporary (F2 supersedes it).
  Done when: `npm run web` (or the dev server) renders the themed swatch screen
  and `npx tsc --noEmit` + `npm run lint` exit 0.
- [x] **Text primitive.** Create `src/components/ui/text.tsx` (`Text`) with variants
  `heading | title | body | caption | label`, a `color` prop keyed to text tokens
  (`text | muted | faint | accent | inverse`), and `align`/`weight` overrides.
  Render samples of every variant in the preview.
  Done when: the preview shows all variants sized/colored from tokens and
  `tsc` + `lint` exit 0.
- [x] **Button primitive.** Create `src/components/ui/button.tsx` (`Button`) on
  `Pressable` with variants `primary | ghost`, sizes `sm | md | lg`, `block`,
  and `disabled` + `loading` (renders `Spinner`, blocks presses). Set
  `accessibilityRole="button"` and `accessibilityState` for disabled/busy.
  Render all states in the preview.
  Done when: the preview shows primary/ghost/disabled/loading, taps register,
  and `tsc` + `lint` exit 0.
- [x] **Card + Badge primitives.** Create `src/components/ui/card.tsx` (`Card`,
  surface + border + radius + padding, `elevated` option) and
  `src/components/ui/badge.tsx` (`Badge`, either `level: CefrLevel` using the
  scheme-agnostic CEFR chip colors with dark ink, or `tone: neutral | accent |
  known | learning | wrong`). Render a card containing all six CEFR badges and
  each tone in the preview.
  Done when: the preview shows the card and every badge level/tone and `tsc` +
  `lint` exit 0.
- [x] **Input primitive.** Create `src/components/ui/input.tsx` (`Input`), a
  `TextInput` wrapper with `label`, optional `error` and `hint`, and a focused
  state. Associate the label with the field (`accessibilityLabel`), announce the
  error (`accessibilityHint` / `accessibilityState`), and clear the error visual
  when a new value is entered. Render a default, a focused, and an error sample.
  Done when: typing works, focus and error states are visible and announced, and
  `tsc` + `lint` exit 0.
- [x] **Feedback primitives.** Create `src/components/ui/spinner.tsx` (`Spinner`,
  themed `ActivityIndicator` with `size`/`color`), `empty-state.tsx`
  (`EmptyState` with optional icon, title, message, and action button), and
  `progress-bar.tsx` (`ProgressBar`, a track + fill from `value: 0..1` with an
  accessible `accessibilityValue`). Render each in the preview.
  Done when: the preview shows a spinner, an empty state, and a progress bar at a
  set value, and `tsc` + `lint` exit 0.
- [x] **Final verify + evidence.** Run `npx tsc --noEmit` and `npm run lint` (both
  must exit 0). Capture a screenshot of the preview in dark (default) and, by
  toggling the browser/OS color scheme, in light.
  Done when: both commands exit 0 and both screenshots show the primitives
  rendering correctly with token-driven colors.

## Files / areas

- Create: `src/constants/theme.ts`; `src/hooks/use-theme.ts`;
  `src/components/ui/{text,button,card,badge,input,spinner,empty-state,progress-bar}.tsx`.
- Modify: `src/app/index.tsx` (temporary preview; replaced in feature 2).
- Read-only references: `prototypes/theme.css` and `prototypes/*.html`;
  `blueprint/context/project-overview.md` (UI/UX and Component system);
  `blueprint/context/coding-standards.md` (Styling, Naming, File Organization).

## Data / contracts

Internal token contract (no persistence, no external API). Every later feature
imports these names, so the shape is fixed here.

```ts
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Scheme = "light" | "dark";

export interface Colors {
  background: string; surface: string; surfaceAlt: string;
  border: string; borderStrong: string;
  text: string; textMuted: string; textFaint: string;
  accent: string; accentAlt: string; accentInk: string; accentSoft: string;
  known: string; learning: string; wrong: string;
  knownSoft: string; learningSoft: string; wrongSoft: string;
  cefr: Record<CefrLevel, string>; // scheme-agnostic bright chips
  badgeInk: string;                // ink on cefr chips
}
export interface Theme {
  scheme: Scheme; isDark: boolean; colors: Colors;
  spacing: Spacing; radius: Radius; font: Font; shadows: Shadows;
}
```

Shared scales (scheme-agnostic), ported from the prototype:
- `spacing`: xs 4, sm 8, md 12, lg 16, xl 24, xxl 32, xxxl 48.
- `radius`: sm 8, md 14, lg 20, pill 999.
- `font.family`: platform system sans (leave RN default); `font.size`: xs 12, sm 13,
  base 15, md 17, lg 20, xl 26, xxl 34; `font.weight`: medium 500, semibold 600, bold 700.
- `shadows`: `sm` and `md` as RN shadow props (offset/opacity/radius) plus Android
  `elevation`, derived from `--shadow-sm` / `--shadow`.

Dark `Colors`: port exact values from `prototypes/theme.css` `:root`
(`background #0b0e14`, `surface #141922`, `surfaceAlt #1b2130`, `border #232b3a`,
`borderStrong #2f3a4d`, `text #eef2f8`, `textMuted #9aa6b8`, `textFaint #5c6879`,
`accent #6d5efc`, `accentAlt #8b5cf6`, `accentInk #ffffff`,
`accentSoft rgba(109,94,252,0.16)`, `known #34d399`, `learning #fbbf24`,
`wrong #f87171` and their `*Soft` tints). The mockup-only desktop backdrop
`--bg-deep` is not an app token.

Light `Colors` (derived for contrast on white; accent hue kept):
`background #f6f7f9`, `surface #ffffff`, `surfaceAlt #eef1f5`, `border #e3e7ee`,
`borderStrong #cdd5e0`, `text #0b0e14`, `textMuted #59636f`, `textFaint #8a94a3`,
`accent #5b48ef`, `accentAlt #7c4fe0`, `accentInk #ffffff`,
`accentSoft rgba(91,72,239,0.12)`, `known #12a06a`, `learning #c2760a`,
`wrong #d92d20`, `knownSoft rgba(18,160,106,0.14)`,
`learningSoft rgba(194,118,10,0.14)`, `wrongSoft rgba(217,45,32,0.12)`.

CEFR chip colors (same in both schemes, dark ink `badgeInk #08111f`):
A1 `#38bdf8`, A2 `#34d399`, B1 `#fbbf24`, B2 `#fb923c`, C1 `#f472b6`, C2 `#a78bfa`.

## Testing

No test runner and no `Browser tests` command are configured, so there is no unit
or browser gate for this feature (coding-standards: UI/integration surfaces are
verified by screenshot and build, not brittle unit tests). The only logic is the
trivial scheme-to-theme resolution in `useTheme` and the CEFR color map. Evidence
for this feature is: `npx tsc --noEmit` (exit 0), `npm run lint` (exit 0), and
dark + light screenshots of the preview route from the dev server. If logic-heavy
features later (for example the SRS engine, feature 8) need real coverage, add a
runner through `/tests` at that point.

## Notes for the AI

- Dark is the designed palette; light is a derived accessible variant. Keep the
  accent hue and CEFR chips consistent across schemes.
- Styling is RN `StyleSheet.create` next to each component. No CSS and no web-only
  APIs in shared components; import via the `@/*` alias.
- Use `Pressable` (not `TouchableOpacity`) and `useColorScheme` from
  `react-native`; both work across iOS, Android, and `react-native-web` here, so no
  `.web.tsx` shim is needed.
- Primitives read the theme through `useTheme()` internally; they take variant/tone
  props, not a theme override. A context provider and user theme override arrive
  with feature 19; do not build them now.
- The preview at `src/app/index.tsx` is throwaway verification scaffolding. Keep it
  minimal and expect feature 2 to replace it.
- Do not pull domain components, the progress ring, or mastery dots into this
  feature; the linear `ProgressBar` is the only progress widget here.
- No em dashes in code comments or strings (project writing standard).


<!-- blueprint:completion {"schemaVersion":1,"specBytes":12155,"specSha256":"3fc83129a25b3416c296d5b976791e712e2cc51c8093b3e386a002a2f17670cb","branch":"refs/heads/feature/design-system-theme","head":"2d1aeb5c4b7788dae7029e36b00798c6dfab15b3","baseRef":"refs/heads/master","baseCommit":"2d1aeb5c4b7788dae7029e36b00798c6dfab15b3","sourceTree":"e7a3ae5f47a3c638defc82cb1ab9e719c6087384","absentOptional":[]} -->
