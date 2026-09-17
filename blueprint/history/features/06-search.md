# Feature: Search

**From build-plan:** feature 6
**Build attempt:** 1
**Status:** verified
**Branch:** `feature/search`

## Goal

Make the Browse search field a real lookup: type anything a verb is known by,
including its inflections, meanings, collocations, phrasal verbs, and synonyms,
and get ranked verb results with the match explained. F4 shipped the pinned field
filtering the headword only; F6 replaces that filter with content-wide ranked
search and a results view, which closes out Milestone 1.

## In scope

- A pure search module: query normalization, ranked matching across the verb's
  searchable fields, and the match vocabulary.
- Replacing Browse's headword-only filter with the ranked search, rendered as a
  results list while a query is active.
- Showing why each result matched, so a content hit is not confusing.
- A result count, an empty state that names the searchable fields, and
  accessibility for the count and the rows.
- Simplifying the level sections, which no longer need to react to the query.

## Out of scope

- **Fuzzy, typo-tolerant, or stemmed matching.** No Levenshtein distance, no
  stemming, no lemmatization, no synonym expansion of the query. Matching is
  plain case-insensitive substring over the fields listed in Data / contracts.
  A misspelled query returns the empty state.
- **Searching example sentences.** See Open questions. Sentence text is noisy
  ("I run in the park" would surface for "park") and the definitions already
  cover meaning.
- **Filters and facets.** No filtering by CEFR level, form, or topic, and no
  "browse by level" control change. Level browsing already exists.
- **Search history, suggestions, autocomplete, and recent queries.** Nothing is
  stored, and no query is persisted or logged.
- **A dedicated clear control** on the field. The field is replaceable by
  selecting and deleting; adding a cross-platform clear affordance is a separate
  decision this plan does not ask for.
- **Mastery-aware ranking.** Results are not ordered or filtered by mastery.
  Mastery is a stub until F7 and F8; F8 owns whether study state influences
  ordering.
- **Study-item results.** Results are verbs, not individual senses or
  collocations. Per-item study flows are F9/F10 and the Study hub is F11.
- **Search from anywhere but the Browse tab.** No global search route, no search
  on the Study or Today tabs.
- Changing the dataset, validator, or loader.

## Build loop

`workflow.stepReview` is `feature`, so all four steps land in one review packet;
`workflow.checkpointCommits` is `disabled`, so no per-step commits. Run
`npx tsc --noEmit` and `npm run lint` after each step (both green on `main`
today). The search module is pure logic, so Step 1 is verified with a scratch
harness outside the repo; the UI steps end with rendered evidence.
`/complete` makes the final feature commit.

## Build steps

- [x] **Step 1 - Search module.** Add `src/data/search.ts` with the types,
  `MATCH_LABEL`, `normalizeQuery`, and `searchVerbs` from Data / contracts,
  implementing the field table and ranking tiers exactly. No React imports.
  *Done when:* a scratch harness (compiled to a temp directory outside the repo,
  then deleted, never committed) shows: `jog` returns `run` first with kind
  `synonym`; `ran` returns `run` as a `form` match ranked above `drink` (whose
  form `drank` contains it) and above `eat` (whose phrasal verb meaning contains
  "restaurant");
  `mistake` returns `make` with kind `collocation`; `take care` returns `look`
  with kind `phrasalVerb`; `RAN` and `  ran  ` return identical results to `ran`;
  `zzzzz` returns an empty array; no verb appears twice in one result list; and
  one scan over the full seeded dataset is measured and recorded in milliseconds.
  Typecheck and lint pass.

- [x] **Step 2 - Ranked results in Browse.** In `src/app/(tabs)/browse.tsx`,
  replace the headword filter with `searchVerbs`. While a query is active render
  a `FlatList` of ranked results with a result count line; otherwise render the
  six level sections from the unfiltered verb list. Keep the pinned field and the
  existing empty state.
  *Done when:* with the query empty, Browse shows the same six sections and 30 A1
  rows as before, and the level sections no longer depend on the query; typing
  `mistake` shows a result list with `make` first and a visible count; clearing
  the query restores the sections; `zzzzz` shows the empty state, now naming the
  fields searched. Typecheck and lint pass.

- [x] **Step 3 - Why it matched.** Add an optional `snippet` prop to
  `src/components/verb-list-item.tsx`, taking precedence over its default
  first-sense caption, and pass a caption built from `MATCH_LABEL` and the
  matched text for every result whose kind is not `headword`.
  *Done when:* searching `jog` shows `run` captioned `Synonym: jog`; `ran` shows
  `run` captioned `Form: ran`; `careful` shows `be` captioned
  `Collocation: be careful`; a headword hit such as `run` keeps the ordinary
  first-sense definition caption with no `Headword:` label; long captions wrap to
  two lines without clipping. Typecheck and lint pass.

- [x] **Step 4 - Accessibility, both schemes, and browse-mode regression.** Make
  the result count a polite live region, include the match reason in each row's
  accessible name, keep the field labelled, and check dark and light.
  *Done when:* the DOM exposes the count as an announced live region, each result
  row's accessible name contains the verb, its level, and the match reason, and
  the field still exposes its label; both schemes render with no low-contrast
  text and no clipped captions; and with an empty query the browse-mode rows and
  labels are unchanged from before this feature. Typecheck and lint pass.

## Files / areas

- `src/data/search.ts` - new. The pure search module.
- `src/app/(tabs)/browse.tsx` - search mode, results list, count, empty state.
- `src/components/verb-list-item.tsx` - optional `snippet` prop.

Reused as-is: `getAllVerbs` from `src/data/loader.ts`, the types in
`src/data/types.ts`, and the primitives `Input`, `Text`, `Spinner`, `EmptyState`,
`Card`, `Badge`, `useTheme`, and `useVerbMastery`.

## Data / contracts

No server, network, auth, tenant, payment, or persisted-data boundary. Search is
local, synchronous, and read-only over the bundled dataset. The query is user
input: it is matched as a plain string, never rendered as markup, never
persisted, and never logged.

**Module shape.** `searchVerbs` takes the verb array rather than holding state, so
the screen memoizes against the loaded dataset and the function stays pure and
testable:

```ts
// src/data/search.ts
export type SearchMatchKind =
  | "headword"
  | "form"
  | "synonym"
  | "antonym"
  | "definition"
  | "collocation"
  | "phrasalVerb";

export interface SearchResult {
  verb: Verb;
  kind: SearchMatchKind;
  // The dataset string that matched, so the result can explain itself.
  text: string;
}

// Presentational copy for the match kinds, so one place names them.
export const MATCH_LABEL: Record<SearchMatchKind, string>;

// Trim, collapse internal whitespace runs to one space, and lowercase.
export function normalizeQuery(raw: string): string;

// Ranked results for an already-normalized query. Empty query returns [].
export function searchVerbs(verbs: Verb[], query: string): SearchResult[];
```

**Searchable fields.** The headword alone is not what a learner saw in a text, so
matching covers the keys a verb is known by:

| Kind | Fields |
| --- | --- |
| `headword` | `infinitive` |
| `form` | the five `forms` strings: `base`, `past`, `pastParticiple`, `ing`, `thirdPerson` |
| `synonym` / `antonym` | each entry of `synonyms` / `antonyms` |
| `definition` | each `sense.definition` |
| `collocation` | `collocation.text` and `collocation.gloss` |
| `phrasalVerb` | `phrasalVerb.phrase` and `phrasalVerb.meaning` |

Deliberately not searched: `examples`, `phonetic`, `audioText`, `id` and
study-item ids, `cefrLevel`, `forms.notes`, `forms.regular`, `type`, and
`particleNote`. Ids are internal keys, the phonetic is IPA that users do not
type, and the rest are metadata rather than the words a learner would look up.

**Ranking.** Deterministic and total. Three tiers, best first:

1. **The verb itself** - a `headword` or `form` match.
2. **Related words** - a `synonym` or `antonym` match.
3. **Content** - a `definition`, `collocation`, or `phrasalVerb` match.

Within a tier, an exact match beats a prefix match, which beats a substring
match. Ties break alphabetically by `infinitive`, then by the matched text, so the
order is stable for any dataset. Each verb appears at most once, at its best
match, with the text that produced it. The tier ordering is what makes `ran`
useful: `run` (form exact) leads, `drink` (form substring in `drank`) follows,
and `eat` (whose phrasal verb meaning contains "restaurant") comes last.

**Performance.** The current implementation is a linear scan over the loaded
verbs, which is right for the seeded dataset. `searchVerbs` is pure, so F14 can
introduce a precomputed index behind the same signature when 1000+ verbs make the
scan matter; Step 1 records the measured baseline rather than guessing. No index,
no debounce, and no worker is added now.

## Testing

No test runner is configured, so there is no test gate and this feature adds none.
`npx tsc --noEmit`, `npm run lint`, and rendered evidence are the gates, plus the
Step 1 scratch harness.

`normalizeQuery` and `searchVerbs` are exactly the in-scope pure logic the coding
standards describe: assertable inputs and outputs with real edge cases (empty
query, whitespace only, mixed case, no match, multi-word query, several verbs
matching at different tiers, and a verb matching in more than one field). They are
the first things to unit test when a runner lands, and the scratch harness is a
stand-in, not a substitute. Not committed.

The UI steps are verified with `npx expo export --platform web` served locally,
plus a DOM snapshot and screenshot per step, as in F4 and F5. iOS and Android
share the same React Native tree but need a simulator, so the handoff names the
manual path rather than claiming native evidence.

## Notes for the AI

- Match existing conventions: `@/*` imports, kebab-case filenames, `interface` for
  props, no `any`, theme tokens over hardcoded values, and no em dashes.
- Keep `src/data/search.ts` free of React and React Native imports, like the rest
  of `src/data/`. The screen composes the caption from `MATCH_LABEL` and the
  matched text.
- Reuse `VerbListItem` with the new optional `snippet` prop instead of adding a
  second row component, and reuse the existing `Input`, `EmptyState`, and the
  pinned field placement from F4.
- Use the built-in `FlatList` for results. Search results are a subset that can
  still be large (a one-letter query), so keep virtualization rather than mapping
  into a `ScrollView`.
- Do not add fuzzy matching, stemming, query expansion, a search index, a
  debounce, or a search route. All are out of scope above.
- Do not change `loader.ts`, `validate.ts`, `types.ts`, or the dataset. F6 reads
  them unchanged.
- Keep the empty state's existence and tone; only extend its message to name the
  searchable fields.
- Browser evidence must use the served export, as in F4 and F5. Remember that
  `expo export` writes dynamic routes as the literal `[id].html` filename, so a
  static file server needs that mapping.

## Open questions

Neither blocks implementation; both have a chosen default, so implement as written
unless the user overrides at review.

1. **Ranked list or level-grouped results while searching?** The spec renders a
   single ranked list, because ranking is meaningless inside level groups: the
   best match must be first rather than buried under an A2 heading. Each row still
   carries its CEFR chip, so level context survives. If you would rather keep the
   A1-to-C2 grouping during search, ranking collapses to "which matches at all"
   and that is a small change to Step 2.
2. **What is searchable besides the headword?** The spec includes inflected forms,
   synonyms, antonyms, definitions, collocations, and phrasal verb phrases and
   meanings, and excludes example sentences. Including forms matters because a
   learner usually meets a verb as `ran` or `taken`, not `run` or `take`. Examples
   are excluded as noise. Both halves are easy to change; say so at review and
   either direction is one line in the field table.


<!-- blueprint:completion {"schemaVersion":1,"specBytes":12523,"specSha256":"a2ce7d2746a6398d5f3e349a2313d31678e5bbf20beca8bc32e757096ac6deb0","branch":"refs/heads/feature/search","head":"1543cea1dd78a5ab9465b10d242c0506d434dae3","baseRef":"refs/heads/main","baseCommit":"1543cea1dd78a5ab9465b10d242c0506d434dae3","sourceTree":"8f2f91fd478be280ec834d1a994f3c05f6829bd0","absentOptional":[]} -->
