# Feature: Verb detail screen

**From build-plan:** feature 5
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/verb-detail-screen`

## Goal

Build the hero screen of the app: the full-usage page for one verb. Everything
the dataset knows about a verb lives here, read in context: its forms, every
sense with a real example, its phrasal verbs and collocations, its synonyms and
antonyms, and each item carrying its own level and mastery. Tap-to-hear speaks
the verb through device TTS. Browse already navigates here, so F5 turns that
placeholder into the reason the app exists.

## In scope

- Rewriting `/verb/[id]` into the real page, replacing the F2 placeholder.
- Loading, load-failure, not-found, and ready states for the route.
- Hero header: infinitive, CEFR chip, phonetic, mastery chip, and the speak
  control, with the stack header title set to the verb.
- Forms: base, past, past participle, -ing, third person, regular vs irregular,
  and conjugation notes when the dataset has them.
- Senses: each with its definition, its own level chip, its examples, and its own
  mastery indicator.
- Phrasal verbs and collocations: each grouped, with the same per-item treatment,
  including separable and particle notes.
- Synonyms and antonyms as chips, omitted when the dataset has none.
- Tap-to-hear audio for the headword via `expo-speech`.
- An accessibility pass and a light/dark check.

## Out of scope

- **Study actions.** No flashcard, quiz, or "start studying this item" affordance.
  F9 and F10 own those flows, and F11 owns the Study hub that launches them.
  F5 shows content and mastery only.
- **Mastery data.** As in F4, F5 renders mastery and owns none of it. F7 persists,
  F8 defines the model and thresholds. No storage is added here.
- **Voice and speed settings.** F19 owns a TTS voice/speed setting. F5 speaks with
  platform defaults and adds no configuration surface.
- **Search.** F6 owns lookup. F5 does not add search to this screen.
- **Editing the dataset.** F5 reads F3's data layer unchanged. It does not add
  fields, senses, or content.
- **Recorded human audio.** The overview lists this as an explicit v1
  non-requirement; TTS only. No audio assets.
- Animations, transitions, and shared-element transitions between Browse and this
  screen.
- Deep-link or universal-link handling. The route is reachable by navigation.

## Build loop

`workflow.stepReview` is `feature`, so all six steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after each step (both green on `main`
today). This is UI work, so each step also ends with a real look at the screen.
`/complete` makes the final feature commit.

## Build steps

- [x] **Step 1 - Route states and hero header.** Rewrite `src/app/verb/[id].tsx`.
  Normalize the route param to a single string, load the verb with
  `getVerbById`, and render four states: loading, load failure, not found, and
  ready. In the ready state render the hero header: infinitive as the page
  heading, the CEFR chip, the phonetic when present, and the verb-level mastery
  chip. Set the stack header title to the infinitive. Delete the placeholder
  usage from this route.
  *Done when:* `/verb/run` shows `run` as the heading with an A1 chip, the
  phonetic value from the dataset (`rʌn`), and a "New" mastery chip, and the
  stack header reads `run`; `/verb/not-a-real-verb` shows the not-found state
  with a working way back to Browse and does not crash; a temporarily corrupted
  dataset (built to a scratch output directory, then reverted) shows the
  load-failure message rather than a blank page. Typecheck and lint pass.

- [x] **Step 2 - Tap-to-hear audio.** Install `expo-speech` with
  `npx expo install expo-speech`, add `src/hooks/use-speech.ts` per Data /
  contracts, and wire the speak control in the header to the verb's `audioText`.
  *Done when:* tapping the control on `/verb/run` dispatches a speech call whose
  text is the verb's `audioText`, the control shows a speaking state, and tapping
  again stops it; leaving the screen mid-speech stops the audio; if speech is
  unavailable the control reports it in place of failing silently or crashing;
  the web export still builds. Typecheck and lint pass.

- [x] **Step 3 - Forms section.** Add `src/components/verb-forms-table.tsx` and
  render it from the screen: base, past, past participle, -ing, third person, an
  irregular or regular marker, and `forms.notes` when present.
  *Done when:* `/verb/run` shows ran, run, running, runs and marks the verb
  irregular; `/verb/work` shows worked and marks it regular; `/verb/read` shows
  the stored note about the past-tense pronunciation; a verb with no note shows
  the table without a stray empty row. Typecheck and lint pass.

- [x] **Step 4 - Senses with per-item mastery.** Consolidate the mastery seam into
  `src/hooks/use-mastery.ts` (move `useVerbMastery`, add `useStudyItemMastery`)
  and update the Browse import. Add `src/components/study-item-row.tsx` and
  render the senses section with it.
  *Done when:* `/verb/run` shows both senses, each with its definition, its level
  chip, at least one example sentence, and its own mastery chip; the F4 Browse
  screen still renders and still typechecks after the seam move; every item
  currently reads `new`. Typecheck and lint pass.

- [x] **Step 5 - Phrasal verbs, collocations, synonyms and antonyms.** Render the
  remaining three collections with the shared row, including `separable` and
  `particleNote` where the dataset has them, and the synonym and antonym chips.
  Omit any section whose collection is empty.
  *Done when:* `/verb/look` shows both phrasal verbs (`look for`, `look after`)
  with their A2 chips and an example each, and shows no collocation section;
  `/verb/write` shows its separable note for `write down`; `/verb/be` shows both
  its collocation and its synonyms; `/verb/say` shows senses and its synonyms,
  with no collocation, phrasal-verb, or antonym section (it has none of those).
  Typecheck and lint pass.

- [x] **Step 6 - Accessibility and both color schemes.** Give the speak control a
  label and a state announcement, mark section headings as headers, give each
  study item a distinguishable group semantics, keep example sentences readable
  by a screen reader, and confirm comfortable tap targets. Check dark and light.
  *Done when:* the web DOM exposes the speak control with an accessible name and
  a busy state while speaking, each section heading as a heading, and each study
  item as a distinguishable group; both color schemes render readably with no
  clipped text or unreadable chip labels. Typecheck and lint pass.

## Files / areas

- `src/app/verb/[id].tsx` - rewrite. The hero page and its route states.
- `src/components/study-item-row.tsx` - new. One presentational row shared by
  senses, phrasal verbs, and collocations.
- `src/components/verb-forms-table.tsx` - new. The conjugation block.
- `src/hooks/use-mastery.ts` - new. Consolidates the mastery seam.
- `src/hooks/use-speech.ts` - new. Isolates `expo-speech`, its platform guard,
  and its unmount cleanup.
- `src/hooks/use-verb-mastery.ts` - deleted, its contents move to `use-mastery.ts`.
- `src/app/(tabs)/browse.tsx` - import update only, from the seam move.
- `package.json`, `package-lock.json` - add `expo-speech`.

Reused as-is: `Badge`, `Button`, `Card`, `Text`, `Spinner`, `EmptyState`,
`ProgressBar`, `getVerbById`, and the types from `src/data/types.ts`.

## Data / contracts

No server, network, auth, tenant, or payment boundary. The content is bundled,
read-only, and offline. F5 stores nothing and adds no persistence. The one new
external surface is the platform speech API, handled below.

**Dependency: `expo-speech`.** Not speculative. The overview names it in the tech
stack, the build plan's F5 line requires tap-to-hear via device TTS, and the data
model states `audioText` and `phonetic` are "spoken via device TTS". Install it
with `npx expo install expo-speech` so the version matches SDK 57. It needs no
`app.json` config plugin.

**Mastery seam.** F4 shipped `useVerbMastery` in `src/hooks/use-verb-mastery.ts`.
F5 needs the finer lookup the overview requires: "every sense, collocation, and
phrasal verb shows a real example + its own mastery indicator". Since
`ItemProgress` in the data model is keyed by `studyItemId`, per-item is the real
granularity, and a verb-level state is the rollup F8 will derive. Both hooks read
the same future data, so they belong in one module rather than duplicating the
`MasteryState` type:

```ts
// src/hooks/use-mastery.ts
export type MasteryState = "new" | "learning" | "known";

// Verb-level rollup, shown on the detail header and the Browse rows.
export function useVerbMastery(): (verbId: string) => MasteryState;

// Per-study-item state, keyed by a Sense, Collocation, or PhrasalVerb id.
export function useStudyItemMastery(): (studyItemId: string) => MasteryState;
```

Both return `new` for everything until F7 supplies stored progress. F8 owns how
items roll up to a verb and what threshold makes a verb learned; none of that is
defined here. The move from `use-verb-mastery.ts` to `use-mastery.ts` is an
internal rename of an eight-line module, not a product decision, and it keeps one
seam for F7 to replace instead of two divergent ones.

**Study item row shape.** Senses, phrasal verbs, and collocations share one
presentational row. The screen maps each kind to this shape, so the row stays
dumb and F7 does not touch it:

```ts
// src/components/study-item-row.tsx
export interface StudyItemRowProps {
  title?: string;        // phrase or collocation text; senses have no title
  level: CefrLevel;
  body: string;          // definition, meaning, or gloss
  examples: string[];    // senses carry several, the others one
  mastery: MasteryState;
  note?: string;         // separable or particle note, when present
}
```

**Speech hook.** The screen must not call the platform speech API directly, both
so the platform guard lives in one place and so the screen stays presentational:

```ts
// src/hooks/use-speech.ts
export type SpeechStatus = "idle" | "speaking" | "unavailable";

export function useSpeech(): {
  status: SpeechStatus;
  speak: (text: string) => void;
  stop: () => void;
};
```

Contract details that later features depend on:

- The spoken text is the verb's `audioText`, never `infinitive`. The field exists
  precisely so the spoken form can differ from the written headword.
- Speaking with the platform default voice and rate. F19 adds voice and speed
  settings later; F5 exposes no rate, pitch, or voice option.
- `stop()` is called when the screen unmounts, so audio never continues after the
  user leaves. This is a correctness requirement, not a nicety.
- A second tap while speaking stops instead of restarting.
- A speech failure sets `unavailable` and the screen shows a short caption. It
  must not throw, and it must not leave the control stuck in a speaking state.
  This is the web guard the coding standards require for platform APIs.
- The hook holds no state that outlives the screen and persists nothing.

**Route param and unknown ids.** `useLocalSearchParams` can yield `string |
string[] | undefined`, so the screen normalizes to a single trimmed string before
lookup. An unknown or missing id is a normal case, not an error: `getVerbById`
resolves `undefined` and the screen shows the not-found state. A rejected loader
promise is a different state and shows the error message. The param is rendered
only as plain text in the not-found state, never as markup or a route.

**Rendering.** Every string on this page comes from the bundled, validated
dataset and is rendered as plain text through the `Text` primitive. No dataset
string is HTML, markdown, or a route.

## Testing

No test runner is configured, so there is no test gate and this feature adds
none. Verification is `npx tsc --noEmit`, `npm run lint`, and rendered evidence:
`npx expo export --platform web` served locally, with a DOM snapshot and a
screenshot per step's done-when. The dataset corruption and scratch-build checks
are temporary local edits that are reverted and never committed.

Audio needs care to verify honestly. This environment cannot confirm that sound
is audible. What it can confirm is the call path: the speech call is dispatched
with the verb's `audioText`, the speaking state appears and clears, a second tap
stops, and unmounting stops playback. The spec requires that instrumented
evidence and does not claim audibility. Confirming real sound on iOS and Android
is part of the manual path, and the spec says so rather than implying it ran.

No in-scope pure logic is added. The screen is components and state; the speech
hook wraps a platform API. If a runner is added later, the param normalization
and the `audioText` selection are the only extractable logic worth a test.

## Notes for the AI

- Match existing conventions: `@/*` imports, kebab-case filenames, `interface` for
  props, no `any`, theme tokens over hardcoded values, and no em dashes.
- Follow the F4 patterns the codebase already established: a thin screen that
  owns state and layout, presentational domain components in `src/components/`,
  logic and platform wrappers in `src/hooks/`, and reuse of the existing
  primitives rather than new ones.
- Install `expo-speech` with `npx expo install`, never a hand-picked version, so
  it stays aligned with SDK 57.
- Do not build a second mastery module or duplicate `MasteryState`. Move the
  existing hook and add the per-item sibling.
- Do not add study buttons, mastery thresholds, voice settings, or search. Those
  are F9, F10, F8, F19, and F6.
- Omit a section entirely when its collection is empty. Several seed verbs have
  no collocations or phrasal verbs, and an empty shell for each would dominate
  the page.
- The page is long and scrolls. Use `ScrollView` with the existing primitives;
  do not add a list or virtualization library for a single verb's content.
- `expo-speech` is available in Expo Go and needs no native rebuild for
  development, but adding a dependency does change `package-lock.json`, so keep
  that in the same reviewed step.

## Open questions

Neither blocks implementation; both have a chosen default, so implement as written
unless the user overrides at review.

1. **Does tap-to-hear cover only the headword, or also examples?** The plan says
   the page has "tap-to-hear audio" and the data model attaches `audioText` to the
   verb, so the spec speaks the headword and the phonetic sits beside it as text.
   Speaking each example sentence is genuinely useful for listening practice but
   is not asked for here, and it multiplies the controls on a long page. Recommend
   keeping it to the headword and letting F19's settings work, then revisiting
   example audio as its own small feature if you want it.
2. **What should an unknown verb id do?** A deep link or a stale link can reach
   `/verb/<something-not-in-the-dataset>`. The spec shows a friendly not-found
   state with a button back to Browse, which keeps the user oriented. The
   alternative is redirecting straight to Browse. Recommend the explicit
   not-found state, since a silent redirect makes a broken link look like a
   navigation quirk.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":15368,"specSha256":"3befd812680aed48d8ea0e82ded0a9d395701ff9435cf91159e95c74ed7e72e3","branch":"refs/heads/feature/verb-detail-screen","head":"b881a9b55be45a153d141784a2101bfeaa3e7d7d","baseRef":"refs/heads/main","baseCommit":"b881a9b55be45a153d141784a2101bfeaa3e7d7d","sourceTree":"802555a1dabfeffd0cfebd03bd221b2763f758e0","absentOptional":[]} -->
