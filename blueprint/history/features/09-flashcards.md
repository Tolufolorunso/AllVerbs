# Feature: Flashcards

**From build-plan:** feature 9
**Build attempt:** 1
**Status:** verified
**Branch:** feature/flashcards

## Goal

Turn the SRS queue into something a learner can actually study. A full-screen card
shows one study item (a sense, a collocation, or a phrasal verb) as a question,
tapping reveals the answer, and grading it with Again, Hard, Good, or Easy writes
the real schedule through F8's engine. This is the first screen where the
spaced-repetition system becomes usable rather than inspectable, and it replaces
F8's temporary grading control on the verb page.

## In scope

- A pure id helper that recovers a study item's kind from its id, so a queue entry
  can be resolved without the queue carrying dataset knowledge.
- A pure card-face builder that turns a resolved study item into the question,
  answer, examples, and labels a card renders.
- A presentational `FlashCard` component: the visible card, the reveal affordance,
  and the swipe shortcut.
- A session hook that snapshots the queue once, resolves those items, tracks the
  current card, revealed state, re-queues failed cards, and grades through
  `recordReview`.
- The full-screen `/flashcards` route with its loading, error, empty, active, and
  complete states.
- Replacing the temporary grading control on verb detail with a real verb-scoped
  entry into the session.

## Out of scope

- Quizzes, and the quiz route. F10.
- The Study tab hub: the mode picker, the level scope, and the due-queue scope.
  F11. F9's screen takes only an optional single-verb scope, which is what its
  verb-page entry needs.
- The Today hub, the daily session size policy (how many new items a day, and
  whether new items lead or follow due ones), the streak surface, the progress
  ring, and Verb of the Day. F12. F9 studies the whole queue it is handed and
  caps nothing.
- The Progress dashboard. F13.
- Card flipping direction as a user setting, and reverse-mode practice. F9 has one
  fixed direction; see Open questions.
- Text-to-speech on cards. F9 does not add it, and the verb page already offers
  pronunciation.
- Changing the stored record shape, the schedule, or the queue ordering. F7 and F8
  own those and F9 adds no field.
- Repairing findings `F-01`, `F-02`, or `F-03`. See Notes for the AI.
- A test runner. See Testing.

## Build loop

`workflow.stepReview` is `feature`, so all five steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so there are no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after every step (both are green on `main`
today), plus each step's own check. `/complete` makes the final feature commit.

## Build steps

- [x] 1. **Recover a study item's kind from its id.** In `src/data/types.ts` add
  `STUDY_ITEM_KIND_LETTER` and `parseStudyItemId(id)`, using the existing
  `StudyItemKind` type. Point `src/data/validate.ts` at the same map instead of
  its own `COLLECTION_LETTER` copy, so the persisted id format has one definition.
  This is a pure function with no React or storage import.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, the validator's
  behavior is unchanged (the loader still accepts the bundled A1 file), and a
  direct check parses every bundled A1 study-item id into the right kind and
  rejects malformed ids such as a wrong segment count, an unknown letter, and an
  uppercase slug.

- [x] 2. **Build the card face and the card component.** Add
  `src/srs/card.ts` with `StudyCardFace` and `buildCardFace(resolved)` per the
  mapping below. Add `src/components/flash-card.tsx`, the presentational card: it
  shows the prompt, reveals the answer and examples on tap, announces the reveal
  to assistive technology, and offers the swipe shortcut. All user-facing strings
  come from the face, so the component renders any item kind without branching on
  it.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, `src/srs/card.ts`
  imports no React, and a direct check builds a face for one item of each kind from
  the bundled A1 data and shows the expected prompt, answer, and note for each.
  The component is wired into the route in step 4, so its visual check happens
  there.

- [x] 3. **Add the session hook.** Add `src/hooks/use-study-session.ts` exposing
  `useStudySession({ verbId })` with loading, error, empty, active, and complete
  states plus `reveal()`, `grade(grade)`, and `restart()`, following the contracts
  below. The queue is snapshotted once when the session starts and is never
  rebuilt while the session runs, and grading goes through `recordReview` so the
  schedule and the streak are written by F8's engine.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, and the hook
  resolves only the queued items rather than the whole dataset.

- [x] 4. **Add the full-screen route.** Replace the placeholder in
  `src/app/flashcards.tsx` with the real screen: a progress bar and counts, the
  card, the four grade buttons, and the complete-state summary. It reads an
  optional `verbId` parameter, sets the header title from the scope, and renders
  every non-active state. The existing Flashcards action on the Study tab already
  links here, so the route stays reachable.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, and with the dev
  server running: the loading state appears before data resolves, a bad scope such
  as `/flashcards?verbId=nope` shows the error state naming the verb, an active
  session runs at `/flashcards` and at `/flashcards?verbId=be`, and the empty state
  is reachable by finishing a session and reopening it, since with new items
  included the queue only empties once every bundled item has been reviewed and
  none is due. The complete state appears after the last card of a verb-scoped
  session.

- [x] 5. **Replace the verb page's temporary control and verify the session live.**
  Remove `ReviewControl` and its grading constants from `src/app/verb/[id].tsx` and
  put a real study entry in its place that links to the verb-scoped session. Then
  run the app and capture the evidence.
  **Done when** with the app running on the dev server: a fresh store shows the
  first card with the question side up and the grade buttons absent until the
  answer is revealed; revealing shows the answer, its examples, and the verb;
  grading writes the schedule (read the stored record back and confirm the
  interval, ease, `reviewCount`, and `dueAt` match F8's rules for that grade);
  grading a card Again puts it back in the session and it reappears after the other
  cards; the progress count and bar advance and the reviewed total is right;
  finishing the last card shows the complete state with the reviewed and
  again counts; leaving and returning preserves the schedule; and the verb page's
  study entry opens a session containing only that verb's items. Screenshots or,
  when the browser backend cannot capture them, the same evidence read from the
  accessibility tree and stored records, exactly as F7 and F8 did.

## Files / areas

- `src/data/types.ts` - `STUDY_ITEM_KIND_LETTER`, `parseStudyItemId`.
- `src/data/validate.ts` - use the shared letter map instead of its own copy.
- `src/srs/card.ts` (new) - `StudyCardFace`, `buildCardFace`.
- `src/components/flash-card.tsx` (new) - `FlashCard`.
- `src/hooks/use-study-session.ts` (new) - `useStudySession`.
- `src/app/flashcards.tsx` - the real session screen, replacing the placeholder.
- `src/app/verb/[id].tsx` - the temporary control replaced by a study entry.

No dependency is added, and no stored data changes.

## Data / contracts

### Recovering an item's kind

The queue carries plain ids by design (`src/srs/queue.ts`) so it stays pure, which
means the session has to recover the kind before it can resolve an item.

```ts
// src/data/types.ts
export type StudyItemKind = "sense" | "collocation" | "phrasalVerb";

export const STUDY_ITEM_KIND_LETTER: Record<StudyItemKind, "s" | "c" | "p"> = {
  sense: "s",
  collocation: "c",
  phrasalVerb: "p",
};

// Reads the "<verbId>.<letter>.<slug>" form back into a ref, or returns
// undefined when the id is not one. Offers no opinion about whether the item
// exists in the bundle.
export function parseStudyItemId(id: string): StudyItemRef | undefined;
```

`src/data/validate.ts` currently holds the same letter mapping as
`COLLECTION_LETTER`, keyed by collection name. Two copies of a persisted-key
format is one copy too many: the validator must import the shared map so a future
letter change cannot make the store and the validator disagree. The validator's
own `isValidStudyItemId` keeps its behavior; only where the mapping comes from
changes.

### The card face

```ts
// src/srs/card.ts
export interface StudyCardFace {
  studyItemId: string;
  kind: StudyItemKind;
  level: CefrLevel;
  // Labels are part of the contract so the component never branches on kind.
  promptLabel: string;
  prompt: string;
  answerLabel: string;
  answer: string;
  verbId: string;
  verbInfinitive: string;
  examples: string[];
  note?: string;
}

export function buildCardFace(resolved: ResolvedStudyItem): StudyCardFace;
```

The direction is fixed: the question shows the meaning side, the answer shows the
target-language form. One rule for all three kinds, which is also what makes the
senses of a verb distinguishable as separate cards, since their definitions differ
while their headword does not.

| Kind | promptLabel | prompt | answerLabel | answer | note |
| --- | --- | --- | --- | --- | --- |
| sense | `Recall the verb` | `sense.definition` | `Verb` | `verb.infinitive` | absent |
| collocation | `Complete the collocation` | `collocation.gloss` | `Collocation` | `collocation.text` | `collocation.type` |
| phrasalVerb | `Which phrasal verb?` | `phrasalVerb.meaning` | `Phrasal verb` | `phrasalVerb.phrase` | `particleNote`, else `separable` rendered as `Separable` / `Not separable` when present |

`examples` is `sense.examples`, or the single `example` for the other two kinds.
Every field is already present on the model in `src/data/types.ts`; F9 reads the
dataset and adds no content.

### The session

```ts
// src/hooks/use-study-session.ts
export interface StudySessionOptions {
  // Restricts the session to one verb's items. Absent studies the whole queue.
  verbId?: string;
}

export type StudySessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | {
      status: "active";
      face: StudyCardFace;
      revealed: boolean;
      reviewed: number;
      remaining: number;
      progress: number; // 0 to 1, for the bar
    }
  | { status: "complete"; reviewed: number; againCount: number };

export interface UseStudySessionResult {
  state: StudySessionState;
  reveal: () => void;
  grade: (grade: ReviewGrade) => Promise<void>;
  restart: () => void;
}

export function useStudySession(options: StudySessionOptions): UseStudySessionResult;
```

Sequence on start, all inside the hook:

1. Load the verb list once with `getAllVerbs()`.
2. Resolve the scope: the named verb's items via `getStudyItemIds`, otherwise every
   bundled item.
3. Build the queue once with `buildStudyQueue({ studyItemIds, getItemProgress, now,
   includeNew: true })`, where `now` is captured at that moment.
4. Resolve each queued entry through `getStudyItem(parseStudyItemId(id))` and build
   its face. An entry whose id does not parse or does not resolve is dropped, so an
   orphan progress record cannot produce a blank card.
5. If no faces remain, report `empty`. Otherwise report `active` at the first card.

A `verbId` that is not in the bundle is its own case rather than an empty session:
the screen reports `error` with a message naming the missing verb, so a mistyped
URL reads as a bad request instead of "you have finished studying". The verb page
only ever passes a real id, so this path exists for bad links and future callers.

**The session must also wait for stored progress to hydrate.** Building the queue
while the store is still loading would give every already-scheduled item no record,
so all of them would read as new: the session would offer cards that are not due
and would lose its position relative to real progress. The first live run of step 5
did exactly that, showing 68 cards when 4 were already graded and re-serving an
item that had just been reviewed. The queue-building effect therefore returns early
while progress is loading, `toState` reports `loading` until the store is ready, and
the store's error state is reported rather than being masked as a queue of new
items.

**The queue is snapshotted, and that is not an optimization.** F8's
`useStudyQueue` rebuilds its result whenever progress changes, because
`getItemProgress` is derived from the stored map. Grading a card changes that map,
so a session that read the live queue would reshuffle under the learner, reorder
the remaining cards, and move the card being studied. The session therefore takes
the queue exactly once and owns it from then on. `restart()` is the only way to
re-derive it, and it re-captures `now` so a card failed minutes ago is due again.

**Grading.** `grade(grade)` calls `recordReview(face.studyItemId, grade, now)` with
a fresh `now`, which schedules the next interval, persists it, and advances the
streak (F8). Then it advances the session:

- `reviewed` grows by one either way, and a non-`again` grade removes the card
  from the session.
- An `again` grade pushes a copy of that card to the end of the session list, so a
  failed card comes back before the session ends rather than only on a later
  session. It is counted once in `reviewed` per grading, and separately in
  `againCount`.
- If the write throws, the card stays current and the error surfaces; advancing
  would silently lose the review and desynchronize the schedule from what the
  learner did.

`remaining` is the count of cards still to review, which grows by one when a card
is failed. `progress` is `reviewed / (reviewed + remaining)`.

### The card component

```ts
// src/components/flash-card.tsx
export interface FlashCardProps {
  face: StudyCardFace;
  revealed: boolean;
  onReveal: () => void;
  // Swipe shortcuts, active only once revealed.
  onSwipeAgain?: () => void;
  onSwipeGood?: () => void;
  busy?: boolean;
}
```

Rendering rules:

- Question side: the `promptLabel`, the `prompt`, and the level badge, over a
  tappable area that fills the available height.
- After reveal: the `answerLabel`, the `answer`, the `verbInfinitive`, the
  `examples`, and the `note` when present, in place of the question. The prompt
  stays visible at reduced emphasis so the learner can see what they were asked.
- The whole card is one accessible control: a button labelled with the question
  when hidden and with the answer when revealed, with an accessibility hint that
  names the reveal action. The reveal is announced through a live region, since a
  tap that only changes text is otherwise silent to a screen reader.
- No grade control lives inside the card. Grades are the screen's row of four
  buttons, so the primary path needs no gesture and stays reachable and testable.

**Swipe.** The card also offers two shortcuts, active only once revealed: swipe
left grades `again`, swipe right grades `good`. Hard and Easy are buttons only,
and the screen prints a line naming the two shortcuts so the mapping is discoverable
rather than guessable. The gesture is built from React Native's own `Animated` and
`PanResponder`, deliberately not `react-native-gesture-handler` plus Reanimated:
the gesture library is installed but unused anywhere in `src/`, `GestureHandlerRootView`
is not mounted at the root, and no `babel.config.js` exists to confirm Reanimated's
compiler plugin is active. Choosing the core primitives adds no dependency, needs
no root-provider or build-config change, and works on the web target where the app
is verified. The swipe is an enhancement: everything is reachable by tap and the
buttons, and the live check states plainly whether it was proven.

## Testing

No test runner is configured: `AGENTS.md` declares no test command and no `Verify`
command, so this feature has no automated test gate and must not add a runner
mid-step. The evidence for F9 is `npx tsc --noEmit`, `npm run lint`, and the
running app on the dev server.

The logic this feature adds is small and testable: `parseStudyItemId` (valid and
malformed ids, each kind, unknown letters), `buildCardFace` (each kind, and the
optional note), and the session's requeue arithmetic (an `again` grows `remaining`
while `reviewed` also grows, and a passing grade does not). All three are free of
React, storage, and dataset imports, so a runner could cover them with no mocking.
The findings ledger already records the missing coverage as risk after F7 and F8;
`/tests` remains the answer, and these modules are the ones to point it at.

Read back the stored record after grading rather than trusting the screen: the
schedule is the actual product, and F8's live check confirmed that reading records
out of storage is the strongest available evidence here. Do not claim test
evidence that was not run.

On screenshots: the dev-server check produced none. This session's browser backend
fails every capture with `browser screenshot activity capture failed for guest`, the
same failure F7 and F8 recorded. The evidence is therefore the accessibility tree
and the exact persisted records, read back after each action. The swipe shortcuts
were proven this way too, by dispatching a real mouse-down, move, and up sequence at
the card, which is what React Native Web's responder system listens to; a
pointer-event or drag-tool sequence never delivered a press here, so the first
attempts silently did nothing and were a harness problem, not an app defect. The
screenshots remain undone, not passed.

## Notes for the AI

- The session snapshot rule above is the one place this feature can go subtly
  wrong. If you find yourself reading the live queue inside the session, or
  re-running `buildStudyQueue` on a progress change, stop and re-read that section.
- Reuse `buildStudyQueue` and `recordReview`. Do not add a second queue builder, a
  second grader, or a parallel progress store.

- **Guard the render against a stale face.** Grading is async, so a card can be
  replaced while a write is in flight. Disable the grade buttons and ignore a
  second grade while a write from the current card is still pending, and make the
  reveal and grade handlers no-ops on a non-active state. Without that, a fast
  double tap can grade a card the learner has not seen, or grade nothing at all.

- **Dataset text and stored text are plain rendered text.** The definition,
  examples, gloss, meaning, and note all come from the bundled JSON and the user's
  own store. None of them is HTML or markdown, so render them through the `Text`
  primitive. Never interpolate a card value into a URL or a raw element.
- The card component is presentational. It takes a face and callbacks and owns no
  session state, matching `StudyItemRow` and `VerbListItem`.
- Keep the swipe out of the grading path's critical route: buttons must work with
  no gesture at all, so the session is usable and verifiable without it.
- `src/app/(tabs)/study.tsx` already links to `/flashcards`, so leave it alone
  except as F11 later replaces that placeholder. F9 does not build the Study hub.
- Findings `F-01` (reset versus an in-flight write), `F-02` (`easy` can tie `good`
  at a one-day interval), and `F-03` (the temporary Progress readout never
  re-evaluates `now`) are all open P3 in `blueprint/context/findings.md`. Do not
  repair them here; each needs its own `/audit` pass to close. F9 does not widen
  F-01: it grades one card per write and the Progress reset it interacts with is
  on another screen.
- Files are kebab-case, exports PascalCase, props explicit interfaces. Use the
  theme tokens and the existing primitives; add no UI primitives beyond
  `FlashCard`, which is a domain component and is already named in the overview's
  component list.
- `Card` from `src/components/ui/card.tsx` is the surface for the card face; the
  full-screen layout uses `ProgressBar`, `Button`, `Badge`, `Text`, and
  `EmptyState`.
- No em dashes, en dashes, or ellipsis characters in generated content.

## Open questions

F9 proceeds with the decisions below. Confirm or change them at spec review. None
changes stored data or a persisted format, so none needs a migration.

1. **Card direction: question is the meaning, answer is the form.** One rule for
   all three kinds, which also distinguishes a verb's senses from each other. The
   alternative, showing the word and recalling the meaning, is recognition
   practice rather than production. Which is better depends on how you want the app
   used, and it is a presentation choice with no data impact. Say if you want the
   reverse, or both directions later as a setting.
2. **Swipe mapping: left is Again, right is Good, and Hard and Easy stay buttons.**
   A swipe has no way to distinguish Good from Easy, so the shortcut covers the two
   most common actions and the buttons cover all four. If you would rather have no
   swipe until the mapping can be configurable, F9 can ship tap plus buttons only,
   which removes the one part of this feature that is hard to verify here.
3. **A session never caps how many cards it takes.** The Study tab link opens the
   whole queue, so on a fresh install that is 68 new cards. F8 deliberately left
   the daily size policy to F12, and F9 respects that rather than inventing a
   number, but it does mean the unscoped session is long until F12 lands. If you
   want a provisional cap now, name it and F9 will use it.
4. **A failed card returns within the same session.** Standard flashcard behavior,
   and the reason the session counts `remaining` rather than only `reviewed`. The
   alternative, letting Again only affect the next session, is simpler but means a
   learner can finish a session with a card they just failed.
5. **Still no test runner.** This is the third feature in a row to ship its logic
   on typecheck, lint, and a live run, and the third time the ledger records the
   gap. The three pure modules here would need no mocking. `/tests` remains one
   command away if you would rather close that gap before F10 adds quiz scoring.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":22403,"specSha256":"2ac3143359b3a0570fa731573b88dc650389025b91122dad7ccbe9438fd919d2","branch":"refs/heads/feature/flashcards","head":"93a7484aa7d4dcf3d2c11e4f07fa22693616bb25","baseRef":"refs/heads/main","baseCommit":"19b598b0d5610f9b5cd96782cea056923a314eda","sourceTree":"dbc970691a561a3deccefe1d95e482a1cc707419","absentOptional":[]} -->

# Independent Review

**Status:** passed
**Target commit:** 93a7484aa7d4dcf3d2c11e4f07fa22693616bb25
**Base commit:** 19b598b0d5610f9b5cd96782cea056923a314eda
**Base ref:** refs/heads/main
**Spec hash:** 2ac3143359b3a0570fa731573b88dc650389025b91122dad7ccbe9438fd919d2
**Prepared by:** codex
**Builder model:** 1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash
**Requested reviewer:** codex
**Requested model:** runtime default (exact model not known until reviewer starts)
**Requested execution:** automatic
**Requested at:** 2026-09-20T19:07:34+01:00
**Workflow:** regular
**Check required:** no
**Reviewer adapter:** codex
**Reviewer model:** 1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash
**Reviewer context:** fresh subagent
**Actual execution:** automatic
**Reviewed at:** 2026-09-20T19:14:01+01:00
**Scope:** current
**Lenses:** quality, security, performance, tests
**Verdict:** passed
**Check result:** not-required

## Commands

- `npx tsc --noEmit`: pass
- `npm run lint` (`expo lint`): pass
- Direct `parseStudyItemId` check over all 68 bundled A1 study-item ids plus 12 malformed ids (node, in-memory transpile harness): pass
- Direct `buildCardFace` check for one item of each of the three kinds, plus every phrasal verb in the bundle (node, in-memory transpile harness): pass
- `validateVerbs(a1.json)` and `isValidStudyItemId` boundary check via the same harness: pass, no validation issues
- `/check`: not run, not required by the request

## Evidence

- Verified the recorded checkpoint before reviewing: `HEAD` equals `93a7484aa7d4dcf3d2c11e4f07fa22693616bb25`, `refs/heads/main` still produces merge base `19b598b0d5610f9b5cd96782cea056923a314eda`, and the raw `blueprint/context/current-feature.md` bytes hash to the recorded `2ac3143359b3a0570fa731573b88dc650389025b91122dad7ccbe9438fd919d2`.
- Working tree differed from the target only by the tracked `blueprint/context/review.md` request; no other tracked, staged, unstaged, or untracked path differed. No `Spec snapshot` field was present to verify.
- Reviewed the complete `19b598b0..93a7484` delta: `src/data/types.ts`, `src/data/validate.ts`, `src/srs/card.ts`, `src/components/flash-card.tsx`, `src/hooks/use-study-session.ts`, `src/app/flashcards.tsx`, `src/app/verb/[id].tsx` and the spec. Read supporting contracts to confirm reachability: `src/srs/queue.ts`, `src/srs/schedule.ts`, `src/storage/progress-context.tsx`, `src/storage/progress.ts`, `src/data/loader.ts`, `src/app/_layout.tsx`, `src/components/ui/card.tsx`, `src/components/ui/empty-state.tsx`, `src/components/ui/progress-bar.tsx`, `src/app/(tabs)/study.tsx`.
- Session snapshot rule holds. The queue-building effect depends only on `verbId`, `generation`, and `progressStatus` (src/hooks/use-study-session.ts:83-147); the progress lookup is read through `progressRef` (lines 78-81, 108), so grading's change to `getItemProgress` identity cannot re-run the effect, and `recordReview` never changes `progressStatus`. A snapshot from a superseded generation is treated as loading in `toState` (lines 231-240), so `restart()` is the only re-derivation and no state reset happens inside the effect.
- Hydration fix verified. The effect returns before `buildStudyQueue` while `progressStatus` is `loading` or `error` (lines 83-87, 106-111), and `toState` resolves `error` first, so an unreadable store is reported as an error rather than as a queue of new items (lines 222-230). `ProgressProvider` sets items and status in the same batch, so no window exists where status is ready with an empty map.
- Requeue arithmetic read from the code: an `again` grade appends the face and advances the index (lines 174-194), `reviewed` grows on every grade, `againCount` only on `again`, and a passing grade does not append. `progress` is exactly `reviewed / (reviewed + remaining)` (line 256) and increases on every grade.
- Grading re-entry is refused: `busyRef` is set synchronously before the write, `grade` returns early while it is set, and on a write failure the card stays current and the error is rethrown (lines 155-173). `reveal` and `grade` are no-ops unless the snapshot is `active` (lines 149-158).
- Kind mapping verified against the bundled data: all 68 ids parse to the kind their collection encodes, and no face carries a second definition of the id letters (`STUDY_ITEM_KIND_LETTER` is the only literal map; `validate.ts` derives its collection view from it and its behavior is unchanged, accepting the bundled A1 file with no issues).
- Card face verified against the spec table for all three kinds: sense gives `Recall the verb` / definition / `Verb` / infinitive / no note; collocation gives `Complete the collocation` / gloss / `Collocation` / text / `type`; phrasal verb gives `Which phrasal verb?` / meaning / `Phrasal verb` / phrase / `particleNote` else the rendered `separable` boolean. `examples` is `sense.examples` or the single `example` for the other two.
- `src/components/flash-card.tsx` is presentational: it takes a face and callbacks, reads only the theme, stores only an `Animated.Value`, and imports no session, progress, or storage module. Swipe handlers are attached only when `revealed && !busy` (lines 40-41, 79), left maps to `again` and right to `good` (lines 60-66), and hard/easy remain buttons, so the gesture cannot fire before reveal and never replaces a button.
- Step 5 removal confirmed: `ReviewControl`, its `GRADES` constant, the temporary grading loop, and the verb-page reset button are gone from `src/app/verb/[id].tsx`; the replacement `StudyEntry` links to `/flashcards` with `params: { verbId: verb.id }`. A repo-wide search finds no remaining `ReviewControl` or temporary-control text, and `resetProgress` stays reachable from the Progress tab.
- Security and performance: dataset and stored values are rendered through `Text`, no value is interpolated into a URL or raw element, ids read back from storage still pass `isValidStudyItemId` at the storage boundary, and no new network, dependency, or persisted field is added. Queue building touches only the queued ids, and the extra work is bounded by the 68-item bundle.
- No tests lens signal: the repository declares no test runner and contains no test files, so the new pure modules (`parseStudyItemId`, `buildCardFace`, the requeue arithmetic) remain uncovered by an automated gate, exactly as the spec's Testing section records.

## Findings

- F-04 [P3] open - `parseStudyItemId` accepts malformed slugs that the spec's step 1 done-when says it rejects
- F-05 [P3] open - A failed card keeps `remaining` flat rather than growing it by one as the spec states
- F-06 [P3] open - `FlashCard` restates the `Card` surface instead of using the primitive the spec names
- F-07 [P3] open - `KIND_BY_LETTER` is a second hand-written definition of the persisted id-letter format
- F-08 [P3] open - The queue-wide session's header shows the current card's verb rather than the scope
- No P0 or P1 finding is open or fixed, so the receipt passes.
- Re-examined as reviewed dependencies and left unchanged: F-01 and F-02 (both stay `open`); F-03's files were outside this pass's reviewed set and its entry is untouched.

## Remaining risk

- No test runner and no `Verify` command exist, so there is no automated coverage for `parseStudyItemId`, `buildCardFace`, or the session's requeue arithmetic, and no regression gate for future edits to them. This reviewer could not run unit tests, a coverage report, or a `Verify` command.
- Runtime and visual evidence could not be produced from this reviewer context. Check was not required, so the dev server, the accessibility tree, the swipe gesture, and the stored-record read-back described in the spec were not re-run; the spec's live evidence is the builder's and was not independently reproduced here. Screenshots remain absent for the whole feature.
- The reviewer runtime resolved to the same model identifier recorded for the builder (`1169d9fa-4d84-4e9f-8b70-c091db26fe59/deepseek-v4-flash`) because the request selected the runtime-default sentinel, so independence rests on the fresh isolated context rather than on a different model or family.
- Unverified, not raised as a finding: `Card`'s border/background recipe is duplicated inline in `flash-card.tsx` (F-06), so a future theme change to the shared surface would not reach the flashcard. Recorded with the finding rather than as a separate lead.
- Out of this pass's scope: the deferred F9 out-of-scope areas (quizzes, the Study hub, the daily size policy, the Progress dashboard) and the temporary queue readout's behavior on the Progress tab were not reviewed.
- The `again`-then-reopen path depends on `buildStudyQueue`'s clock semantics (`again` writes `dueAt` equal to the review instant, which is included because the comparison is `when > at`), which was read from `src/srs/queue.ts` and `src/srs/schedule.ts` but not exercised live in this pass.
