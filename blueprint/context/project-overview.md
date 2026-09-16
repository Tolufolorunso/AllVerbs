# Allverb - Project Overview

<!-- blueprint:source-hash 8980973456fa29b1021ce557927a5540666229500bc80cfa526322857de773fe -->

> An offline English verb-learning app: 1000+ verbs across CEFR A1-C2, each taught
> with full usage (senses, forms, collocations, phrasal verbs) and studied in
> context through per-item spaced repetition.

## Problem

Learners of English have no single, deep, offline reference for verbs across the
full CEFR scale. Existing tools are broad multi-subject flashcard apps (Anki,
Quizlet), gamified general courses (Duolingo), dictionaries without structured
learning (Merriam-Webster), or shallow English-vocab apps that lock depth behind
subscriptions (Vocabulary.com, WordUp). Allverb is verb-specialized, offline, and
unlocked by a one-time purchase rather than a subscription.

## Users

- Non-native English learners progressing through CEFR levels (students,
  IELTS/TOEFL/Cambridge exam candidates, professionals).
- Self-directed learners who want depth per verb, not just a translation.
- Offline studying (commuting, low connectivity) and dislike of subscriptions.
- Primary workflow: open app -> short daily study session -> look up/explore verbs
  in depth -> track progress by level.

Access tiers: free (full app with ads) vs. paid (one-time purchase removes ads).
No accounts; a single on-device entitlement flag distinguishes them.

## Usage model

- Single-user, on-device; no accounts, no multi-tenant concerns, no server-side
  user data in v1.
- Trust boundaries that matter: in-app purchase/entitlement must be validated
  through the store (not a trivially-spoofable client-only flag); any bundled
  third-party wordlist must be used within its license.
- Content accuracy is a real constraint: AI-enriched verb data needs review
  before shipping.
- Explicit non-requirements for v1: user accounts, cloud sync, backend/API,
  recorded human audio, video clips, social features/leaderboards,
  user-generated decks, AI chat tutor, widgets.

## Features

In build-plan order. The verb content model (F3) and verb detail screen (F5) are
the headline; F1-F2 are the UI foundation everything renders on.

**Milestone 1 - Foundation & core reference**

1. **Design system & theme** - theme tokens (dark-first) + `useTheme` + UI primitive layer.
2. **App navigation shell** - root stack + 4-tab navigator (Today, Browse, Study, Progress) + route structure + placeholders.
3. **Verb content model & offline dataset** - verb schema with stable ids (each sense/collocation/phrasal verb is an independent study item), seed A1 batch, data-loading layer.
4. **Browse by CEFR level** - A1->C2 sections in Browse tab with level + mastery indicators and a pinned search bar.
5. **Verb detail screen** - the hero full-usage page with tap-to-hear (device TTS).
6. **Search** - instant lookup across bundled verbs, surfaced in the Browse tab.

**Milestone 2 - Active study**

7. **On-device progress storage** - per-item mastery/SRS state keyed by study-item id + stats + streak (local only).
8. **Light SRS engine** - per-study-item mastery and "due" scheduling that prioritizes weak items.
9. **Flashcards** - full-screen swipe/tap cards for senses, collocations, phrasal verbs, driven by the SRS queue.
10. **Quizzes** - full-screen exercises (multiple choice, tense/form, fill-in-the-blank, complete-the-phrase) updating per-item mastery.
11. **Study tab hub** - mode picker (flashcards/quiz) + scope (level or due queue) launching F9/F10.
12. **Today tab hub** - daily session CTA (due + new), streak, CEFR progress ring, Verb of the Day.
13. **Progress dashboard** - verbs learned, items mastered, per-level completion, mastery breakdown, review history.

**Milestone 3 - Content at scale**

14. **Full A1-C2 dataset** - hybrid pipeline (wordlist backbone + AI enrichment + review) to 1000+ verbs; can run in parallel once F3 is stable.

**Milestone 4 - Monetization & launch polish**

15. **Entitlement gate & restore** - store-validated `isPaid` flag with restore-after-reinstall.
16. **Ads (free tier)** - AdMob shown only when not paid.
17. **One-time purchase unlock** - non-consumable IAP that removes ads and unlocks everything.
18. **Onboarding & first-run** - intro, level self-assessment, first study session.
19. **Settings screen** - theme, TTS voice/speed, restore purchases, about.

## Data model

Two stores: a **bundled, read-only** verb dataset (ships with the app) and
**on-device writable** user state. The `StudyItem` id is the join between them.

`CefrLevel` = `"A1" | "A2" | "B1" | "B2" | "C1" | "C2"`.

### Verb (bundled, read-only)

- `id` (string, stable) - primary key
- `infinitive` (string) - headword
- `cefrLevel` (CefrLevel) - headword level; may also be set per sense
- `forms` (VerbForms)
- `senses` (Sense[]) - one-to-many
- `phrasalVerbs` (PhrasalVerb[]) - one-to-many
- `collocations` (Collocation[]) - one-to-many
- `synonyms` (string[]), `antonyms` (string[])
- `audioText` (string) / `phonetic` (string?) - spoken via device TTS

### VerbForms (embedded in Verb)

- `base`, `past`, `pastParticiple`, `ing`, `thirdPerson` (string)
- `regular` (boolean) - regular vs. irregular
- `notes` (string?) - conjugation notes

### Sense (a StudyItem)

- `id` (string, stable) - study-item id
- `definition` (string), `cefrLevel` (CefrLevel), `examples` (string[])

### PhrasalVerb (a StudyItem)

- `id` (string, stable), `phrase` (string, e.g. "run into")
- `meaning` (string), `example` (string), `cefrLevel` (CefrLevel)
- `separable` (boolean?) / `particleNote` (string?) - optional

### Collocation (a StudyItem)

- `id` (string, stable), `text` (string, e.g. "make a decision")
- `type` (`"verb+noun" | "adverb+verb" | "verb+preposition" | "other"`)
- `gloss` (string), `example` (string), `cefrLevel` (CefrLevel)

> **Lock these shapes in F3.** Every sense, collocation, and phrasal verb carries
> a stable `id`; those ids are the study-item keys that F7 (storage), F8 (SRS),
> F9/F10 (study), and F13 (dashboard) all depend on. Changing them later forces a
> data migration.

### StudyItem (conceptual union)

A `Sense | Collocation | PhrasalVerb`, referenced by `{ studyItemId, kind }`. This
is the atomic SRS unit, scheduled and tracked independently so chunks are learned
in context, not the verb alone.

### ItemProgress (on-device, writable; keyed by study-item id)

- `studyItemId` (string) - FK to a Sense/Collocation/PhrasalVerb id
- `ease` (number), `intervalDays` (number), `dueAt` (ISO date), `reviewCount` (number)

### Stats / Streak / Entitlement (on-device, writable)

- Stats: `verbsLearned` (derived - a verb is learned once its items pass a
  mastery threshold), `itemsMastered` (derived), `perLevelCompletion`
  (CefrLevel -> `{ learned, total }`)
- Streak: `current` (number), `longest` (number), `lastStudyDate` (ISO date)
- Entitlement: `isPaid` (boolean), restorable from the store after reinstall

> TODO: exact storage format for the bundled dataset (JSON vs. prebuilt SQLite)
> and for user state (AsyncStorage vs. expo-sqlite) - decide in F3 / F7.

## Tech stack

- **Expo (SDK 57) + React Native** - cross-platform iOS/Android app runtime.
- **expo-router** - file-based routing under `src/app`.
- **TypeScript (strict)** - `@/*` alias to `src/*`.
- **expo-speech** - device text-to-speech for tap-to-hear audio.
- **AsyncStorage or expo-sqlite** - on-device progress storage (choice pending, see TODO).
- **react-native-google-mobile-ads** - AdMob ads for the free tier.
- **RevenueCat or Expo IAP** - one-time non-consumable purchase (choice pending).
- **Content source** - hybrid: permissively-licensed English verb wordlist backbone
  + AI-generated senses/examples/collocations/phrasal verbs, reviewed for accuracy.

## Monetization

One-time purchase, no subscription. Free tier shows AdMob ads; a single
non-consumable IAP unlocks everything and removes ads, restorable via the store.
A single on-device `isPaid` entitlement gate controls ad display and any locked
content.

## UI/UX

Focused study aesthetic: dark-mode-first, high contrast, card-centric, calm;
uses the automatic light/dark system setting.

Routes (expo-router; root stack wraps a `(tabs)` group):

- `/(tabs)` `index` - **Today**: streak, CEFR progress ring, "Start today's session" CTA, Verb of the Day.
- `/(tabs)` `browse` - **Browse**: A1->C2 sections + search bar pinned at top.
- `/(tabs)` `study` - **Study**: mode + scope launcher.
- `/(tabs)` `progress` - **Progress**: dashboard.
- `/verb/[id]` - Verb detail (hero full-usage screen).
- `/study/flashcards`, `/study/quiz` - full-screen study flows.
- `/settings`, `/unlock` (paywall), `/onboarding` (first-run).

Component system (3 layers): theme tokens (`src/constants/theme.ts` + `useTheme`);
UI primitives (`src/components/ui/`: `Text`, `Button`, `Card`, `Badge`, inputs,
feedback); domain components (`src/components/`: `VerbListItem`, `FlashCard`,
`QuizOption`, etc.). Convention: kebab-case files, PascalCase exports, explicit
prop interfaces.

Principles: verb detail is the hero; context-first (every sense/collocation/
phrasal verb shows a real example + its own mastery indicator and is studied
independently); short self-paced sessions with no energy/hearts limits;
accessible type scale, contrast, font scaling, tap targets, TTS audio.

## Deployment

- Distributed via the Apple App Store and Google Play Store.
- Built with EAS Build; updated via EAS Update (OTA) for content/metadata changes
  that don't need a store release.
- Offline-first: the bundled dataset means core browsing and study need no
  network; ads and purchase verification require connectivity.
- Web build (`npx expo export --platform web`) possible for preview, but runs
  ad-free and without store purchases.
- No backend server or database in v1.

## Open questions

> TODOs carried from the plans (resolve in the plans, then re-run /overview):
>
> - Storage format for the bundled dataset (JSON vs. prebuilt SQLite) and for user
>   state (AsyncStorage vs. expo-sqlite) - decide in F3 / F7.
> - Which permissively-licensed verb wordlist is the content backbone (license +
>   source) - decide in F14.
> - Purchase provider: RevenueCat vs. Expo IAP - decide in F15/F17.
