# Feature: Browse by CEFR level

**From build-plan:** feature 4
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/browse-by-cefr-level`

## Goal

Turn Browse into the real reference screen: every bundled verb listed under its
CEFR level, each row showing its level and mastery at a glance, with a search bar
pinned above the list. This is the first screen that reads the F3 data layer, so
it also proves that layer works for real UI.

## In scope

- Six CEFR sections (A1 to C2) rendered from `CEFR_LEVELS`, each showing its verbs
  or an empty-level line.
- A `VerbListItem` domain component: infinitive, CEFR level chip, mastery chip,
  and the first sense definition; the whole row opens `/verb/[id]`.
- A mastery indicator driven by a single read-only seam that F7 and F8 replace.
- A search field pinned above the scrolling list, filtering the loaded verbs as
  the user types, with a no-results state.
- Loading, load-failure, no-results, and empty-level states.
- Accessibility labels and roles on the search field, rows, and section headers.
- Deleting the F3 temporary count line from Browse.

## Out of scope

- **Search depth.** F6 owns instant lookup across all bundled verbs: matching
  senses, definitions, collocations, and phrasal verbs, plus result ranking and
  any cross-level results view. F4 filters the already-loaded list by infinitive
  only. See Open questions.
- **Mastery data.** F4 renders the indicator; it does not compute or store
  mastery. F7 owns persistence and stats, F8 owns the mastery model and
  scheduling. F4 must not add storage, thresholds, or AsyncStorage.
- **Verb detail content.** F5 fills `/verb/[id]`. F4 only navigates to it.
- Per-level progress rings and completion counts on the Progress tab. F13.
- Filtering by part of speech, form, or topic, and any level-collapse or
  jump-to-level control. Not in the plan for F4.
- A2 to C2 content. The F4 sections for those levels render empty until F14.
- Changing the F3 dataset, validator, or loader.

## Build loop

`workflow.stepReview` is `feature`, so all four steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after each step (both green on `main`
today). This is UI work, so each step also ends with a real look at the screen.
`/complete` makes the final feature commit.

## Build steps

- [x] **Step 1 - Render the CEFR sections from the loader.** Rewrite
  `src/app/(tabs)/browse.tsx`: load the dataset with `getAllVerbs()`, group verbs
  by their own `cefrLevel` into one section per entry in `CEFR_LEVELS`, and render
  them with a `SectionList`. Add the loading spinner, the load-failure message,
  and the empty-level line. Rows are plain text for now. Delete the F3 count line
  and its `useA1Verbs` hook.
  *Done when:* Browse shows an A1 section listing all 30 seed verbs by infinitive,
  and A2 through C2 each render with their empty-level line; a spinner is visible
  while the chunk loads; temporarily corrupting `src/data/verbs/a1.json` (not
  committed, then reverted) shows a readable failure message instead of a blank
  or partial screen. Typecheck and lint pass.

- [x] **Step 2 - VerbListItem with level and mastery indicators.** Add
  `src/components/verb-list-item.tsx` (presentational, props-only) and the
  `src/hooks/use-verb-mastery.ts` seam from Data / contracts, then use the
  component for the rows.
  *Done when:* each A1 row shows its CEFR chip, a mastery chip, and its first
  sense definition; tapping a row opens the verb detail placeholder showing that
  verb's id; the seam reports `new` for every verb today, so every chip reads as
  not started. Typecheck and lint pass.

- [x] **Step 3 - Pinned search bar with list filtering.** Add the search field
  above the scrolling sections so it stays put, filter the loaded verbs by
  infinitive as the query changes, and add the no-results state. Match
  case-insensitively.
  *Done when:* typing a query narrows the list to matching verbs while the field
  stays visible as the sections scroll; clearing the query restores all 30; a
  query that matches nothing shows the no-results message, and the level sections
  do not claim empty levels are a problem in that case. Typecheck and lint pass.

- [x] **Step 4 - Accessibility and both color schemes.** Label the search field,
  give each row a button role with the verb name and level announced, mark
  section headers as headers, and give rows a comfortable tap target. Check dark
  and light rendering.
  *Done when:* the web DOM exposes the search field as a labeled textbox, each row
  as a button whose accessible name includes the verb and its level, and each
  section header as a header; both color schemes render with readable contrast and
  no clipped text. Typecheck and lint pass.

## Files / areas

- `src/app/(tabs)/browse.tsx` - rewrite. Screen state, sections, pinned search,
  states. F6 builds on this file.
- `src/components/verb-list-item.tsx` - new. The list row.
- `src/hooks/use-verb-mastery.ts` - new. The mastery seam.

Reused as-is: `src/data/loader.ts` (`getAllVerbs`), `src/data/types.ts`
(`Verb`, `CefrLevel`, `CEFR_LEVELS`), and the primitives `Badge`, `Card`, `Input`,
`Spinner`, `EmptyState`, `Text`.

## Data / contracts

No server, network, auth, tenant, or payment boundary is involved. The data is
bundled, read-only, single-user, and offline, and this feature stores nothing.

**Section membership.** A verb belongs to the section for its own `cefrLevel`, not
to any level inferred from its id or filename. Sections come from `CEFR_LEVELS` in
order, so an unregistered level renders as an empty section rather than vanishing.
`getVerbsByLevel` already resolves an unregistered level to `[]`; the screen uses
`getAllVerbs()` once and groups, so it must still iterate `CEFR_LEVELS` to build
all six sections.

**Mastery seam.** F4 needs a mastery indicator, but mastery data belongs to F7
(storage) and F8 (model). F4 owns only the presentation vocabulary:

```ts
// src/hooks/use-verb-mastery.ts
export type MasteryState = "new" | "learning" | "known";

// Returns a stable lookup. Every verb is "new" until F7 supplies real progress.
export function useVerbMastery(): (verbId: string) => MasteryState;
```

The three states match the tones the design system already provides for exactly
this purpose (`Badge`'s `known`, `learning`, and `neutral` tones, with the
matching `colors.known` and `colors.learning` tokens). F7 replaces the hook body
with stored progress; F8 decides how a verb's items map to a state and what the
threshold is. Those thresholds are deliberately **not** defined here. The hook is
read-only, holds no state, and persists nothing.

`VerbListItem` takes mastery as a plain prop and stays presentational, so F7 and
F8 change one hook rather than the row.

**Search.** Case-insensitive substring match on `infinitive` only, applied to the
verbs already loaded. No new module, no index, and no stored query. The query is
user input, so it is rendered as plain text in the field, never as markup, and it
is compared as a plain string. No query is logged or persisted.

**Navigation.** A row pushes the existing `/verb/[id]` route with the verb's `id`.
F4 does not change that route, its params, or its header.

**Failure behavior.** A rejected load renders the error's message in place of the
list. The loader already rejects with `DataSetError` and a path-bearing message,
so the screen shows that message rather than swallowing it or rendering a blank
screen.

## Testing

No test runner is configured, so there is no test gate and this feature adds none.
Verification is `npx tsc --noEmit`, `npm run lint`, and real rendered evidence:
`npx expo export --platform web` plus the running screen, with a screenshot and a
DOM snapshot per step's done-when. The manual failure check in Step 1 is a
temporary local edit that is reverted and never committed.

No in-scope pure logic is added here. Filtering is a one-line predicate, and the
mastery seam is a constant. If a runner is added later, `VerbListItem` is a
component and stays out of unit tests per project standards; the filter predicate
in the screen is the only thing worth extracting if it grows.

Web is the only platform this environment can drive automatically. iOS and Android
render through the same React Native tree, but confirming them needs a simulator,
so the handoff lists the exact manual path and does not claim native evidence.

## Notes for the AI

- Match existing conventions: `@/*` imports, kebab-case filenames, `interface` for
  props, no `any`, theme tokens over hardcoded values, and no em dashes.
- Follow the patterns already in the codebase: screens are thin and presentational,
  domain components live in `src/components/`, hooks in `src/hooks/`, and reuse
  `Badge`, `Card`, `Input`, `Spinner`, and `EmptyState` rather than new primitives.
- Use `SectionList` (a React Native built-in) rather than hand-rolled section
  markup. It gives section headers and virtualization, so F14's 1000+ verbs do not
  force a rewrite, and it renders headers for empty sections.
- The pinned search field belongs outside the scrolling list so it does not scroll
  away. Do not add a sticky-header dependency; the existing layout primitives are
  enough.
- Do not pull search ranking, mastery storage, or detail content forward, even
  where it would make this screen feel more finished.
- `Badge` accepts either `level` or `tone`, so a row can carry a CEFR chip and a
  separate mastery chip. Keep the row to two chips.
- Keep `useVerbMastery` to a single exported type and hook. Do not add a context,
  provider, store, or default thresholds for F7.

## Open questions

Neither blocks implementation; both have a chosen default, so implement as written
unless the user overrides at review.

1. **Does F4's search bar actively filter, or only appear?** The build plan gives
   F4 "a search bar pinned at the top" and F6 "instant lookup across all bundled
   verbs", which can be read as F4 shipping only the control. A pinned field that
   does nothing is a dead control and would fail review, so the spec has F4 filter
   the loaded list by infinitive and leaves real lookup (senses, definitions,
   collocations, ranking, cross-level results) to F6. This keeps F4's increment
   small without shipping something visibly broken. F6 extends this same field, so
   little work is thrown away either way.
2. **Should empty levels say anything?** A1-C2 sections with A2-C2 empty is
   currently five empty sections above or below the real content. The spec renders
   all six with a short "No A1-level verbs yet" style line, which matches the
   plan's "A1->C2 sections" and shows the roadmap. If you would rather hide empty
   levels until F14 fills them, that is a one-line change; say so at review.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":10872,"specSha256":"83b16d4cebc80004b5e1963bdcee1e62ce6e3298ef24759f37d08212d163c949","branch":"refs/heads/feature/browse-by-cefr-level","head":"65fd22126436096037f841a8dba6a39487a725da","baseRef":"refs/heads/main","baseCommit":"65fd22126436096037f841a8dba6a39487a725da","sourceTree":"50a57af6a0c24f0007c773c210c27698a1fc2091","absentOptional":[]} -->
