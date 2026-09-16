# Feature: Verb content model & offline dataset

**From build-plan:** feature 3
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/verb-content-model-offline-dataset`

## Goal

Lock the verb data model and ship the first real content: a validated, bundled A1
seed dataset plus the data-loading layer every later screen reads from. Every
sense, collocation, and phrasal verb gets a permanent id, because those ids become
the study-item keys that F7 (storage), F8 (SRS), F9/F10 (study), and F13
(dashboard) persist and schedule against.

## In scope

- `CefrLevel`, `Verb`, `VerbForms`, `Sense`, `PhrasalVerb`, `Collocation`, and the
  study-item union types, as one source of truth in `src/data/types.ts`.
- A hand-authored A1 seed dataset of 30 verbs, stored as JSON under `src/data/`.
- A pure validator for the dataset, and a loader that validates on load and fails
  loudly with actionable issue paths.
- Lazy per-level chunk loading with a cache, behind a stable async API.
- One temporary smoke usage in the existing Browse placeholder that proves the
  dataset loads and validates inside the running app.
- A short `src/data/README.md` recording the authoring and id rules F14's content
  pipeline must follow.

## Out of scope

- Any Browse, Verb detail, or Search UI. F4 owns the A1 to C2 sections and the
  pinned search bar, F5 the hero detail screen, F6 search behavior. F3's Browse
  change is a temporary count line, deleted by F4.
- Search, filtering, or ranking helpers. F6 owns lookup behavior.
- On-device progress storage, mastery state, SRS scheduling, and stats. F7 and F8.
- A2 to C2 content. F3 registers those levels so they resolve to an empty list;
  F14 fills them.
- Choosing the progress-storage backend (AsyncStorage vs expo-sqlite) and adding
  `expo-sqlite`. That stays with F7.
- Adding a test runner. See Testing.
- Any network, backend, account, or entitlement work.

## Build loop

`workflow.stepReview` is `feature`, so all six steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after every step (both are green on `main`
today), plus each step's own check. `/complete` makes the final feature commit.

## Build steps

- [x] **Step 1 - Data model types and CEFR constants.** Add `src/data/types.ts`
  with the locked interfaces, the `CEFR_LEVELS` ordered constant, `StudyItemKind`,
  `StudyItemRef`, and `ResolvedStudyItem`. Move the `CefrLevel` union here and have
  `src/constants/theme.ts` import and re-export it, so existing
  `CefrLevel` imports from `@/constants/theme` keep working and the union stays
  declared once.
  *Done when:* `src/data/types.ts` exports every type named in Data / contracts,
  `CEFR_LEVELS` is `A1` through `C2` in order, `CefrLevel` is no longer declared in
  `theme.ts` but is still exported from it, and typecheck plus lint pass.

- [x] **Step 2 - A1 seed dataset.** Author 30 A1 verbs in
  `src/data/verbs/a1.json`, following the shape, id rules, and content contract in
  Data / contracts.
  *Done when:* the file parses, holds 30 verbs, every verb has complete `forms` with
  `base` equal to `infinitive`, at least one sense with at least one example, and
  collocations or phrasal verbs only where the verb genuinely has them; the
  reviewer spot-checks entries for correct, natural English and genuine A1 level.

- [x] **Step 3 - Dataset validator.** Add `src/data/validate.ts` exporting
  `validateVerbs(value: unknown): ValidationIssue[]` and the `ValidationIssue`
  type, pure and dependency-free, implementing every rule in Data / contracts.
  *Done when:* it returns an empty array for the Step 2 file, and a one-off manual
  check with a temporarily duplicated study-item id and a temporarily misspelled
  key returns issues whose `path` values name the exact offending entry (temporary
  edits reverted and not committed). Typecheck and lint pass.

- [x] **Step 4 - Loader.** Add `src/data/loader.ts` with the level registry, the
  promise cache, `DataSetError`, and the four accessors in Data / contracts.
  *Done when:* `getVerbsByLevel("A1")` resolves the 30 seed verbs,
  `getVerbsByLevel("B2")` resolves `[]` with no registered chunk, a second call for
  the same level is served from cache without re-validating, `getVerbById` finds a
  known verb and resolves `undefined` for an unknown one, `getStudyItem` resolves
  the right `kind` plus parent verb and `undefined` for an unknown id, and a
  malformed bundle rejects with a `DataSetError` whose message lists issue paths.
  Typecheck and lint pass.

- [x] **Step 5 - Prove it in the running app.** Extend the existing Browse
  placeholder (`src/app/(tabs)/browse.tsx`) with a temporary line showing the
  loaded A1 verb count, and a readable error line if loading rejects. Use the
  existing `Text` primitive and theme tokens, and keep the current sample-verb
  action.
  *Done when:* `npm run web` shows Browse rendering `A1 - 30 verbs` (or the real
  count) with no console error, and a screenshot is captured as evidence. This
  screen stays F4's to replace.

- [x] **Step 6 - Document the authoring contract.** Add a short
  `src/data/README.md` covering the chunk layout and registry seam F14 extends, the
  id rules and their permanence, `forms.base === infinitive`, and the rule that
  invalid content fails loudly at load rather than degrading quietly.
  *Done when:* the README states all four points and matches the shipped code.

## Files / areas

- `src/data/types.ts` - new. Model types and CEFR constants.
- `src/data/validate.ts` - new. Pure validator.
- `src/data/loader.ts` - new. Registry, cache, accessors, `DataSetError`.
- `src/data/verbs/a1.json` - new. Seed dataset (30 A1 verbs).
- `src/data/README.md` - new. Authoring and id contract.
- `src/constants/theme.ts` - edit. Import and re-export `CefrLevel` from
  `@/data/types` instead of declaring it.
- `src/app/(tabs)/browse.tsx` - temporary edit. Add the count line; F4 replaces it.

## Data / contracts

No server, network, auth, or tenant boundary is involved: the dataset is bundled,
read-only, single-user, and offline. There is no user-controlled input in this
feature.

**Dataset format decision.** The bundled dataset ships as JSON, one file per CEFR
level under `src/data/verbs/`, loaded lazily through a registry and cached. This
resolves the bundled-dataset half of the storage TODO in the plans; the
progress-storage half stays open for F7. JSON was chosen because content is
reviewed by people and by F14's pipeline, and text diffs are reviewable where a
prebuilt SQLite binary is not.

**File layout and registry.** `src/data/loader.ts` holds
`LEVEL_CHUNKS: Partial<Record<CefrLevel, () => Promise<unknown>>>` mapping a level
to a dynamic `import()`. F3 registers `A1` only. A level with no entry resolves to
`[]`, so F4 can render all six sections, including empty ones, without waiting on
F14. Adding a level in F14 is one registry line plus one data file.

**Accessors.** `getVerbsByLevel(level: CefrLevel): Promise<Verb[]>`,
`getAllVerbs(): Promise<Verb[]>`, `getVerbById(id: string): Promise<Verb | undefined>`,
and `getStudyItem(ref: StudyItemRef): Promise<ResolvedStudyItem | undefined>`.
All are async so that chunk `import()` and deferred parse never block first paint.
The cache stores the in-flight promise per level, so concurrent callers share one
load and one validation pass. `getVerbById` and `getStudyItem` search registered
chunks in `CEFR_LEVELS` order until found; F14 may add an id-to-level manifest if
deep-link latency ever needs it, which would not change these signatures.

**Failure behavior.** The loader validates on load, in every environment, and
rejects with `DataSetError extends Error` carrying `issues: ValidationIssue[]`
(`{ path: string; message: string }`, paths such as `verbs[3].senses[1].id`). It
never returns partially valid data and never silently drops an entry. Failing
loudly is deliberate: a dropped or mismatched study-item id would corrupt progress
in F7, so a bad bundle must be impossible to miss.

**Locked shapes.** These match the project overview's data model and are the
persisted-key contract later features depend on.

```ts
export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export const CEFR_LEVELS: readonly CefrLevel[]; // A1 through C2, in order

export type StudyItemKind = "sense" | "collocation" | "phrasalVerb";

export type CollocationType =
  | "verb+noun"
  | "adverb+verb"
  | "verb+preposition"
  | "other";

export interface VerbForms {
  base: string;
  past: string;
  pastParticiple: string;
  ing: string;
  thirdPerson: string;
  regular: boolean;
  notes?: string;
}

export interface Sense {
  id: string;
  definition: string;
  cefrLevel: CefrLevel;
  examples: string[]; // at least one
}

export interface PhrasalVerb {
  id: string;
  phrase: string;
  meaning: string;
  example: string;
  cefrLevel: CefrLevel;
  separable?: boolean;
  particleNote?: string;
}

export interface Collocation {
  id: string;
  text: string;
  type: CollocationType;
  gloss: string;
  example: string;
  cefrLevel: CefrLevel;
}

export interface Verb {
  id: string;
  infinitive: string;
  cefrLevel: CefrLevel;
  forms: VerbForms;
  senses: Sense[]; // at least one
  phrasalVerbs: PhrasalVerb[];
  collocations: Collocation[];
  synonyms: string[];
  antonyms: string[];
  audioText: string;
  phonetic?: string;
}

export type StudyItemRef =
  | { kind: "sense"; id: string }
  | { kind: "collocation"; id: string }
  | { kind: "phrasalVerb"; id: string };

export type ResolvedStudyItem =
  | { kind: "sense"; verb: Verb; sense: Sense }
  | { kind: "collocation"; verb: Verb; collocation: Collocation }
  | { kind: "phrasalVerb"; verb: Verb; phrasalVerb: PhrasalVerb };
```

Array fields are required and may be empty, except `senses` and `Sense.examples`,
which must be non-empty. `cefrLevel` is required and independent on `Verb`, `Sense`,
`PhrasalVerb`, and `Collocation`; a sense may sit at a different level from its
verb's headword level, and nothing is inherited.

**Id rules (the load-bearing contract).**

- A verb `id` matches `^[a-z][a-z0-9]*(-[a-z0-9]+)*$` and equals the infinitive in
  lowercase kebab-case. Homograph verbs that need separate `forms` (for example the
  two verbs spelled `lie`) take a permanent numeric suffix, `lie` and `lie-2`.
- Every study-item id matches `^<verbId>\.(s|p|c)\.[a-z0-9]+(-[a-z0-9]+)*$`, where
  `s`, `p`, and `c` mark sense, phrasal verb, and collocation, and the final slug
  names the item: `run.s.move-on-foot`, `run.p.into`, `run.c.make-a-run`.
- The disambiguator is a meaning slug, never a position, so reordering items in the
  file cannot silently reassign an id. Ids are globally unique across the whole
  dataset and across levels.
- Ids are permanent once shipped. They are the keys F7 persists, so renaming or
  renumbering one after release is a data migration, not an edit.

**Validation rules** (`validateVerbs` checks all of these and reports every failure
with a path):

1. Root is an array; every entry is a non-null object.
2. Unknown keys are rejected on the verb, `forms`, `senses[]`, `phrasalVerbs[]`,
   and `collocations[]` objects, so a JSON typo cannot be ignored.
3. Required strings are present, of type string, and non-empty; `regular` is a
   boolean; optional `notes`, `phonetic`, `separable`, and `particleNote` are the
   declared type when present.
4. `cefrLevel` on every verb, sense, phrasal verb, and collocation is a member of
   `CEFR_LEVELS`; collocation `type` is a member of `CollocationType`.
5. Collection fields are arrays of the correct element type; `senses` is non-empty;
   every sense has at least one non-empty example string.
6. Verb ids match their pattern and are unique; `forms.base` equals `infinitive`.
7. Study-item ids match their pattern against their own verb's id, use the letter
   matching their collection, and are unique across the entire dataset.

**Rendering constraint for consumers.** Dataset strings are authored content and
must be rendered as plain text through the existing `Text` primitive. No string in
the dataset is HTML, markdown, or a route.

## Testing

No test runner is configured, so there is no test gate and this feature adds none
(`AGENTS.md` Commands has typecheck and lint only, and adding a runner is its own
deliberate setup). Verification is: `npx tsc --noEmit`, `npm run lint`, the
validator's empty result against the real seed file, the one-off manual malformed
check in Step 3, and the Step 5 screenshot from `npm run web`.

The validator is the in-scope pure logic here (assertable input, real edge cases:
missing fields, wrong enum, unknown key, duplicate id, mismatched prefix), so if a
runner is added later it is the first thing worth unit testing. Not a blocker for
F3.

## Notes for the AI

- Match existing code conventions: `@/*` imports, kebab-case filenames,
  `interface` for props and models, explicit prop types, no `any`, theme tokens
  over hardcoded values, and no em dashes anywhere in code, comments, or docs.
- Keep `src/data/*` free of React and React Native imports. It is a plain data
  layer, so screens stay presentational and F7 or F14 can reuse it unchanged.
- Seed content must be real English: genuine definitions, examples, and meanings
  for common A1 verbs, written for this app rather than copied from a third-party
  wordlist, so no license obligation attaches. F14 picks the wordlist backbone.
- Do not pull search, mastery, or storage forward into these modules, even where a
  helper would be convenient for Step 5.
- `src/data/README.md` is a working contract for F14's pipeline, not marketing. Keep
  it short.
- The Step 5 Browse line is scaffolding with a known deletion date. Do not style it
  beyond the existing primitives or add empty-state handling there; F4 owns that.
- Update the plan-side storage TODO note only if the user asks; choosing JSON here
  is F3's call under the existing plan, and the overview's `blueprint:source-hash`
  will legitimately drift once the plans are edited.

## Open questions

Neither blocks implementation; both have a chosen default, so implement as written
unless the user overrides at review.

1. **Seed batch composition.** The plan says "a seed batch (A1)" without a size. The
   spec sets 30 common A1 verbs, enough for F4's sections and F6's search to be
   meaningful and small enough to review carefully by hand. If the user has a
   preferred count or wants specific high-frequency verbs pinned, that overrides.
2. **Test runner timing.** A runner would let the validator be unit tested instead
   of manually checked. Adding one is separate setup (`/tests`), and mixing it into
   F3 would blur a content feature with tooling. Default: skip it in F3, and run
   `/tests` before F14's generated content lands, when the validator earns its
   keep.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":15221,"specSha256":"1a9ac7d1d9dec1c89fe0498b21e345b26b2c1426eb074a758a72de8087339027","branch":"refs/heads/feature/verb-content-model-offline-dataset","head":"1df33fa180f47ba5ee423cf3d28922b35a912512","baseRef":"refs/heads/main","baseCommit":"1df33fa180f47ba5ee423cf3d28922b35a912512","sourceTree":"6c3db33ab5e63b90ed39b1a14c09505951306e8b","absentOptional":[]} -->
