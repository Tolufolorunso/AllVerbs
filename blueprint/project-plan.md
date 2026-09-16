# Project Plan

## 1. Problem - What problem are we solving?

Learners of English have no single, deep, offline reference for verbs across the
full CEFR scale (A1 to C2). Existing tools are either broad multi-subject
flashcard apps (Anki, Quizlet), gamified general-language courses (Duolingo),
dictionary references without structured learning (Merriam-Webster), or
English-vocabulary apps that treat words shallowly and lock depth behind
subscriptions (Vocabulary.com, WordUp).

Allverb solves this by being a verb-specialized learning app: every English verb
from A1 to C2, each taught with its full usage (all senses, examples, forms,
collocations, phrasal verbs, synonyms), bundled offline, with a light
spaced-repetition study loop, and unlocked by a one-time purchase instead of a
subscription.

## 2. Users - Who is this for?

- Non-native English learners progressing through CEFR levels (students, exam
  candidates for IELTS/TOEFL/Cambridge, professionals).
- Self-directed learners who want depth per verb, not just a translation.
- People who study offline (commuting, low connectivity) and dislike
  subscription paywalls.
- Primary workflow: open the app -> do a short daily study session -> look up or
  explore verbs in depth when needed -> track progress by level.

## 3. Features - What does the MVP need?

Core reference:

- Browse verbs by CEFR level (A1, A2, B1, B2, C1, C2)
- Instant verb search
- Verb detail screen with full usage and tap-to-hear audio

Active study:

- Flashcards - cards for verb senses, collocations, and phrasal verbs (each an
  independent study item)
- Quizzes - multiple choice, correct tense/form, fill-in-the-blank, and
  complete-the-phrase for collocations and phrasal verbs
- Light spaced repetition over individual study items (a sense, collocation, or
  phrasal verb is scheduled and tracked on its own), with "due" review scheduling
- Home "Today's study" session and a review streak
- Progress dashboard (verbs learned, items mastered, per-level completion, CEFR
  progress ring)

Monetization:

- Free with ads; one-time in-app purchase unlocks everything and removes ads

## 4. Data - What are we storing?

Bundled, read-only verb dataset (ships with the app). Each verb entry:

- `id`, `infinitive` (headword), `cefrLevel` (A1-C2; may be per-sense)
- `senses[]`: each with a stable `id`, `definition`, `cefrLevel`, `examples[]`
- `forms`: base, past, past participle, -ing, third-person singular,
  regular/irregular flag, full conjugation notes
- `phrasalVerbs[]`: each with a stable `id`, `phrase` (e.g. "run into"),
  `meaning`, `example`, `cefrLevel`, and an optional separable/particle note
- `collocations[]`: habitual partnerships (e.g. "make a decision", "heavily rely
  on"); each with a stable `id`, `text`, `type` (verb+noun, adverb+verb,
  verb+preposition), a short gloss, `example`, and `cefrLevel`
- `synonyms[]`, `antonyms[]`
- `audioText` / phonetic (spoken via device TTS)

Study item (the atomic SRS unit): a verb sense, a collocation, or a phrasal
verb, each identified by its stable id and scheduled/tracked independently, so
chunks are learned in context rather than the verb alone.

On-device user state (writable, local only, no backend):

- Per-item mastery/SRS state keyed by study-item id (ease, interval, due date,
  review count) - not just per verb
- Progress stats (verbs learned, items mastered, per-level completion); a verb
  counts as learned once its items pass a mastery threshold
- Streak (current, longest, last study date)
- Entitlement flag (`isPaid`), restorable from the store after reinstall

> TODO: choose the exact storage format for the bundled dataset (JSON vs.
> prebuilt SQLite) and for user state (AsyncStorage vs. SQLite) during the
> first data-model feature.

## 5. Tech - What stack are we using?

- Expo (SDK 57) + React Native + expo-router (file-based routing under `src/app`)
- TypeScript (strict); `@/*` alias to `src/*`
- Device text-to-speech for audio (`expo-speech`)
- On-device storage for progress (AsyncStorage or expo-sqlite)
- Ads: Google AdMob (`react-native-google-mobile-ads`)
- In-app purchase: RevenueCat or Expo IAP (one-time, non-consumable)
- Content source: hybrid - an existing open/permissively-licensed English verb
  wordlist as the backbone, enriched with AI-generated senses, examples,
  collocations, and phrasal verbs, then reviewed for accuracy

## 6. Monetize - How will this make money?

One-time purchase model:

- Free tier: full app with AdMob ads.
- Paid: a single non-consumable in-app purchase unlocks everything and removes
  ads. Restorable via the store.
- A single on-device `isPaid` entitlement gate controls ad display and any
  locked content.
- Differentiator vs. competitors: no subscription.

## 7. UI/UX - How should this look and feel?

Focused study aesthetic: dark-mode-first, high contrast, card-centric, calm and
distraction-free (the polish of Quizlet/Anki but prettier), leaning on the
automatic light/dark system setting.

### Navigation

Four bottom tabs, each a distinct job; everything else is a pushed stack screen
so the tab bar stays stable.

- Today - home hub: streak, CEFR progress ring, "Start today's session" CTA
  (due reviews + a few new verbs), Verb of the Day.
- Browse - CEFR levels A1->C2 with a search bar pinned at the top (search lives
  here, not in its own tab).
- Study - practice launcher: pick flashcards or quizzes, by level or by the due
  queue.
- Progress - dashboard: verbs learned, per-level completion, mastery breakdown,
  review history.

Pushed screens (outside the tabs): Verb detail `[id]` (the hero full-usage
screen), Flashcards and Quiz study flows (full-screen), Settings, Unlock
(paywall), and Onboarding (first-run only).

Routing (expo-router): a root stack in `src/app/_layout.tsx` wrapping a
`(tabs)` group with `index` (Today), `browse`, `study`, `progress`; plus
`verb/[id]`, `study/flashcards`, `study/quiz`, `settings`, `unlock`, and
`onboarding`.

### Component system

Three layers keep the UI consistent by construction:

- Theme tokens (`src/constants/theme.ts` + a `useTheme` hook): light and dark
  color palettes (dark-first), spacing scale, type scale, radii, shadows. No
  hardcoded colors or magic numbers in screens.
- UI primitives (`src/components/ui/`): generic, app-agnostic - `Text`,
  `Button`, `IconButton`, `Card`, `Badge` (CEFR chip), `Chip`, `Divider`,
  `TextField`, `SearchBar`, `SegmentedControl`, `Switch`, `ProgressRing`,
  `ProgressBar`, `Skeleton`, `EmptyState`, `Spinner`.
- Domain components (`src/components/`): Allverb-specific, built from
  primitives - `VerbListItem`, `LevelCard`, `MasteryDot`, `FlashCard`,
  `QuizOption`, `StreakFlame`, `CefrProgressRing`.

Convention: kebab-case files, PascalCase exports, explicit prop interfaces.

### Screen principles

- Verb detail is the hero: senses -> examples -> forms/conjugation ->
  collocations & phrasal verbs -> synonyms, with tap-to-hear on headword and
  examples.
- Context-first: every sense, collocation, and phrasal verb is shown with a real
  example sentence and carries its own mastery indicator; each is studied and
  scheduled on its own, so verbs are learned in context, not in isolation.
- Study sessions are short and self-paced; no energy/hearts limits.
- Accessibility: readable type scale, sufficient contrast, Dynamic Type / font
  scaling, adequate tap targets, and TTS as the audio path.

## 8. Deployment - Where and how will this ship?

- Mobile app distributed via the Apple App Store and Google Play Store.
- Built with EAS Build (Expo Application Services); updates via EAS Update
  (OTA) for content/metadata changes that don't need a store release.
- Offline-first: the verb dataset is bundled, so core browsing and study need no
  network. Ads and purchase verification require connectivity.
- A web build (`expo export --platform web`) is possible for preview but runs
  ad-free and without store purchases.
- No backend server or database in v1.

## 9. Usage model and constraints

- Single-user, on-device; no accounts, no multi-tenant concerns, no server-side
  user data in v1.
- Trust boundaries that do matter: in-app purchase/entitlement must be validated
  through the store (not a client-only flag that is trivially spoofable beyond
  acceptable risk for a one-time unlock), and any bundled third-party wordlist
  must be used within its license.
- Content accuracy is a real constraint: AI-enriched verb data needs review
  before shipping.
- Explicit non-requirements for v1: user accounts, cloud sync, backend/API,
  recorded human audio, video clips, social features/leaderboards,
  user-generated decks, AI chat tutor, and widgets.
