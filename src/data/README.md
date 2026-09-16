# Bundled verb dataset

The read-only verb content that ships inside the app. Everything here is plain
data: no React, no React Native, no network. Screens import from `loader.ts`.

## Files

- `types.ts` - the model. `CefrLevel` is declared here and re-exported from
  `src/constants/theme.ts`, so import it from either place.
- `validate.ts` - pure validator, no dependencies. Runs on every load.
- `loader.ts` - the level registry, the load cache, and the public accessors.
- `verbs/<level>.json` - one file per CEFR level, lowercase level name.

## Adding a level (F14)

1. Author `verbs/<level>.json`. The file is a JSON array of verbs.
2. Add one line to `LEVEL_CHUNKS` in `loader.ts`:
   `B1: () => import("./verbs/b1.json"),`

That is the whole seam. A level absent from `LEVEL_CHUNKS` resolves to an empty
array, so browsing can render all six sections before the content exists. Do not
add loaders or fallbacks around this; `getVerbsByLevel` already caches per level
and reuses one in-flight promise for concurrent callers.

## Id rules

Ids are the study-item keys that F7 persists and F8 schedules against, so they
are permanent once shipped. Renaming one after release is a data migration, not
an edit.

- Verb id: the infinitive in lowercase kebab-case, for example `run`,
  `give-up`. Homograph verbs that need their own `forms` take a permanent
  numeric suffix: `lie`, `lie-2`.
- Study-item id: `<verbId>.<letter>.<slug>`, where `s` is a sense, `p` a phrasal
  verb, and `c` a collocation, and the slug names the item's meaning:
  `run.s.move-fast`, `look.p.after`, `be.c.be-careful`.
- The slug is a meaning, never a position. `run.s.flow` stays correct if the
  senses are reordered; `run.s.2` would silently point at a different sense and
  move a learner's progress with it.
- Ids are unique across the entire dataset, not just within one verb or level.

## Authoring checklist

- `forms.base` must equal `infinitive`. The validator enforces it.
- Every sense needs at least one example. Give each sense its own real sentence.
- `cefrLevel` is required and independent on the verb, every sense, every
  collocation, and every phrasal verb. Nothing is inherited from the headword,
  because a common verb usually has harder senses than its level suggests.
- Arrays may be empty. Only `senses` and a sense's `examples` must be non-empty.
  Use `[]` for a verb with no phrasal verbs rather than omitting the field.
- Write original content. Do not copy definitions or examples from a
  third-party wordlist; F14 selects and clears the licensed backbone separately.
- Strings are plain text rendered through the `Text` primitive. No HTML, no
  markdown, no routes.

## Failure behavior

`loader.ts` validates in every environment, including production, and rejects
with a `DataSetError` carrying `issues` with one `{ path, message }` per problem,
for example `verbs[3].senses[1].id`. It never returns partial data and never
drops a bad entry.

That is deliberate. A dropped or mismatched study-item id would corrupt a
learner's saved progress, so a broken bundle has to be impossible to miss. If
content is wrong, fix the JSON; do not relax the validator.
