# Feature: App navigation shell

**From build-plan:** feature 2
**Build attempt:** 1
**Branch:** feature/app-navigation-shell
**Status:** verified

## Goal

Lay down the app's navigation foundation: a themed root stack that wraps a 4-tab
bottom navigator (Today, Browse, Study, Progress), the expo-router route structure
for the screens later milestones fill in (verb detail, flashcards, quiz, settings,
unlock, onboarding), and one consistent placeholder for every route. After this
feature the app boots into the tab shell, every route is reachable and
type-checked, and all chrome (status bar, headers, tab bar) renders on the F1
design tokens with a dark-first focused-study look.

## Design reference

`prototypes/` was consumed and deleted in feature 1; the durable tokens now live
in `src/constants/theme.ts` (via `useTheme`). Follow the overview UI/UX contract:
dark-mode-first, high contrast, card-centric, calm. The tab bar uses `surface`
background, a hairline `border` top edge, `accent` for the active tab, and
`textFaint` for inactive - the same chrome the throwaway prototype tabbar showed.

## In scope

- Root stack `src/app/_layout.tsx`: `SafeAreaProvider`, themed `StatusBar`, and
  token-based `Stack` screen options (header background/tint, content background).
- Tab navigator `src/app/(tabs)/_layout.tsx`: 4 tabs with `@expo/vector-icons`
  Ionicons tab-bar icons and a token-themed tab bar.
- 4 tab placeholder screens: `(tabs)/index.tsx` (Today), `(tabs)/browse.tsx`,
  `(tabs)/study.tsx`, `(tabs)/progress.tsx`.
- 6 pushed-route placeholders: `verb/[id].tsx`, `flashcards.tsx`, `quiz.tsx`,
  `settings.tsx`, `unlock.tsx`, `onboarding.tsx`.
- One shared `PlaceholderScreen` component (`src/components/`) used by every
  placeholder, with an optional feature tag and navigation action buttons.
- Delete the temporary F1 preview `src/app/index.tsx` (its own comment reserves it
  for F2); `/` then resolves to the Today tab.
- Minimal `router.push` wiring so every pushed route has a visible, testable entry.
- Add the `@expo/vector-icons` dependency and regenerate expo-router typed routes.

## Out of scope

- Any real screen content: Today hub (F12), Browse levels/search (F4/F6), Study
  launcher (F11), Progress dashboard (F13), verb detail (F5), flashcards (F9),
  quiz (F10), settings (F19), unlock/paywall (F15/F17), onboarding (F18).
- Data model, dataset, storage, SRS, entitlement, ads, TTS.
- A theme provider or theme toggle (F19), custom tab-bar animation, deep-link
  handling beyond the existing `allverb` scheme, navigation-state persistence, and
  a custom not-found route.

## Build loop

Per `blueprint/config.json`: `stepReview: feature` (one review packet after all
steps), `checkpointCommits: disabled`. Build the steps in order, keep each green
(`npx tsc --noEmit` + `npm run lint`), then stop for the single feature review.
`/complete` makes the final commit. Because `experiments.typedRoutes` is on, any
step that adds or renames route files must regenerate `.expo/types/router.d.ts`
before its `tsc` gate (this happens automatically while the dev server runs; when
typechecking cold, start `npm run web` / `npx expo start` once to generate them).

## Build steps

1. **Add the icon dependency.** Run `npx expo install @expo/vector-icons` so Expo
   selects the SDK-57-compatible version. No route files change yet.
   _Done when_ `node -e "require.resolve('@expo/vector-icons')"` resolves and
   `npm run lint` exits 0.
2. **Add the shared placeholder component.** Create
   `src/components/placeholder-screen.tsx` exporting `PlaceholderScreen`, a
   centered, token-themed layout built from the F1 primitives (`Text` title +
   muted message, an accent `Badge` for the feature tag, and ghost `Button`s that
   `router.push` each action's `href`). It takes `href` values as props, so it
   references no concrete new route yet.
   _Done when_ `npx tsc --noEmit` exits 0.
3. **Build the tab shell and root stack.** Create `src/app/(tabs)/_layout.tsx`
   (`<Tabs>` with themed `screenOptions` and per-tab `tabBarIcon` via Ionicons +
   titles Today/Browse/Study/Progress) and the 4 tab screens rendering
   `PlaceholderScreen` (no cross-route actions yet). Delete `src/app/index.tsx`.
   Rewrite `src/app/_layout.tsx` to wrap `<Stack>` in `SafeAreaProvider` with a
   themed `StatusBar` and token-based `Stack` `screenOptions`, registering
   `(tabs)` with `headerShown: false`. Regenerate typed routes.
   _Done when_ the app boots into Today, the 4 tabs switch with icons and an
   accent active tint, and `npx tsc --noEmit` + `npm run lint` exit 0.
4. **Add the pushed-route placeholders.** Create `verb/[id].tsx` (reads `id` via
   `useLocalSearchParams`), `flashcards.tsx`, `quiz.tsx`, `settings.tsx`,
   `unlock.tsx`, `onboarding.tsx`, each rendering `PlaceholderScreen`; register
   titles/presentation in the root `<Stack>` (`flashcards`/`quiz` full-screen).
   Regenerate typed routes.
   _Done when_ each route renders its placeholder when navigated by URL, and
   `npx tsc --noEmit` + `npm run lint` exit 0.
5. **Wire reachability and verify.** Add navigation `actions` to the tab and
   settings placeholders (typed `href`s) so every pushed route has a visible entry
   point, then run the final gate and a manual smoke.
   _Done when_ from the tabs you can reach verb detail, flashcards, quiz, settings,
   unlock, and onboarding; pushed screens show a header back button; light/dark
   follows the system scheme; and `npx tsc --noEmit` + `npm run lint` exit 0.

## Files / areas

- Modify: `src/app/_layout.tsx` (providers + themed root stack).
- Delete: `src/app/index.tsx` (temporary F1 preview).
- Create: `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx`,
  `src/app/(tabs)/browse.tsx`, `src/app/(tabs)/study.tsx`,
  `src/app/(tabs)/progress.tsx`, `src/app/verb/[id].tsx`,
  `src/app/flashcards.tsx`, `src/app/quiz.tsx`, `src/app/settings.tsx`,
  `src/app/unlock.tsx`, `src/app/onboarding.tsx`,
  `src/components/placeholder-screen.tsx`.
- Modify via `npx expo install`: `package.json`, `package-lock.json`
  (add `@expo/vector-icons`).
- Reuse, do not modify: `src/constants/theme.ts`, `src/hooks/use-theme.ts`,
  `src/components/ui/*`.

## Data / contracts

- No data model, persistence, or network in this feature.
- **Route table** (the contract later features navigate by):

  | Route | File | Purpose | Filled in |
  |---|---|---|---|
  | `/` | `(tabs)/index.tsx` | Today tab | F12 |
  | `/browse` | `(tabs)/browse.tsx` | Browse tab (levels + search) | F4/F6 |
  | `/study` | `(tabs)/study.tsx` | Study tab (mode/scope launcher) | F11 |
  | `/progress` | `(tabs)/progress.tsx` | Progress tab (dashboard) | F13 |
  | `/verb/[id]` | `verb/[id].tsx` | Verb detail (hero) | F5 |
  | `/flashcards` | `flashcards.tsx` | Flashcards flow (full-screen) | F9 |
  | `/quiz` | `quiz.tsx` | Quiz flow (full-screen) | F10 |
  | `/settings` | `settings.tsx` | Settings | F19 |
  | `/unlock` | `unlock.tsx` | Paywall | F15/F17 |
  | `/onboarding` | `onboarding.tsx` | First-run | F18 |

- **Recorded deviation from the overview (not a silent change):** the overview
  sketches the study flows as `/study/flashcards` and `/study/quiz`. In expo-router
  a `study` segment cannot be both the `/study` tab leaf and a stack parent, and the
  overview also requires these flows to be full-screen (no tab bar). They therefore
  live in the root stack at `/flashcards` and `/quiz`. **F9/F10 must use these
  paths.** `project-overview.md` is not edited here (that is an `/overview` job).
- `PlaceholderScreen` props:
  `title: string; message?: string; feature?: string; actions?: { label: string; href: Href }[]`
  (`Href` and `router` from `expo-router`).
- Typed routes are on: use the object form
  `{ pathname: "/verb/[id]", params: { id } }` for the dynamic verb route and
  string literals (e.g. `"/flashcards"`) for static routes.

## Testing

- No unit or browser runner is configured (`verification.logicTests:
  when-configured`, no test command; `uiEvidence: when-available`, no browser
  harness). Do not claim automated UI coverage.
- Primary gate: `npx tsc --noEmit` and `npm run lint` both exit 0 (baseline was
  green before this feature).
- Typed routes: after regeneration, confirm `.expo/types/router.d.ts` lists
  `/browse`, `/study`, `/progress`, `/verb/[id]`, `/flashcards`, `/quiz`,
  `/settings`, `/unlock`, `/onboarding`, so every `router.push`/`Href` compiles.
- Manual smoke (implementer or `/check`, via `npm run web`): boots into Today; the
  4 tabs switch with icons and accent active tint; tab/settings action buttons open
  the verb, flashcards, quiz, settings, unlock, and onboarding placeholders; pushed
  screens show a back button; toggling the OS light/dark scheme re-themes the chrome.

## Notes for the AI

- Follow `blueprint/context/coding-standards.md`: `StyleSheet` styling, all
  colors/spacing/type from `useTheme` tokens (no hardcoded values), kebab-case
  files, PascalCase exports, explicit prop interfaces, and no em dashes in copy.
- Dark-first: `useTheme` already falls back to dark. Theme the `StatusBar`
  (`style={isDark ? "light" : "dark"}`), the `Stack` header/content, and the tab bar
  from tokens; `useTheme` also exposes `font`, `radius`, and `shadows`.
- Keep placeholders minimal and uniform - scaffolding the later features replace,
  not partial implementations of them.
- Ionicons names (focused = filled, unfocused = outline): Today `today`,
  Browse `search`, Study `school`, Progress `stats-chart`.
- Deleting `src/app/index.tsx` is required: alongside `(tabs)/index.tsx` it would
  create two `/` routes. The design system stays visible through the real screens.
- The typed-route regeneration is a prerequisite for the `tsc` gate; skipping it
  makes new-route `router.push` string literals fail to compile.
- `npx expo install` needs registry access; if it fails offline, stop and report it
  as a blocker rather than substituting an icon approach.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10153,"specSha256":"00472af9caac6fab3817a2aaea6b20e1825598e7a8eaba680394d3cb12a0ecc4","branch":"refs/heads/feature/app-navigation-shell","head":"e4a0abfe6bfcff0558b5abe8544b08707344ebc7","baseRef":"refs/heads/main","baseCommit":"e4a0abfe6bfcff0558b5abe8544b08707344ebc7","sourceTree":"3be72392f23cce43fc5e2b6dc6ca71d3e778320f","absentOptional":[]} -->
