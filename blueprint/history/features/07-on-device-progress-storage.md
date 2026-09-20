# Feature: On-device progress storage

**From build-plan:** feature 7
**Build attempt:** 1
**Status:** verified
**Branch:** feature/on-device-progress-storage

## Goal

Give the app a durable, local record of study progress: one persisted record per
study item (sense, collocation, phrasal verb) keyed by its stable id, plus the
study streak and the derived stats the later screens read. After this feature a
learner's mastery does not reset when the app restarts, and the mastery badges
already rendered by Browse (F4) and Verb detail (F5) show real stored state
instead of a hardcoded "New".

## In scope

- A storage layer for per-study-item progress (`ItemProgress`, the overview's
  four SRS fields plus the study-item key) and for the streak, backed by one
  chosen on-device store.
- Read, write, and clear operations, with a single schema version and explicit
  behavior for corrupt records, missing records, and write failures.
- A React seam so F8, F9, F10, F12, and F13 read progress and write it without
  touching storage directly.
- Real mastery derivation behind the existing `use-mastery.ts` seam, so the
  Browse rows, the Verb detail header, and each study item row render stored
  state.
- Streak tracking (`current`, `longest`, `lastStudyDate`) and the derived stats
  (`verbsLearned`, `itemsMastered`, `perLevelCompletion`), exposed as read seams
  for F12/F13.
- Temporary verification affordances (see Notes for the AI) that make the stored
  state, the streak, and the stats observable before the real study flows exist.

## Out of scope

- SRS scheduling: computing `ease`, `intervalDays`, and `dueAt` from a review
  grade, the due queue, and queue prioritization. F8. F7 only stores what it is
  given.
- Flashcards, quizzes, session flow, and the "Today" CTA. F9, F10, F11, F12.
- The real Progress dashboard and the Today hub. F13 and F12 replace this
  feature's temporary readout.
- Entitlement (`isPaid`). F15 and F17.
- A test runner. See Testing.
- Any backend, account, sync, or network behavior. Progress is local-only.

## Build loop

`workflow.stepReview` is `feature`, so all five steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so there are no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after every step (both are green on `main`
today), plus each step's own check. `/complete` makes the final feature commit.

## Build steps

- [x] 1. **Add the store dependency and the storage modules.** Install
  `@react-native-async-storage/async-storage` with `npx expo install` (not a
  hand-pinned version, so the SDK-matched release is chosen). Add
  `src/storage/progress.ts` (record shape, key builders, validation, read, write,
  clear, `ProgressStoreError`) and `src/storage/streak.ts` (the pure date-key and
  streak helpers). Export the study-item id shape check from
  `src/data/validate.ts` so the store reuses the dataset's own id rules instead of
  restating them.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, the new modules
  contain no React import, and no screen behavior has changed.

- [x] 2. **Add the progress provider and wire it into the root layout.** Add
  `src/storage/progress-context.tsx`: `ProgressProvider` hydrates once on mount
  (one batched read), keeps records in a `Map` in state, and exposes
  `useProgress()` with `status`, `error`, `warnings`, `streak`,
  `getItemProgress(id)`, `saveItemProgress(record)`, `updateStreak(now)`, and
  `resetProgress()`. A write updates in-memory state only after the storage write
  resolves. Streak writes are serialized so two quick sessions cannot clobber each
  other. Mount the provider in `src/app/_layout.tsx` inside `SafeAreaProvider`.
  **Done when** the app boots to the Browse tab unchanged, hydration performs no
  write (no `allverb.progress.*` key exists on a cold start), and `npx tsc
  --noEmit` plus `npm run lint` are green.

- [x] 3. **Make the mastery seam real.** In `src/hooks/use-mastery.ts` add
  `MASTERY_INTERVAL_DAYS`, `deriveItemMastery(progress)`, and
  `deriveVerbMastery(verb, getItemProgress)`, and have both hooks read from
  `useProgress()`. `useVerbMastery()` takes the verb (`(verb: Verb) =>
  MasteryState`) because the rollup needs the verb's item list; update its three
  call sites in `src/app/(tabs)/browse.tsx` and `src/app/verb/[id].tsx`. Keep the
  exported `MASTERY_LABEL` / `MASTERY_TONE` and the `MasteryState` type as they
  are.
  **Done when** Browse, search results, and Verb detail still render with empty
  progress showing every badge as "New", the hooks re-render when a record
  changes, and `npx tsc --noEmit` plus `npm run lint` are green.

- [x] 4. **Add streak updates and derived stats, with a temporary readout.** Add
  `src/hooks/use-study-stats.ts` with `computeStudyStats(verbs, progress)` and
  `useStudyStats()` (loading / ready / error). Replace the Progress placeholder
  body with a **temporary** readout of streak and stats so the values are
  observable now; mark it `TEMPORARY (F13 replaces this screen)`.
  **Done when** on a clean install the readout shows the empty state (streak 0 /
  0, no last-study date, all counts 0), the stat totals match the bundled A1
  dataset (30 verbs, 68 study items), and `npx tsc --noEmit` plus `npm run lint`
  are green.

- [x] 5. **Add the temporary review control and prove persistence end to end.**
  On `src/app/verb/[id].tsx` add a **temporary** control that records one review
  for every study item of the displayed verb using the placeholder values below,
  advances the streak, and offers a reset; mark it `TEMPORARY (F9 removes this
  when real study flows write progress)`. Then run the app and capture the
  evidence.
  **Done when** with the app running on the dev server: one tap moves that verb's
  rows and its header badge to "Learning" and its Browse row follows after going
  back; a second tap moves them to "Known"; the Progress readout shows the streak
  and counts for one study day; reloading the app keeps all of it; reset returns
  every badge to "New" and the counts to zero. Screenshots captured for Browse
  and Progress before and after, plus the post-reload state.

## Files / areas

- `src/storage/progress.ts` (new) - record shape, keys, validation, read, write,
  clear, `ProgressStoreError`.
- `src/storage/streak.ts` (new) - `StreakState`, `toLocalDateKey`, `advanceStreak`.
- `src/storage/progress-context.tsx` (new) - `ProgressProvider`, `useProgress()`.
- `src/hooks/use-study-stats.ts` (new) - `computeStudyStats`, `useStudyStats`.
- `src/hooks/use-mastery.ts` - real derivation behind the existing seam; the
  verb-level lookup now takes the verb.
- `src/data/validate.ts` - export the study-item id shape check (reuse
  `VERB_ID`, `ITEM_SLUG`, `COLLECTION_LETTER`).
- `src/app/_layout.tsx` - mount the provider.
- `src/app/(tabs)/progress.tsx` - temporary streak and stats readout.
- `src/app/verb/[id].tsx` - temporary review control; verb-level mastery call
  site.
- `src/app/(tabs)/browse.tsx` - verb-level mastery call sites.
- `package.json` - the new dependency.

## Data / contracts

**Storage keys.** One prefix, `allverb.progress.`:

- `allverb.progress.meta` holds `{ schemaVersion: 1, streak: StreakState }`.
- `allverb.progress.item.<studyItemId>` holds one `ItemProgress` record.

Per-item keys, not one document, keep a review write at one small key instead of
rewriting the whole progress map, and remove read-modify-write races between
screens. Hydration is one `getAllKeys` filter by prefix plus one batched read.

```ts
// src/storage/progress.ts
export const PROGRESS_SCHEMA_VERSION = 1;
export const PROGRESS_PREFIX = "allverb.progress.";

export interface ItemProgress {
  studyItemId: string;   // "<verbId>.<s|p|c>.<slug>", from the bundled dataset
  ease: number;          // positive, default 2.5 when first written
  intervalDays: number;  // >= 0
  dueAt: string;         // ISO 8601 timestamp
  reviewCount: number;   // non-negative integer
}

export class ProgressStoreError extends Error {
  readonly issues: string[]; // one "<key> <problem>" entry per rejected record
}

export async function readProgress(): Promise<{
  items: Map<string, ItemProgress>;
  streak: StreakState;
  warnings: string[];
}>;
export async function writeItemProgress(progress: ItemProgress): Promise<void>;
export async function updateStreak(now: Date): Promise<StreakState>;
export async function clearProgress(): Promise<void>;
```

```ts
// src/storage/streak.ts
export interface StreakState {
  current: number;
  longest: number;
  lastStudyDate?: string; // "YYYY-MM-DD" in device local time, absent before day 1
}
export function toLocalDateKey(date: Date): string;
export function advanceStreak(streak: StreakState, now: Date): StreakState;
```

**Streak rule.** The day boundary is the device's local calendar date.
`advanceStreak` does nothing when `lastStudyDate` is already today; it increments
`current` when `lastStudyDate` is the calendar day immediately before today; it
resets `current` to 1 otherwise; then `longest = max(longest, current)`. The
"immediately before" comparison must work in local calendar components and a
date-only helper, not by dividing epoch milliseconds, so daylight-saving
transitions and month boundaries cannot shift a day.

**Record validation.** `studyItemId` must pass the dataset's own id shape check,
`ease` must be a finite positive number, `intervalDays` a finite number `>= 0`,
`reviewCount` a non-negative integer, and `dueAt` a string that parses as a valid
date. A record that fails is never written (the write rejects with
`ProgressStoreError`) and is skipped on read, kept in storage, and reported in
`warnings`, so unusable data is visible instead of silently discarded or deleted.

**Degradation.** Missing keys are normal and mean "no progress yet". Unparseable
JSON for one item skips that item only. A missing or unrecognized
`allverb.progress.meta` `schemaVersion` puts the provider in its error state,
where the app still runs with empty in-memory progress and writes are refused
rather than overwriting data the app does not understand. Nothing is migrated or
deleted automatically in this feature. A failed write leaves in-memory state
unchanged and rejects, so the caller can report it.

**Orphan records.** A record whose id is not in the current bundle is kept in
storage but contributes nothing to mastery or stats (stats count only records that
resolve to a bundled study item).

**Mastery rules (derived, never persisted).** These live in `use-mastery.ts`, the
single seam F4 and F5 created; F8 refines them here and nowhere else.

- Item: no record or `reviewCount` 0 is "new"; `intervalDays` at or above
  `MASTERY_INTERVAL_DAYS` (21) is "known"; otherwise "learning".
- Verb rollup: no items is "new"; every item "known" is "known"; every item
  "new" is "new"; otherwise "learning".

**Stats (`useStudyStats`).**

```ts
export interface StudyStats {
  verbsLearned: number;   // verbs whose rollup is "known"
  itemsMastered: number;  // bundled items whose derived mastery is "known"
  perLevelCompletion: Record<CefrLevel, { learned: number; total: number }>;
}
```

`total` counts bundled verbs at that level, so A1 reports what the dataset
actually holds. Nothing in this feature renders stats outside the temporary
readout.

**Temporary review control values.** It writes `ease: 2.5`, `reviewCount: 1`,
`intervalDays: 1`, `dueAt: now + 1 day` on the first tap, and `reviewCount: 2`,
`intervalDays: 30`, `dueAt: now + 30 days` on the next, so both non-new mastery
states are reachable without pulling SRS scheduling forward. F8 replaces these
values with real scheduling and F9 removes the control.

## Testing

No test runner is configured: `AGENTS.md` declares no test command, so this
feature has no automated test gate and must not add a runner mid-step. The
evidence for F7 is `npx tsc --noEmit`, `npm run lint`, and the running app on the
dev server with the screenshots listed in step 5.

The logic this feature adds is exactly the pure, edge-case-bearing kind a runner
would cover: `toLocalDateKey` and `advanceStreak` across same-day, consecutive
days, gaps, month and year boundaries, and daylight-saving transitions; record
validation for malformed JSON, wrong field types, and unknown ids; mastery
derivation at 0, 1, and 20/21 interval days; and `computeStudyStats` with empty
progress, orphan records, and a partially mastered verb. If a runner is added
later (`/tests`), those four seams are where the tests belong. Do not claim test
or integration evidence that was not run.

## Notes for the AI

- Storage lives in `src/storage/`, not `src/data/`: `src/data/` is the bundled,
  read-only dataset and its README says so. Progress is the app's only writable
  state.
- Keep the mastery seam in `use-mastery.ts`. Do not add a second mastery lookup
  elsewhere; F8 changes that one file.
- Use the existing primitives (`Text`, `Button`, `Card`, `Badge`) and theme
  tokens, including the `known` and `learning` colors. Do not add UI primitives.
- Both temporary affordances are scaffolding, not product UI. Mark each with a
  `TEMPORARY` comment naming its remover (F9 for the review control, F13 for the
  Progress readout) so the later spec deletes it instead of building around it.
  `src/app/(tabs)/progress.tsx` keeps its placeholder framing around the readout
  so F13 still reads as the dashboard's owner.
- `review.independentExecution` is `automatic` and `qualityGates.regular`
  selects independent review `when-sensitive`; this feature touches persisted
  data, so expect that gate to trigger.
- Files are kebab-case, exports PascalCase, props explicit interfaces.
- No em dashes, en dashes, or ellipsis characters in generated content.
- AsyncStorage has a per-app size budget on Android (about 6 MB by default).
  Records here are small; if size ever becomes a problem at F14 scale, the store
  module is the only file that changes.

## Open questions

F7 proceeds with the decisions below; each is reversible without a data migration
for existing users, so none of them blocks the build. Confirm or change them at
spec review.

1. **Storage backend: AsyncStorage**, not expo-sqlite. It is the smaller
   dependency, needs no config plugin, and works on web through `localStorage`,
   which keeps the web preview usable. Progress data is a few thousand small
   records read wholesale for the due queue, so a query engine adds machinery
   with no current requirement. The F3 archive left this choice to F7.
2. **Mastery thresholds: 21-day interval for "known", all-items-known for a
   learned verb.** SM-2 convention calls a card "mature" at a 21-day interval,
   and the overview's "a verb is learned once its items pass a mastery
   threshold" reads as all of them. F5's archive assigns the final rollup rule to
   F8; these values are derived at render time, so F8 changes one file with no
   migration. If you would rather count a verb as learned when any item is
   known, or use a different interval, say so before `/implement`.
3. **Streak day boundary: the device's local calendar date.** A daily study
   session belongs to the learner's own day, so a UTC boundary would reset
   streaks early for some time zones and late for others. This is what
   `lastStudyDate` will mean for every later feature.
4. **Temporary affordances.** The review control on Verb detail exists only to
   prove stored progress end to end before F9 can write it, mirroring the
   temporary count line F3 put on Browse and F4 deleted. If you would rather ship
   F7 with no visible scaffolding, the alternative is verifying the store through
   typecheck, lint, and code review only, which cannot prove persistence survives
   a restart.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":15761,"specSha256":"af651a5a14bca12cb85af8a98cb81e623f6ce89efa19938c8e15cfe7836dc65b","branch":"refs/heads/feature/on-device-progress-storage","head":"8279403ca061b13409d05bcc6d3c18526a699271","baseRef":"refs/heads/main","baseCommit":"db28dcbb41b1af9707729864861b4e4e57c58f1b","sourceTree":"92c02ec330686ca077235606e14795fd9bba3821","absentOptional":[]} -->

# Independent Review

**Status:** passed
**Target commit:** 8279403ca061b13409d05bcc6d3c18526a699271
**Base commit:** db28dcbb41b1af9707729864861b4e4e57c58f1b
**Base ref:** refs/heads/main
**Spec hash:** af651a5a14bca12cb85af8a98cb81e623f6ce89efa19938c8e15cfe7836dc65b
**Prepared by:** codex
**Builder model:** 1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-20T14:28:49+01:00
**Workflow:** regular
**Check required:** no

## Handoff

Review the active spec and the complete `db28dcbb41b1af9707729864861b4e4e57c58f1b..8279403ca061b13409d05bcc6d3c18526a699271` delta in a fresh
session or isolated subagent without the builder conversation. Run all Audit lenses from scratch.
Run Check when required above. Do not edit product code, accept findings, or
reuse the existing findings as the review scope.

**Reviewer adapter:** codex
**Reviewer model:** 1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-20T14:33:27+01:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npx tsc --noEmit`: pass (exit 0, no output)
- `npx expo lint`: pass (exit 0, no output)
- `node --experimental-strip-types` direct execution of `src/storage/streak.ts` (`advanceStreak`, `toLocalDateKey`, `EMPTY_STREAK`): pass
- `/check`: not run (Check required: no)
- project test command: unavailable (no test runner declared in `AGENTS.md`)

## Evidence

- Freshness re-derived, not assumed: `git rev-parse HEAD` = `8279403ca061b13409d05bcc6d3c18526a699271` (equals Target commit); `git merge-base refs/heads/main <target>` = `db28dcbb41b1af9707729864861b4e4e57c58f1b` (equals Base commit); `refs/heads/main` still resolves and is a local `main`, not the work branch.
- `git status --porcelain` showed one path, ` M blueprint/context/review.md`; no other tracked, staged, unstaged, or untracked path differs from the target (`findings.md` was clean before this pass).
- SHA-256 of `blueprint/context/current-feature.md` recomputed over raw bytes = `af651a5a14bca12cb85af8a98cb81e623f6ce89efa19938c8e15cfe7836dc65b`, matching `Spec hash`. No `Spec snapshot` field is present, so none was required.
- Delta reviewed in full: 14 files, `+1322 / -38` (`git diff --name-status`). Read the whole diff or the full post-change file for every changed path: `src/storage/progress.ts`, `src/storage/streak.ts`, `src/storage/progress-context.tsx`, `src/hooks/use-mastery.ts`, `src/hooks/use-study-stats.ts`, `src/app/(tabs)/progress.tsx`, `src/app/verb/[id].tsx`, `src/app/(tabs)/browse.tsx`, `src/app/_layout.tsx`, `src/data/types.ts`, `src/data/validate.ts`, `package.json`, `package-lock.json`, `blueprint/context/current-feature.md`.
- Spec contract confirmed against code: `ItemProgress` carries the key plus the four SRS fields with the specified defaults and validation bounds; `PROGRESS_SCHEMA_VERSION`/`PROGRESS_PREFIX`, `readProgress`, `writeItemProgress`, `updateStreak`, `clearProgress`, `ProgressStoreError(issues)` all exported as specified; the per-item key scheme and one batched `multiGet` hydration match the Data/contracts section.
- Spec degradation rules confirmed against code: absent keys are normal; unparseable per-item JSON skips only that record and reports a warning; a non-object or non-`1` meta `schemaVersion` throws into the provider's error state with empty in-memory progress and refused writes; invalid records reject on write and are kept-but-skipped on read (`validateItemProgress` also enforces that the stored key matches `allverb.progress.item.<studyItemId>`); hydration performs no `setItem` (`readProgress`/`readMeta` only call `getAllKeys`, `getItem`, `multiGet`), so a cold start creates no `allverb.progress.*` key.
- Mastery rules confirmed against spec: `MASTERY_INTERVAL_DAYS` is 21, item is `new` at no record or `reviewCount` 0, `known` at `intervalDays >= 21`, otherwise `learning`; verb rollup is `new` for no items, `known` when all items are known, `new` when all are new, otherwise `learning`. `MASTERY_LABEL`, `MASTERY_TONE`, and `MasteryState` are unchanged; the verb-level signature change was applied at exactly the three call sites (`browse.tsx` two, `verb/[id].tsx` one) and no second mastery lookup was introduced.
- Stats confirmed against spec: `computeStudyStats(verbs, lookup)` returns `verbsLearned`, `itemsMastered`, and `perLevelCompletion`; totals count bundled verbs per level; orphan records contribute nothing because iteration is driven by the bundled verb list; `useStudyStats` returns loading/ready/error.
- Streak edge cases executed directly against the module (local calendar arithmetic, not epoch math): cold start `1/1`; same day no-op; next day `2/2`; gap resets `current` to 1 and keeps `longest`; month boundary `2026-08-31 -> 2026-09-01` `4/4`; year boundary `2026-12-31 -> 2027-01-01` `6/6`; US DST spring-forward and fall-back next days both increment normally; a future `lastStudyDate` resets `current` to 1 without lowering `longest`. All matched the specified rule.
- Id boundary check: `isValidStudyItemId` reuses `VERB_ID`, `ITEM_SLUG`, and `COLLECTION_LETTER` from `src/data/validate.ts` rather than restating them; it rejects a wrong segment count, unknown collection letters, position-style slugs, uppercase, and underscore slugs, and, with the key-match check in `validateItemProgress`, cannot produce a key that collides with `allverb.progress.meta`.
- Lenses: security and performance found no reachable issue. Storage is local-only with no network, auth, secret, or injection surface; stored data is validated on read and write at the boundary per `coding-standards.md`; work is bounded by the bundled dataset (30 A1 verbs, 68 study items, verified from `src/data/verbs/a1.json`) and hydration is one prefix-filtered batched read with no N+1 pattern.
- Standards checked: kebab-case files, PascalCase exports, explicit prop interfaces, `@/*` alias (relative sibling imports match the existing `src/data` pattern), theme tokens instead of hardcoded values (verified in the new screens), no `any`/`@ts-ignore`/`eslint-disable`, no `console` statements, no commented-out code, and no em dash, en dash, or ellipsis characters anywhere in the delta.
- Temporary scaffolding is marked as the spec requires: `TEMPORARY (F9 ...)` on the Verb detail review control and `TEMPORARY (F13 ...)` on the Progress readout, with the placeholder framing kept around the readout.
- Both temporary values are reachable as specified: first tap writes `reviewCount: 1, intervalDays: 1` (`learning`) and the next writes `reviewCount: 2, intervalDays: 30` (`known`), with `ease: 2.5` and a matching `dueAt` offset on both.

## Findings

- F-01 [P3] open - Reset does not coordinate with an in-flight progress write (src/storage/progress-context.tsx:133)
- No P0 or P1 finding is open or fixed. All four lenses covered the complete `db28dcbb..8279403c` delta.

## Remaining risk

- `/check` was not required and was not run, so no reviewer-side confirmation of the running app exists. The spec's step 5 done-when (badges moving New -> Learning -> Known across Verb detail and Browse, the Progress readout for one study day, survival across reload, and reset) rests on the builder's captured evidence, which is not present in the repository and could not be independently reproduced in this session.
- No test runner is declared in `AGENTS.md`, so there is no automated coverage for the streak, record validation, mastery, and stats logic this feature adds. The spec's Testing section predicts tests at those seams for a future `/tests` pass. I substituted direct module execution for the streak helper and id validator only.
- The step 4 done-when figure "68 study items" is not directly observable in the temporary readout: `StudyStats` (per spec) exposes no total-item count, and the readout renders verb totals per level plus `itemsMastered`. That part of the criterion was checked by reading `computeStudyStats` against the dataset, not from a rendered value.
- The Progress screen's reset button is not disabled while its own reset is in flight (`loading` sets the disabled state in `Button`, so this is only a cosmetic double-invocation risk, not a defect); noted because it sits next to the F-01 concurrency gap.
- `src/data/types.ts` gained the `getStudyItemIds` helper but is not listed in the spec's `Files / areas`; the export is required by the specified verb rollup and is consistent with that file's read-only data role, so it is recorded as minor spec-list drift rather than a finding.
- Unavailable verification commands: `/check` (not required), any project test command (none declared), any browser or end-to-end harness (not configured).
