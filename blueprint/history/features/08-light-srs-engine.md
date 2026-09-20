# Feature: Light SRS engine

**From build-plan:** feature 8
**Build attempt:** 1
**Status:** verified
**Branch:** feature/light-srs-engine

## Goal

Turn stored progress into a real spaced-repetition schedule. A study item is
graded after review, and the grade decides when that item comes back: `again`
brings it straight back, `good` grows the interval by the item's ease, and `easy`
grows it faster. Items that a learner keeps failing therefore recur sooner and
rise to the front of the queue, which is what makes F9's flashcards and F10's
quizzes prioritise weak items. F7 stored progress but filled it with placeholder
values; F8 is the engine that computes those values for real.

## In scope

- A pure scheduling module: the review grade vocabulary, the scheduling
  constants, and `scheduleReview(studyItemId, current, grade, now)` producing the
  next `ItemProgress`.
- A pure queue module: `buildStudyQueue(...)`, which selects due and unstarted
  items from a candidate scope and orders them with overdue and weak items first.
- One composed write on the progress context, `recordReview(id, grade, now)`, so
  a graded review schedules, persists, and counts toward today's streak in a
  single call.
- A React hook, `useStudyQueue()`, that loads the bundle and exposes the ordered
  queue plus due and new counts as a read seam for F9, F10, F11, and F12.
- Upgrading F7's two temporary affordances so the engine is observable: graded
  review buttons on Verb detail, and due, new, and queue numbers on the temporary
  Progress readout.

## Out of scope

- Flashcard and quiz screens, card presentation, swipe gestures, answer
  checking, and session flow. F9 and F10. F8 supplies the queue and the write
  seam they call.
- The Study tab mode and scope picker, including filtering a session by CEFR
  level. F11. F8's queue takes a candidate id list, so F11 filters on the way in.
- The Today hub, the daily session composition policy (how many new items a day,
  whether new items precede or follow due ones), streak surfacing, progress ring,
  and Verb of the Day. F12. F8 provides the mechanism for including unstarted
  items; F12 sets the policy.
- The Progress dashboard. F13 replaces F8's temporary readout.
- Changing the stored record shape. `ItemProgress` already carries `ease`,
  `intervalDays`, `dueAt`, and `reviewCount`, so `PROGRESS_SCHEMA_VERSION` stays
  1 and no migration is needed.
- Entitlement, ads, and purchase. F15 to F17.
- A test runner. See Testing.
- Repairing finding `F-01`. See Notes for the AI.

## Build loop

`workflow.stepReview` is `feature`, so all five steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so there are no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after every step (both are green on `main`
today), plus each step's own check. `/complete` makes the final feature commit.

## Build steps

- [x] 1. **Add the scheduling module.** Create `src/srs/schedule.ts` with
  `ReviewGrade`, `GRADE_LABEL`, the constants below, and
  `scheduleReview(studyItemId: string, current: ItemProgress | undefined, grade: ReviewGrade, now: Date): ItemProgress`.
  No React, and no storage import beyond the `ItemProgress` type.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green and the module
  imports nothing from `src/storage/progress-context.tsx` or `react`.

- [x] 2. **Add the queue module.** Create `src/srs/queue.ts` with
  `StudyQueueEntry`, `StudyQueueReason`, and `buildStudyQueue(...)` implementing
  the ordering below. It takes the candidate ids and a progress lookup, so it
  holds no dataset or storage dependency and is pure.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green and the module
  has no import of `@react-native-async-storage/async-storage`.

- [x] 3. **Add the composed review write.** In
  `src/storage/progress-context.tsx` add `recordReview(studyItemId, grade, now)`
  to `ProgressContextValue`: it reads the current record, calls `scheduleReview`,
  awaits `writeItemProgress`, updates the in-memory map, and then advances the
  streak. It keeps F7's ordering rule that memory follows storage, and it reuses
  the existing serialized streak queue.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, `recordReview`
  refuses while progress is loading or errored exactly as `saveItemProgress`
  does, and no screen has changed yet.

- [x] 4. **Add the queue hook.** Create `src/hooks/use-study-queue.ts` exposing
  `useStudyQueue(options?)` with loading, ready, and error states, plus the due
  and new counts and a `refresh()` that re-captures the current time. It loads
  the bundle the same way `use-study-stats.ts` does, and it must report loading or
  error rather than treating untracked items as new whenever progress is not
  ready.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green.

- [x] 5. **Make the engine observable and verify it live.** On
  `src/app/verb/[id].tsx` replace F7's single placeholder review button with four
  grade buttons (Again, Hard, Good, Easy) that call `recordReview` for each of the
  verb's study items, and keep the reset control. On
  `src/app/(tabs)/progress.tsx` extend the temporary readout with the due count,
  the new count, and a short preview of the first queue entries showing each
  entry's reason and interval. Both stay marked `TEMPORARY` with their remover.
  Then run the app and capture the evidence.
  **Done when** with the app running on the dev server: on a clean store every
  item is unstarted; grading `be` Good once makes its items due-dated one day out
  and not currently due; grading Good again grows the interval to 3 days and then
  8 and 20; grading Easy grows it further than Good from the same state; grading
  Again drops the item to interval 0, makes it due immediately, and moves its
  mastery badge back to Learning; the Progress readout shows the due and new
  counts changing accordingly, with due entries ordered most-overdue first; and a
  page reload preserves the scheduled values. Screenshots for the graded Verb
  detail state and the Progress readout before and after grading.

## Files / areas

- `src/srs/schedule.ts` (new) - grades, constants, `scheduleReview`.
- `src/srs/queue.ts` (new) - `StudyQueueEntry`, `buildStudyQueue`.
- `src/hooks/use-study-queue.ts` (new) - `useStudyQueue`.
- `src/storage/progress-context.tsx` - add `recordReview`.
- `src/app/verb/[id].tsx` - graded temporary control replacing the placeholder.
- `src/app/(tabs)/progress.tsx` - due, new, and queue preview on the temporary
  readout.

No dependency is added, and the bundled dataset is unchanged.

## Data / contracts

### Grades

```ts
// src/srs/schedule.ts
export type ReviewGrade = "again" | "hard" | "good" | "easy";
export const GRADE_LABEL: Record<ReviewGrade, string>;
```

The vocabulary is the SM-2 family, chosen so both study flows can feed it: F9's
flashcards self-rate with all four, and F10's quizzes map an objective result onto
it, a correct answer to `good` and a wrong one to `again`. Label text lives here
next to the grade, the same way F7 keeps `MASTERY_LABEL` next to the mastery
state, so the two study flows and the temporary control cannot drift apart.

### Scheduling constants

```ts
export const EASE_DEFAULT = 2.5;
export const EASE_MIN = 1.3;
export const MAX_INTERVAL_DAYS = 365;
const MS_PER_DAY = 86_400_000;
```

### `scheduleReview(studyItemId, current, grade, now)`

The id is passed in rather than read off `current`, because an unreviewed item has
no record yet and still has to produce a valid one. Let `priorCount`,
`priorInterval`, and `priorEase` come from `current`, defaulting to `0`, `0`, and
`EASE_DEFAULT`.

- `ease = max(EASE_MIN, priorEase + delta)` where delta is `-0.20` for `again`,
  `-0.15` for `hard`, `0` for `good`, `+0.15` for `easy`.
- `intervalDays`:
  - `again` is always `0`.
  - Otherwise, when `priorCount === 0` or `priorInterval === 0`, it is the first
    interval: `1` for `hard` and `good`, `2` for `easy`. This branch is what
    makes a lapsed item restart cleanly instead of staying pinned at zero.
  - Otherwise it is `min(MAX_INTERVAL_DAYS, max(priorInterval + 1, round(priorInterval * growth)))`,
    where growth is `1.2` for `hard`, the new `ease` for `good`, and
    `ease * 1.3` for `easy`. The `priorInterval + 1` floor keeps every passing
    grade strictly increasing: without it, `hard` from an interval of 1 rounds
    back to 1 forever.
- `reviewCount = priorCount + 1`, incremented on every grade including `again`,
  because the item was reviewed.
- `dueAt` is `now + intervalDays * MS_PER_DAY` as an ISO 8601 string. An interval
  is a duration, not a calendar day, so the arithmetic is elapsed milliseconds and
  is unaffected by daylight-saving changes. An interval of 0 therefore yields
  `dueAt` exactly at `now`, which makes a just-failed item immediately due.

Working through consecutive `good` grades from scratch gives intervals of 1, 3,
8, 20, 50, 125, 313, then the 365-day cap, so the 21-day mastery threshold is
reached on the fifth consecutive success. `hard` grows linearly at first and
`easy` outpaces `good` from the same state.

Malformed input cannot escape this module into storage: the store's existing
`validateItemProgress` already rejects a non-finite or non-positive `ease`, a
negative or non-finite interval, a negative integer `reviewCount`, and an
unparseable `dueAt`, so a NaN from an out-of-contract grade is rejected on write
rather than persisted.

### Queue ordering

```ts
// src/srs/queue.ts
export type StudyQueueReason = "due" | "new";

export interface StudyQueueEntry {
  studyItemId: string;
  reason: StudyQueueReason;
  // Absent only for an unstarted item.
  progress?: ItemProgress;
}

export function buildStudyQueue(options: {
  studyItemIds: string[];
  getItemProgress: (studyItemId: string) => ItemProgress | undefined;
  now: Date;
  includeNew: boolean;
  limit?: number;
}): StudyQueueEntry[];
```

Selection: an item with a record whose `dueAt` parses to at or before `now` is
`due`. An item with no record is `new`, and is included only when `includeNew` is
true. Every other item is omitted: not-yet-due items are not shown early.

Order: all `due` entries first, sorted by `dueAt` ascending, then by `ease`
ascending, then by the position the id held in `studyItemIds` so the result is
deterministic. `new` entries follow, in `studyItemIds` order. `limit` truncates
the finished list when given.

Weak items are prioritised by two mechanisms, neither of which is a hidden score.
A failing grade collapses the interval, so a repeatedly failed item comes due
again almost immediately and is essentially always present in the due list. Among
items that are equally due, the lower `ease` sorts first, which puts the ones with
the worst history at the head.

### `recordReview(id, grade, now)`

```ts
// src/storage/progress-context.tsx
recordReview: (studyItemId: string, grade: ReviewGrade, now: Date) => Promise<ItemProgress>;
```

Reads the item's current record, schedules the next one, awaits the storage write,
then updates the in-memory map and advances the streak. It refuses to write while
progress is loading or in its error state, exactly as `saveItemProgress` does, and
it returns the record it wrote so a caller can show the new interval.

Advancing the streak here rather than leaving it to the caller is deliberate: a
graded review is the act of studying, so keeping the streak correct should not
depend on a session screen remembering to call `updateStreak`. It is safe to call
per review because `advanceStreak` is already a per-day no-op, and the writes are
serialized through F7's existing streak queue. A session that grades twenty cards
therefore performs twenty small meta writes; that cost is accepted in exchange for
the streak being impossible to forget.

### Queue hook

```ts
// src/hooks/use-study-queue.ts
export interface StudyQueueOptions {
  includeNew?: boolean; // default true
  limit?: number;
}

export type StudyQueueState =
  | { status: "loading" }
  | { status: "ready"; queue: StudyQueueEntry[]; dueCount: number; newCount: number }
  | { status: "error"; message: string };

export function useStudyQueue(options?: StudyQueueOptions): StudyQueueState & { refresh: () => void };
```

The candidate scope is every study item of every bundled verb, via
`getAllVerbs()` and `getStudyItemIds`. `now` is captured once and held, so the
queue does not reshuffle on every render; `refresh()` re-captures the current time
for a session that wants to re-evaluate. When progress is loading or errored, the
hook returns that state instead of reporting every item as new, because reporting
an unreadable store as "everything is new" would be actively misleading.

`limit` shortens only the returned `queue`; `dueCount` and `newCount` always
describe the full selection. The full queue is built first and sliced after, so a
caller asking for a five-entry preview still sees true totals. Building the queue
with the limit already applied would report the cap as the total, which is exactly
what the first live run of step 5 did before this was corrected.

## Testing

No test runner is configured: `AGENTS.md` declares no test command and no `Verify`
command, so this feature has no automated test gate and must not add a runner
mid-step. The evidence for F8 is `npx tsc --noEmit`, `npm run lint`, and the
running app on the dev server with the screenshots listed in step 5.

This is the most test-shaped work in the project so far, and the independent
review of F7 recorded the absence of coverage as remaining risk. `scheduleReview`
is pure arithmetic with real edge cases: the ease floor at 1.3, the first-interval
branch, the strictly-increasing floor, the 365-day cap, and `again` resetting to
zero. `buildStudyQueue` has ordering and empty-result cases. Both are deliberately
free of React, storage, and dataset imports so a runner could cover them with no
mocking. If `/tests` is run, those two modules are where the tests belong. Do not
claim test or integration evidence that was not run.

On the screenshots step 5 asks for: the browser backend available in this session
failed to capture images (`browser screenshot activity capture failed for guest`,
then a stuck capture on retry), so no screenshots were produced. The live
verification instead read the exact persisted records out of storage and the
rendered accessibility tree, which is stronger evidence for this feature than a
picture, since the claim under test is the stored numbers rather than the styling.
The screenshots remain undone, not passed.

## Notes for the AI

- Scheduling lives in `src/srs/`, not `src/storage/`. Storage owns bytes;
  `src/srs/` owns the study policy. Keep the dataset out of it too: the queue
  takes ids so it stays pure.
- Do not add a dependency for this. The whole engine is arithmetic and array
  ordering over the standard library.
- Mastery derivation stays in `src/hooks/use-mastery.ts` and is unchanged.
  `MASTERY_INTERVAL_DAYS` stays 21, which the real intervals make meaningful for
  the first time: the fifth consecutive `good` lands at 50 days and the fourth at
  20. Do not add a second mastery lookup.
- `ItemProgress` and `PROGRESS_SCHEMA_VERSION` do not change. If you find yourself
  editing the stored shape or the validator's field rules, stop: that is a
  different feature and a migration.
- Finding `F-01 [P3] open` (reset does not drain an in-flight write) is still
  open in `blueprint/context/findings.md`. Do not repair it here; it needs an
  `/audit` pass to close it. F8's temporary control keeps F7's habit of disabling
  its buttons while a write is in flight, so F8 does not widen that window.
- Both temporary affordances stay scaffolding. Mark the graded control
  `TEMPORARY (F9 replaces this with the real flashcard flow)` and the Progress
  readout addition `TEMPORARY (F13 replaces this screen)`, and keep the
  placeholder framing around the Progress screen.
- Resolving a queue entry to its sense, collocation, or phrasal verb is the
  consumer's job, via `getStudyItem` in `src/data/loader.ts`. The queue returns
  ids and a reason on purpose.
- Files are kebab-case, exports PascalCase, props explicit interfaces. Use the
  theme tokens and existing primitives; add no UI primitives.
- No em dashes, en dashes, or ellipsis characters in generated content.

## Open questions

F8 proceeds with the decisions below. Confirm or change them at spec review.
Apart from the test-runner choice, each one only affects how future grades are
scheduled; none changes the stored record shape, so none needs a migration.

1. **Grade vocabulary: `again`, `hard`, `good`, `easy`.** A four-grade SM-2
   family is the smallest set that serves both study flows: F9 self-rates, and
   F10 maps an objective right or wrong answer onto the same scale. If you would
   rather start with only two grades (right and wrong), F10 would be simpler but
   F9 would lose the ability to self-rate, and adding grades later means touching
   the two study flows rather than any stored data.
2. **Interval growth constants: ease 2.5 to a floor of 1.3, `hard` at 1.2,
   `easy` at ease times 1.3, first intervals of 1, 1, and 2 days, and a 365-day
   cap.** These are conventional starting values, not tuned ones; the cap is what
   "light" means here, since without it intervals run into thousands of days. They
   are constants in one module and can be retuned without a migration. The
   numbers matter to a learner only in how often cards return, so they are worth
   a look if you have a preference.
3. **A due date is an exact duration from the review time, not the start of the
   day.** Studying at 23:00 with a 1-day interval makes the item due at 23:00 the
   next day, so it can miss a morning session. The alternative is flooring due
   dates to local midnight, which makes "due today" simple but makes every
   interval longer than the number of days it names. F8 keeps durations and
   leaves "due today" as a question F12 can answer by comparing dates, which
   changes no stored value.
4. **The queue can include unstarted items, but F8 does not set a daily policy.**
   A fresh install has nothing due, so F9 needs unstarted items to show anything
   at all. F8 provides the flag and the ordering; how many new items a day and
   whether they precede due ones belongs to F12. Nothing is limited by default.
5. **No test runner, again.** Running `/tests` before or alongside F8 would give
   the scheduling arithmetic the automated coverage it most deserves, and the two
   modules are written to need no mocking. Without it, the same logic is verified
   by typecheck, lint, and the live grading run. Say the word if you want `/tests`
   first; otherwise F8 ships on the same evidence basis as F7.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":18840,"specSha256":"a0635ff871f6a06a64ea8a2827c9a28f61630eccfbedbd829c7e75830f95a8f6","branch":"refs/heads/feature/light-srs-engine","head":"25d1c27eed54d806b54d0e09f7729fb7ec279dd3","baseRef":"refs/heads/main","baseCommit":"19bbf81e2073926d0f2b3fe4674de259c289f44d","sourceTree":"d524ae8ae805abff4eb4f84d5072b4562d0ee44c","absentOptional":[]} -->

# Independent Review

**Status:** passed
**Target commit:** 25d1c27eed54d806b54d0e09f7729fb7ec279dd3
**Base commit:** 19bbf81e2073926d0f2b3fe4674de259c289f44d
**Base ref:** refs/heads/main
**Spec hash:** a0635ff871f6a06a64ea8a2827c9a28f61630eccfbedbd829c7e75830f95a8f6
**Prepared by:** codex
**Builder model:** 1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-20T15:04:52+01:00
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** 1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-20T15:08:24+01:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npx tsc --noEmit`: pass (exit 0, no diagnostics)
- `npm run lint` (`expo lint`): pass (exit 0, no diagnostics)
- `node` direct execution of `src/srs/schedule.ts` and `src/srs/queue.ts` via a TypeScript transpile shim: pass (used as behavioral evidence; both modules import only the `ItemProgress` type, so direct execution was practical)
- `git rev-parse`/`merge-base`/`status` staleness checks against the recorded target and base: pass
- `rg` searches for forbidden imports, dead exports, `TODO`/`FIXME`/`console`/`any`, and test files: pass (no matches that indicate a defect)
- `npm run start` live dev-server run: unavailable (not required; Check was not required and no browser harness is configured)

## Evidence

- Staleness verified before review: `HEAD` = `25d1c27eed54d806b54d0e09f7729fb7ec279dd3` equals `Target commit`; `git merge-base refs/heads/main HEAD` = `19bbf81e2073926d0f2b3fe4674de259c289f44d` equals `Base commit`; raw SHA-256 of `blueprint/context/current-feature.md` = `a0635ff8...95a8f6` equals `Spec hash`; the only dirty path is the permitted evidence file `blueprint/context/review.md`.
- Delta reviewed: `19bbf81e..25d1c27e`, 7 files, `src/srs/schedule.ts` and `src/srs/queue.ts` (new), `src/hooks/use-study-queue.ts` (new), `src/storage/progress-context.tsx`, `src/app/verb/[id].tsx`, `src/app/(tabs)/progress.tsx`, `blueprint/context/current-feature.md`.
- `schedule.ts` arithmetic executed directly: consecutive `good` from scratch produced intervals 1, 3, 8, 20, 50, 125, 313, 365, 365, matching the spec exactly; `hard` produced 1, 2, 3, 4, 5, 6, 7 (strictly increasing, no stall); `easy` produced 2, 7, 27, 109, 365 (outpaces `good` at every reachable state except the interval-1 rounding tie recorded as F-02); ease converged to the 1.3 floor after repeated `again`; `again` returned `intervalDays: 0` with `dueAt` byte-equal to `now.toISOString()`; `reviewCount` incremented on every grade including `again`.
- First-interval branch executed for all passing grades from an unreviewed item and from a lapsed item (`intervalDays: 0`, `reviewCount: > 0`): `hard`/`good` returned 1 and `easy` returned 2, confirming the restart branch rather than a pinned zero.
- `queue.ts` executed directly: due items ordered before new, `dueAt` ascending then `ease` ascending then input position; a non-parseable `dueAt` was selected as due; `includeNew: false` dropped exactly the record-less items; `limit` truncated only the returned array; `limit: 0` and an empty id list returned `[]`; input array was not mutated.
- `queue.ts`/`schedule.ts` import inspection: no import of `react`, `@react-native-async-storage/async-storage`, or `progress-context`; only `import type { ItemProgress } from "@/storage/progress"`.
- `recordReview` (`src/storage/progress-context.tsx:139-158`) confirmed against the spec: `requireReady()` first, `await writeItemProgress(next)` before `setItems`, and streak advancement through the existing serialized `streakQueue` via `updateStreak`.
- `use-study-queue.ts` confirmed: the full queue is built without `limit` and only the returned `queue` is sliced, so `dueCount`/`newCount` are true totals; loading/error states are reported instead of treating an unreadable store as all-new.
- Spec claims spot-checked in `src/storage/progress.ts:68-100` (`validateItemProgress` rejects non-finite/non-positive `ease`, negative/non-finite interval, negative or non-integer `reviewCount`, unparseable `dueAt`) and in `src/hooks/use-mastery.ts:25-32` (`MASTERY_INTERVAL_DAYS` still 21, derivation unchanged).

## Findings

- F-02 [P3] open
- F-03 [P3] open
- F-01 [P3] re-examined, remains open (still present, intentionally deferred by the spec)

## Remaining risk

- No test runner and no `Verify` command are configured (`AGENTS.md`), so the pure scheduling and queue modules have no automated coverage. `schedule.ts` and `queue.ts` are import-free and testable per the spec's Testing section; absence of coverage remains open risk, not a defect.
- Step 5's requested screenshots were not produced. The spec's Testing section records the browser capture failure and substitutes read-back of persisted records plus the accessibility tree; that substitute evidence was not independently re-run in this review.
- `npm run start` / a live dev-server pass was not run, so the runtime rendering of the temporary controls is reviewed from code only.
- Queue `now` is captured at hook mount by design; F-03 records the resulting scaffolding gap. `refresh()` has no caller in F8, so `now` is only re-captured on remount.
- `recordReview` performs one item write plus one meta read/write per review (twenty cards means twenty meta writes). The spec accepts this cost explicitly for streak correctness; it was not profiled.
- `scheduleReview` assumes a valid `ReviewGrade`; an out-of-contract grade via a cast would produce `NaN` and throw in `toISOString()` before any write. TypeScript prevents this from the shipped callers, so it is not a reachable defect, only a robustness note.
