# Feature: Quizzes

**From build-plan:** feature 10
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/quizzes`

## Goal

Turn the same SRS queue F9 studies into active recall. A full-screen quiz presents
one study item as an exercise with a small set of options, tells the learner
immediately whether they were right and what the correct answer is, and writes the
real schedule through F8's engine, so a wrong answer comes back soon and a right
answer moves the item forward. F9 proves recall by self-assessment; F10 proves it
by asking.

## In scope

- A pure exercise builder in `src/srs/exercise.ts` that turns a resolved study item
  plus a distractor pool into one answerable question, across the four exercise
  kinds the plan names: multiple choice, correct form, fill in the blank, and
  complete the phrase.
- Extracting F9's session mechanics into `src/hooks/use-queue-session.ts` so the
  quiz and the flashcard session share one queue snapshot, one hydration gate, one
  requeue rule, and one `recordReview` call, instead of a second copy.
- Keeping `useStudySession` as a thin facade over that container, with its public
  API and F9's screen behavior unchanged.
- A presentational `QuizOption` component: one tappable option in its idle,
  correct, wrong, and muted states.
- The real `/quiz` screen, replacing the placeholder: prompt, options, immediate
  feedback with the correct answer, an explicit Continue, the progress counts, and
  the loading, error, empty, active, and complete states.
- The answer-to-grade mapping: a correct answer grades `good`, a wrong answer
  grades `again`, both through the existing `recordReview`.

## Out of scope

- Typed free-text answers, spelling tolerance, and answer grading by string
  similarity. Every exercise is multiple choice, including the gap formats, so the
  feature needs no keyboard flow and no fuzzy matching. See the decisions under
  Data / contracts.
- The Study tab hub: the mode picker, the level scope, and the due-queue scope.
  F11. The `/quiz` link already on the Study tab placeholder keeps this route
  reachable, and F10 changes neither that placeholder nor the route list.
- The Today hub, the daily session policy, the streak surface, the progress ring,
  and Verb of the Day. F12.
- The Progress dashboard. F13.
- Quiz-shaped content authoring at scale, and an audit of distractor plausibility
  across the full dataset. F14 owns content; the builder guarantees one structural
  answer, not that every distractor is a good pedagogic foil.
- Changing the stored record shape, the schedule, the queue ordering, or the
  mastery threshold. F7 and F8 own those, and F10 adds no field to either.
- A quiz entry point on the verb page. F11 owns entry points; F10 only answers the
  optional `verbId` parameter when a link supplies one.
- Text-to-speech on quizzes. The verb page already offers pronunciation.
- Repairing findings `F-01` through `F-08`. See Notes for the AI.
- A test runner. See Testing.

## Build loop

`workflow.stepReview` is `feature`, so all five steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so there are no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after every step (both are green on `main`
today), plus each step's own check. `/complete` makes the final feature commit.

## Build steps

- [x] 1. **Extract the shared queue session.** Move F9's session mechanics out of
  `src/hooks/use-study-session.ts` into a new `src/hooks/use-queue-session.ts` with
  the contract below, and rewrite `use-study-session.ts` as a facade that maps the
  resolved item to a card face through `buildCardFace` and keeps its public API
  byte for byte. The container reports the resolved item rather than a face, and
  also reports the current card position and the library the queue was built from,
  because steps 2 to 4 consume both. No behavior changes for flashcards: the
  hydration gate, the single queue snapshot, the orphan drop, the `again` requeue,
  the stale-card guard, and the `remaining` arithmetic all move across unchanged.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green,
  `src/app/flashcards.tsx` and `src/components/flash-card.tsx` are untouched by the
  step's diff, and with the dev server running the flashcard flow still behaves as
  F9 verified: `/flashcards?verbId=be` shows a card, reveal then each of the four
  grades advances it, the stored record for a graded item matches F8's rules for
  that grade, and the last card reaches the complete state with the reviewed and
  again counts.

- [x] 2. **Add the exercise builder.** Add `src/srs/exercise.ts` with
  `ExercisePool`, `QuizExercise`, `buildExercisePool(verbs)`, and
  `buildExercise(resolved, pool)` per the contracts and the option tables below.
  Pure and deterministic: no React, no storage, no `Math.random`, no `Date`, and
  only type imports from `src/data/types.ts`.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green, the module imports
  no React and no storage, and a direct check compiled from the module against the
  bundled A1 data shows: every one of the 68 study items yields an exercise; every
  exercise has at least three options with distinct ids and distinct labels;
  exactly one option id equals `correctOptionId`; for the three kinds where the
  answer is the item's own text, the correct option's label equals that recorded
  text; the sentence and phrase prompts contain exactly one blank marker and keep
  the rest of the source string; building the same item twice returns an identical
  exercise; and the per-kind counts print with all four kinds represented. Record
  the printed counts as evidence.

- [x] 3. **Add the option component.** Add `src/components/quiz-option.tsx` with
  `QuizOption` and `QuizOptionResult` per the contract below: one full-width
  tappable option that renders its idle, correct, wrong, and muted states, carries
  a text badge for the answered states so the result is never colour alone, and
  labels itself for assistive technology.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green. The component is
  wired into the route in step 4, so its visual check happens there.

- [x] 4. **Replace the quiz route.** Replace the placeholder in `src/app/quiz.tsx`
  with the real screen: it reads an optional `verbId` parameter the same way
  `src/app/flashcards.tsx` does, drives the session with `useQueueSession`, builds
  the pool once from the session library, builds one exercise per card, and runs
  the answer then Continue loop. It sets the header title from the scope, renders
  all five states, and maps the answer to a grade when Continue is pressed.
  **Done when** `npx tsc --noEmit` and `npm run lint` are green and, with the dev
  server running: the loading state appears before data resolves; `/quiz?verbId=nope`
  shows the error state naming the verb; an active session runs at `/quiz` and at
  `/quiz?verbId=be`; choosing the correct option marks it correct and shows
  Continue, choosing a wrong option marks that option wrong and the correct option
  correct, and the correct answer is also stated in text; options stop responding
  once answered and the Continue button is disabled while its write is in flight;
  Continue advances to the next exercise with the previous feedback cleared; and
  the complete state reports the answered and correct counts with a working restart.

- [x] 5. **Check the quiz live and confirm the schedule writes.** Run the app,
  finish a session with a mix of right and wrong answers, then read the stored
  records back for the items answered.
  **Done when** the read-back confirms that a right answer produced the record F8's
  rules give `good`, a wrong answer produced the record they give `again` (interval
  zero, so the item is due immediately and no longer reads as scheduled), the
  streak kept F7's once-per-study-day rule rather than counting once per answer,
  a failed write leaves the card on screen with a readable error, and no record
  gained a field F8's shape does not already have. Screenshots if the browser
  backend can capture them; otherwise the accessibility tree plus the exact
  persisted records, exactly as F7, F8, and F9 did.

## Files / areas

- `src/hooks/use-queue-session.ts` (new) - the shared session container.
- `src/hooks/use-study-session.ts` - rewritten as a facade over the container,
  same public API.
- `src/srs/exercise.ts` (new) - the exercise pool and the exercise builder.
- `src/components/quiz-option.tsx` (new) - `QuizOption`.
- `src/app/quiz.tsx` - the real screen, replacing the placeholder.

Unchanged, and worth confirming in review: `src/app/flashcards.tsx`,
`src/components/flash-card.tsx`, `src/srs/card.ts`, `src/srs/queue.ts`,
`src/srs/schedule.ts`, everything under `src/storage/`, everything under
`src/data/`, `src/app/(tabs)/study.tsx`, and `src/app/_layout.tsx`, which already
registers the `quiz` route. No dependency is added and no stored data changes.

## Data / contracts

### The shared session container

The container is F9's session with the card face factored out, so both study flows
present the same queue. Everything below is a preservation requirement, not a new
design: F9's behavior must survive the move.

```ts
// src/hooks/use-queue-session.ts
export interface QueueSessionOptions {
  // Restricts the session to one verb's items. Absent studies the whole queue.
  verbId?: string;
}

export type QueueSessionState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "empty" }
  | {
      status: "active";
      item: ResolvedStudyItem;
      // Position of the current card, 0 based. Consumers derive a per-card reset
      // from it, the way the flashcard screen derives its reveal.
      index: number;
      revealed: boolean;
      reviewed: number;
      remaining: number;
      progress: number; // 0 to 1, for the bar
      // The verbs the queue was built from, so a consumer can build distractors
      // without a second load.
      library: Verb[];
    }
  | { status: "complete"; reviewed: number; againCount: number };

export interface UseQueueSessionResult {
  state: QueueSessionState;
  busy: boolean;
  reveal: () => void;
  grade: (grade: ReviewGrade) => Promise<void>;
  restart: () => void;
}

export function useQueueSession(options: QueueSessionOptions): UseQueueSessionResult;
```

Preserved on the way across:

- The session waits for stored progress to hydrate, reports a store read failure as
  `error` with the store's message, and never builds a queue from an unhydrated
  store.
- The scope is resolved exactly as F9 does: `getVerbById` plus `getStudyItemIds`
  for a named verb, otherwise `getAllVerbs().flatMap(getStudyItemIds)`. A `verbId`
  that is not in the bundle is an `error` naming the missing verb, not an empty
  session.
- The queue is built once through `buildStudyQueue({ studyItemIds,
  getItemProgress, now, includeNew: true })` with `now` captured at that moment,
  and is snapshotted. Grading must not rebuild it, so the stored progress lookup is
  read through a ref. `restart()` is the only way to re-derive it, and it
  re-captures `now`.
- Each entry resolves through `parseStudyItemId` and `getStudyItem`; an id that
  does not parse or does not resolve is dropped. No items left reports `empty`.
- `remaining` is `cards.length - index` and `progress` is
  `reviewed / (reviewed + remaining)`. These keep their current arithmetic
  deliberately; `F-05` records that divergence and is not repaired here.
- `grade(grade)` calls `recordReview(itemKey, grade, new Date())`, advances the
  card, grows `reviewed` by one, appends a copy of the card for an `again` grade,
  counts `againCount` per grading, and keeps the current card on screen when the
  write throws. A ref guards against a second grade while a write is in flight.
- `reveal()` records the revealed position; the quiz leaves it unused because it
  has no reveal step.

`use-study-session.ts` keeps exporting `StudySessionOptions`, `StudySessionState`,
`UseStudySessionResult`, and `useStudySession`, where the active state carries
`face: StudyCardFace` built from `state.item`. `src/app/flashcards.tsx` does not
change, including the derived header title that `F-08` records.

### The exercise

```ts
// src/srs/exercise.ts
export type ExerciseKind =
  | "multipleChoice"
  | "verbForm"
  | "fillInTheBlank"
  | "completeThePhrase";

// id is an opaque stable key for one option; label is what the learner reads.
export interface ExerciseOption {
  id: string;
  label: string;
}

export interface QuizExercise {
  studyItemId: string;
  itemKind: StudyItemKind;
  exerciseKind: ExerciseKind;
  level: CefrLevel;
  promptLabel: string;
  // The thing to answer: a meaning, or a sentence or phrase with one blank.
  prompt: string;
  // The context that pins the answer. Absent for multiple choice.
  promptNote?: string;
  verbId: string;
  verbInfinitive: string;
  options: ExerciseOption[];
  correctOptionId: string;
  // The answer in full, shown after answering. Absent for multiple choice,
  // where the correct option already is the answer.
  explanation?: string;
}

export interface ExercisePool {
  verbLemmas: ExerciseOption[];        // id verb id, label infinitive
  collocationTexts: ExerciseOption[];  // id collocation id, label text
  phrasalPhrases: ExerciseOption[];    // id phrasal verb id, label phrase
  particles: ExerciseOption[];         // id and label both the particle
}

export function buildExercisePool(verbs: Verb[]): ExercisePool;
export function buildExercise(
  resolved: ResolvedStudyItem,
  pool: ExercisePool,
): QuizExercise | undefined;
```

Every pool list is deduplicated by label and ordered by id, so the pool is a pure
function of the library and two calls with the same verbs are identical.

`buildExercise` returns `undefined` only when no eligible kind can produce at least
three options. With the bundled A1 library that cannot happen, and step 2's check
proves it over every item.

### Choosing the exercise kind

The eligible kinds per item kind, in this order:

| Item kind | Eligible exercise kinds |
| --- | --- |
| sense | multipleChoice, fillInTheBlank, verbForm |
| collocation | multipleChoice, completeThePhrase |
| phrasalVerb | multipleChoice, completeThePhrase |

Filter that list to the kinds whose eligibility rules below hold, then pick
`eligible[hashSeed(studyItemId) % eligible.length]`. `hashSeed` is FNV-1a over the
string, returned unsigned:

```ts
function hashSeed(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
```

So an item always gets the same exercise kind and the same options, in the same
order, on every build. Variety comes from the id, not from randomness, which is
what makes the builder testable and what keeps a requeued `again` card recognisable
as the same question. Over the 68 bundled items the hash spreads across all four
kinds.

Distractor and option order use the same seeded ordering: order candidates by
`hashSeed(studyItemId + "|" + option.id)` ascending, tie broken by `option.id`
ascending, take the first `OPTION_COUNT - 1` as distractors, then order the whole
option set the same way so the correct answer is not always first. `OPTION_COUNT`
is 4 and `MIN_OPTION_COUNT` is 3; a kind that cannot reach `MIN_OPTION_COUNT` is
ineligible.

### Eligibility rules

- **multipleChoice**: the pool for the item's kind holds at least two distinct
  labels other than the item's own text.
- **fillInTheBlank**: the sense has an example containing exactly one token that
  matches exactly one of the verb's five form slots, and that slot is `base`. The
  first such example in array order is used.
- **verbForm**: the sense has an example containing exactly one token that matches
  exactly one of the verb's five form slots. The first such example in array order
  is used, and its slot is the form asked for.
- **completeThePhrase** for a collocation: the pool holds at least two distinct
  verb labels other than the collocation's own first token.
- **completeThePhrase** for a phrasal verb: the phrase has at least two
  whitespace-separated tokens, and the pool holds at least two distinct particles
  other than its own trailing text.

A "form slot" is one of `base`, `past`, `pastParticiple`, `ing`, `thirdPerson`. A
token matches a slot when, compared case-insensitively after stripping
non-alphanumeric characters that are not the apostrophe, it equals one of the
whitespace-separated words of that slot's value. A slot value such as `was/were`
therefore contributes two words.

### The four exercises

`BLANK` is the three-character string `___`. A gap replaces the first whole-word,
case-insensitive occurrence of the target token and leaves every other character of
the source string in place.

| exerciseKind | item kind | promptLabel | prompt | promptNote | options (id / label) | correct | explanation |
| --- | --- | --- | --- | --- | --- | --- | --- |
| multipleChoice | sense | `Which verb means this?` | `sense.definition` | absent | pool `verbLemmas` | the sense's verb | absent |
| multipleChoice | collocation | `Which collocation means this?` | `collocation.gloss` | absent | pool `collocationTexts` | the item itself | absent |
| multipleChoice | phrasalVerb | `Which phrasal verb means this?` | `phrasalVerb.meaning` | absent | pool `phrasalPhrases` | the item itself | absent |
| fillInTheBlank | sense | `Which verb completes this sentence?` | the chosen example with its base-form token blanked | `sense.definition` | pool `verbLemmas` | the sense's verb | the original example |
| verbForm | sense | `Choose the correct form` | the chosen example with the token blanked | the required slot, phrased as `<slot label> of "<infinitive>"`, for example `third person form of "be"` | one entry per distinct form string in the verb's five slots, plus any needed to reach the minimum, id the slot name, label the form string | the required slot's form string | the original example |
| completeThePhrase | collocation | `Complete the collocation` | `collocation.text` with its first token blanked | `collocation.gloss` | pool `verbLemmas`, plus the collocation's own first token | the collocation's first token | `collocation.text` |
| completeThePhrase | phrasalVerb | `Complete the phrasal verb` | `phrasalVerb.phrase` with everything after the first token blanked | `phrasalVerb.meaning` | pool `particles`, plus the phrase's own trailing text | the phrase's trailing text | `phrasalVerb.phrase` |

Slot labels: `base` is `base form`, `past` is `past form`, `pastParticiple` is
`past participle`, `ing` is `-ing form`, `thirdPerson` is `third person form`.

Option ids for the word-choice tables are the pool entry ids: a verb option carries
its verb id, a collocation option its collocation id, a phrasal verb option its
phrasal verb id, and a particle option the particle string. A correct option that
is not already in the pool (a collocation's own first token, a phrasal verb's own
trailing text, a verb's form string) is added with the id described in the table.

`level` is the study item's own `cefrLevel`, matching F9's card face: a sense,
collocation, or phrasal verb carries its own level, which is not inherited from the
headword.

### Options are structurally unique, semantically best-effort

The builder guarantees exactly one option carries `correctOptionId`, that ids and
labels are distinct within an exercise, and that the correct label equals the
item's own recorded text wherever the item has one. It does not and cannot
guarantee that no distractor is also plausible in context, because that is a
property of the content. F14 owns distractor quality across the full dataset.

### Decisions taken

Both of these are recorded rather than left open, because each has one defensible
answer against the current engine and both are reversible without a migration.

1. **A correct answer grades `good`; a wrong answer grades `again`.** `hard` and
   `easy` are self-assessments, and a quiz has an objective answer, so it has no
   basis for either. `again` schedules the item at interval zero, which is what a
   failed recall should do, and `good` is F8's ordinary pass. The quiz therefore
   emits two of the four grades, and the stored record is exactly the shape F8
   already writes. If you would rather a wrong answer that is retried and then
   answered correctly grade `hard`, that is a one-line change in the screen.
2. **One attempt per question, then Continue.** The learner answers once, sees the
   outcome and the correct answer, and presses Continue, which is what writes the
   review. A retry loop before grading would need its own state machine and would
   blur what the recorded grade means.

There is no `Open questions` section because nothing here blocks implementation
safely. If either decision above should change, say so at review; neither affects
stored formats.

### The route

`/quiz`, matching the flat route F9 shipped for flashcards rather than the
`/study/quiz` path in the overview's route sketch. The shipped reality is what the
`_layout.tsx` registration, the Study tab link, and the flashcards screen already
agree on, and F11 owns any regrouping of study routes.

Query parameter: `verbId`, read exactly as `src/app/flashcards.tsx` reads it, so
`/quiz?verbId=be` runs a session over that verb's items.

### The option component

```ts
// src/components/quiz-option.tsx
export type QuizOptionResult = "idle" | "correct" | "wrong" | "muted";

export interface QuizOptionProps {
  label: string;
  result?: QuizOptionResult; // default "idle"
  disabled?: boolean;
  onPress: () => void;
}
```

- `idle`: surface background, hairline border, normal text. Tappable.
- `correct`: `colors.knownSoft` background, `colors.known` border, `colors.known`
  text, and a trailing `Badge` with `tone="known"` and label `Correct`.
- `wrong`: `colors.wrongSoft` background, `colors.wrong` border and text, and a
  trailing `Badge` with `tone="wrong"` and label `Your answer`.
- `muted`: unchanged surface with faint text and reduced opacity, for the options
  the learner did not choose.
- One accessible control per option: `accessibilityRole="button"`,
  `accessibilityState={{ disabled }}`, and an accessibility label that appends
  `, correct answer` or `, your answer, incorrect` in the answered states. The
  badge text is the visible non-colour cue; the screen's feedback line is the
  announced one.

## Testing

No test runner is configured: `AGENTS.md` declares no test command and no `Verify`
command, so this feature has no automated test gate and must not add a runner
mid-step. The evidence is `npx tsc --noEmit`, `npm run lint`, and the running app
on the dev server.

The logic worth unit testing is the exercise builder: `hashSeed` stability, the
kind-selection and eligibility rules, the option set (exactly one correct option,
distinct ids and labels, at least three options), the blanking rule, and the
determinism of a rebuild. It is pure, with only type imports, so a runner could
cover it with no mocking. `useQueueSession` is the other candidate, and it needs a
progress and dataset stub. `/tests` remains the answer, and these are the modules
to point it at.

Step 2's direct check needs the module to run outside React. Because
`src/srs/exercise.ts` imports only types from `src/data/types.ts`, it compiles to
plain JavaScript on its own: compile it together with a temporary checker script
using the project's TypeScript and the `@/*` path mapping, run the emitted
JavaScript against `src/data/verbs/a1.json`, then delete the temporary files. Do
not commit a checker, a runner, or a fixture for it.

Step 5 reads records back out of storage rather than trusting the screen, because
the schedule is the actual product and F8 confirmed that a read-back is the
strongest evidence available here. Do not claim test or screenshot evidence that
was not produced.

On screenshots: F7, F8, and F9 all recorded that this session's browser backend
fails every capture with `browser screenshot activity capture failed for guest`.
If that is still true, the evidence is the accessibility tree plus the exact
persisted records, read back after each action, and the screenshots are recorded as
undone rather than passed.

## Notes for the AI

- **Step 1 is a refactor of shipped, verified behavior.** If you find yourself
  changing the hydration gate, the queue snapshot, the orphan drop, the requeue, or
  the `remaining` arithmetic while moving them, stop: the requirement is that F9
  keeps behaving identically, and step 1's done-when is what proves it.
- **One queue builder, one grader.** Reuse `buildStudyQueue` and `recordReview`.
  Do not add a second queue builder, a second grader, or a parallel progress store,
  and do not write to storage from the quiz screen.
- **Determinism is a contract, not a nicety.** No `Math.random` and no `Date`
  inside `buildExercise` or `hashSeed`. A requeued `again` card must rebuild to the
  same exercise, and the direct check asserts it.
- **Guard the render against a stale card.** Choosing an option and pressing
  Continue are both async-adjacent: ignore an option press once the card is
  answered, disable Continue while the write is in flight, and derive the answered
  state from the card position so it clears by itself when the card advances. Clear
  it explicitly in the restart handler, because a restart returns the position to
  zero.
- **Dataset text and stored text are plain rendered text.** Definitions, glosses,
  meanings, examples, and form strings all come from the bundled JSON. Render them
  through the `Text` primitive and never interpolate one into a URL or a raw
  element.
- `QuizOption` is presentational. It takes a label, a result, and a press handler,
  and owns no session state, matching `StudyItemRow`, `VerbListItem`, and
  `FlashCard`. Use `Card` for the prompt surface and the existing `Text`,
  `Button`, `Badge`, `ProgressBar`, and `EmptyState` primitives.
- **Do not repair the open findings.** `F-01` (reset against an in-flight write) is
  in `src/storage/progress-context.tsx`, `F-02` (`easy` can tie `good`) in
  `src/srs/schedule.ts`, `F-03` (the temporary queue readout) in
  `src/hooks/use-study-queue.ts` and the Progress screen, `F-04` and `F-07` in
  `src/data/types.ts`, `F-05` (`remaining` on a failed card) in the session
  arithmetic this feature moves, `F-06` in `src/components/flash-card.tsx`, and
  `F-08` in the flashcards header title. Step 1 preserves `F-05`'s and `F-08`'s
  current behavior exactly, and the quiz screen sets its own title from the scope
  rather than copying the flashcard derivation. Each finding needs its own `/audit`
  pass to close.
- Files are kebab-case, exports PascalCase, props explicit interfaces.
- No em dashes, en dashes, or ellipsis characters in generated content.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":27557,"specSha256":"4a2c1dd1a80572c963095d28b6db0b191ab4383468517da890a464dcbd448a5b","branch":"refs/heads/feature/quizzes","head":"69f86286331a57fa95c9d327a9d5b5cbbca78b62","baseRef":"refs/heads/main","baseCommit":"69f86286331a57fa95c9d327a9d5b5cbbca78b62","sourceTree":"c4355c199c8982a2af86df6d9e8ea9ee37d2dc04","absentOptional":[]} -->
