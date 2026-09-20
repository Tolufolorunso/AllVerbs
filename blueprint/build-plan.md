# Build Plan

Features in rough build order, grouped by milestone. Each is a feature-sized
outcome; details live in the `/feature` spec. The design system (F1) and
navigation shell (F2) are the UI foundation; the verb content model (F3) is the
data foundation everything reads from.

## Milestone 1 - Foundation & core reference

- [x] 1. **Design system & theme** - theme tokens (dark-first color, type scale,
  spacing, radii) + `useTheme`, and the UI primitive layer (`Text`, `Button`,
  `Card`, `Badge`, inputs, feedback components).
- [x] 2. **App navigation shell** - root stack + 4-tab navigator (Today, Browse,
  Study, Progress), the expo-router route structure, and placeholder screens for
  pushed routes (verb detail, study flows, settings, unlock, onboarding).
- [x] 3. **Verb content model & offline dataset** - schema for verbs (senses,
  examples, forms, collocations, phrasal verbs, synonyms, CEFR, audio text) with
  stable ids so each sense, collocation, and phrasal verb is an independent
  study item; a bundled dataset with a seed batch (A1) and a data-loading layer.
- [x] 4. **Browse by CEFR level** - A1->C2 sections in the Browse tab with a verb
  list showing level and mastery indicators, and a search bar pinned at the top.
- [x] 5. **Verb detail screen** - the hero full-usage page with tap-to-hear audio
  via device TTS.
- [x] 6. **Search** - instant lookup across all bundled verbs, surfaced within
  the Browse tab.

## Milestone 2 - Active study

- [x] 7. **On-device progress storage** - persistence layer for per-item
  mastery/SRS state keyed by study-item id, plus stats and streak (local only).
- [ ] 8. **Light SRS engine** - mastery state per study item (sense,
  collocation, phrasal verb) and "due" review scheduling that prioritizes weak
  items.
- [ ] 9. **Flashcards** - full-screen swipe/tap cards for senses, collocations,
  and phrasal verbs, driven by the SRS queue.
- [ ] 10. **Quizzes** - full-screen active-recall exercises (multiple choice,
  correct tense/form, fill-in-the-blank, and complete-the-phrase for
  collocations/phrasal verbs) that update per-item mastery.
- [ ] 11. **Study tab hub** - mode picker (flashcards or quiz) + scope (by level
  or due queue) that launches F9/F10.
- [ ] 12. **Today tab hub** - daily "Start today's session" CTA (due reviews +
  new verbs), streak tracking, CEFR progress ring, and Verb of the Day.
- [ ] 13. **Progress dashboard** - Progress tab: verbs learned, items mastered,
  per-level completion, mastery breakdown, review history.

## Milestone 3 - Content at scale

- [ ] 14. **Full A1-C2 dataset** - hybrid content pipeline (wordlist backbone +
  AI enrichment + review) to reach 1000+ verbs across all levels. Can run in
  parallel with Milestones 1-2 once the schema (F3) is stable.

## Milestone 4 - Monetization & launch polish

- [ ] 15. **Entitlement gate & restore** - on-device `isPaid` flag validated
  through the store, with restore-after-reinstall.
- [ ] 16. **Ads (free tier)** - AdMob integration shown only when not paid.
- [ ] 17. **One-time purchase unlock** - non-consumable IAP that removes ads and
  unlocks everything.
- [ ] 18. **Onboarding & first-run** - short intro, level/self-assessment, and
  first study session.
- [ ] 19. **Settings screen** - theme, TTS voice/speed, restore purchases, about.
