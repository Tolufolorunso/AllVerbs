# Coding Standards

> Conventions for this project: Expo (SDK 57) + React Native + expo-router +
> TypeScript (strict), managed with npm. Edit anything that drifts as the stack
> grows.

## TypeScript

- Strict mode enabled
- No `any` types - use proper typing or `unknown`
- Define interfaces for all props, API responses, and data models
- Use type inference where obvious, explicit types where helpful

## React

- Functional components only (no class components)
- Use hooks for state and side effects
- Keep components focused - one job per component
- Extract reusable logic into custom hooks

## Expo / React Native

- Cross-platform first: iOS, Android, and web share one codebase. Prefer React
  Native primitives (`View`, `Text`, `Pressable`, `ScrollView`) over web-only
  elements.
- Platform-specific code goes in `.web.tsx` / `.ios.tsx` / `.android.tsx`
  siblings rather than runtime `Platform.select` branches where practical.
- Routing is file-based via expo-router under `src/app`; the file path is the
  route. Use `<Stack>` / tabs from `expo-router` for navigation.
- Use `Link` from `expo-router` for navigation instead of touching platform
  navigation APIs directly.
- Only add native modules or config plugins when a current requirement needs
  them; they must be reflected in `app.json`.

## File Organization

- Routes/screens: `src/app/[route].tsx`
- Components: `src/components/[ComponentName].tsx`
- Hooks: `src/hooks/[use-name].ts`
- Constants/theme: `src/constants/[name].ts`
- Import via the `@/*` alias (maps to `src/*`); assets via `@/assets/*`.

## Naming

- Components: PascalCase (`ItemCard.tsx`)
- Files: Match component name or kebab-case
- Functions: camelCase
- Constants: SCREAMING_SNAKE_CASE
- Types/Interfaces: PascalCase (no prefix)

## Styling

- React Native `StyleSheet.create` for component styles; keep styles next to
  the component.
- Use theme tokens from `src/constants/theme.ts` for colors and spacing rather
  than hardcoding values.
- Support both light and dark color schemes (`useColorScheme` / the app's theme
  hook); `userInterfaceStyle` is `automatic`.
- No web-only CSS in shared components; reserve CSS/`.module.css` for `.web.tsx`
  files.

## Data & State

- No backend, database, or auth is configured yet.
  > TODO: record the data layer (API, local storage, offline sync) and any
  > auth/ownership boundary once chosen in `blueprint/project-plan.md`.
- Keep server/API access behind a small module so screens stay presentational.
- Validate any external or user-supplied data at the boundary before use.

## Error Handling

- Handle async failures explicitly; surface a user-readable message rather than
  swallowing errors.
- Guard platform-specific APIs (device, notifications, etc.) for web where they
  may be unavailable.

## Testing

The blueprint installs no test runner; testing is opt-in at the project level,
because the overlay can't know your stack. Adding unit testing is an explicit
setup task the AI can do through the normal workflow, either as a build-plan item
or with `/tests`. The setup should choose the stack-native runner, wire the
scripts or commands, add a small example test, and update the Commands section
of `AGENTS.md`.

When `AGENTS.md` declares a `Verify` command, treat it as the umbrella automated
gate. It combines only the checks this project actually has, in this order when
available: typecheck, tests, then build. The command does not enable an absent
test runner or replace focused evidence. It gives local work and optional CI one
exact command to run. `/ci` owns Verify and CI setup. `/tests` adds the real test
command to Verify when it already exists, but never creates CI only because
testing was configured.

**The opt-in switch is one signal: a `test` command in the Commands section of
`AGENTS.md`.** Declare one and **tests become a gate for logic-bearing steps**,
not an optional extra; leave it out and the loop verifies logic with the evidence
it already uses (run it, a screenshot, the build). Adding the runner is itself a
deliberate step, never a silent mid-step install. This is the single definition
of the switch; the skills and `ai-interaction.md` only point back here.

- **What to test (the scope rule):** pure logic where a wrong answer is possible -
  parsers, formatters, validators, id/slug builders, server actions. These have
  assertable inputs and outputs and real edge cases (empty, missing, malformed).
- **What not to test:** UI components and integration-level surfaces (render or
  export routes, anything driving a real browser or external service). Verify those
  with a screenshot and the build, not brittle unit tests.
- **The gate (when a runner is configured):** a build step that adds in-scope logic
  must ship a passing test in the same reviewable diff. The project's test command
  must be green before the step is approved, before any checkpoint commit, and
  before `/complete` merges. UI and integration-only steps are exempt and ride on
  screenshot plus build evidence.
- **When it's named:** the `/feature` spec's Testing section predicts the coverage,
  `/implement` writes the test with the step, and if a step surfaces logic the spec
  didn't foresee, add a focused test then.
- An empty suite should fail, not pass, so "no tests ran" never looks like "passed".
- Test files live next to source files (for example `feature.test.ts`).
- Run them via the project's test command (see Commands in `AGENTS.md`), not a
  hardcoded tool name.

Stack binding (swap for yours): this React Native/Expo app would use Jest with
`jest-expo` and React Native Testing Library when a runner is added; mock native
modules and external services, and use fake timers for time-dependent logic. No
runner is installed yet.

## Verification

For UI and interaction behavior, prefer real evidence over reading the code and
assuming it works: run the app with `npm run start` (or `npm run web`) and
capture a screenshot or recording of the actual screen.

- Browser/E2E automation is separately opt-in through `/tests browser`. If no
  `Browser tests` command is declared in `AGENTS.md`, do not add a runner
  silently mid-feature; use the Expo dev server, screenshots, or `npx tsc
  --noEmit` and `npm run lint` as evidence instead.

## Code Quality

- No commented-out code unless specified
- No unused imports or variables
- Keep functions under 50 lines when possible

## Comments

Write code that explains itself; comment only what the code cannot say.
Over-commenting is a common AI tell, so resist it.

- Comment the **why**, not the **what**. Delete any comment that restates the code.
- No banner/header blocks, section dividers, or step-by-step narration of obvious
  code. A file does not need a comment announcing each region.
- A comment earns its place only when it captures something the code can't: a
  non-obvious decision, a gotcha or workaround, why a value is what it is, or a
  link to a spec or issue.
- Prefer self-documenting names and small functions over explanatory comments.
- Keep doc comments minimal: a one-line purpose on an exported type or function is
  plenty; don't write JSDoc that just repeats the signature.
- When in doubt, leave the comment out.

## Writing

- No em dashes (U+2014) in generated content: docs, comments, commit messages,
  READMEs, specs. They read as AI-generated.
- Use a hyphen for `term - description` separators; rephrase prose with commas,
  parentheses, or a colon. Avoid en dashes and the ellipsis character too.
