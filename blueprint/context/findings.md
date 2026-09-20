# Findings

> **Generated file.** The findings ledger: review findings raised by `/audit`
> against the work in progress, each with a durable ID, severity (P0-P3), and
> status. `/implement` marks repaired findings `fixed`, a later `/audit` pass
> moves them to `closed`, and `/complete` refuses to merge while any P0 or P1
> finding is `open` or `fixed`, then archives resolved findings with the work
> and resets this file.

### F-01 [P3] open - Reset does not coordinate with an in-flight progress write

**File:** src/storage/progress-context.tsx:133
**Found:** 2026-09-20 by /audit (scope: current; lens: quality, performance)
**Why it matters:** `resetProgress` calls `clearProgress()` directly and never
joins or drains `streakQueue` (src/storage/progress-context.tsx:60), and no
barrier exists between `clearProgress` and item writes already in flight from
`saveItemProgress`. A reset that interleaves with a pending write can therefore
leave records re-added to memory (the pending `setItems` runs after the reset's
`setItems(new Map())`) and the streak meta re-created in storage, so "reset
returns every badge to New and the counts to zero" is not guaranteed under
concurrency. The window is small and timing-dependent: the temporary review
control on Verb detail disables both buttons while its sequential write loop
runs, so triggering it needs a reset tap on the Progress tab inside that
window. Not reproduced in this review; recorded as a follow-up, not a blocker.
**Suggested fix:** In `resetProgress`, wait for the queue tail (for example
`await streakQueue.current`) before `clearProgress()`, and set
`streakQueue.current` to a fresh resolved promise after clearing, so a queued
streak write cannot land after the reset.
**Resolution:** Re-examined 2026-09-20 by /audit independent (scope: current;
delta 19bbf81e..25d1c27e). `src/storage/progress-context.tsx` is inside the
reviewed set and the defect is unchanged: `resetProgress` (lines 163-172) still
calls `clearProgress()` directly and never awaits or drains `streakQueue.current`,
so a streak write already queued by `updateStreak` can land after the clear and
re-create the meta key. Status stays `open`; the active spec defers the repair
explicitly ("Do not repair it here"), so it was not treated as a blocker.
Re-examined again 2026-09-20 by /audit independent (scope: current; delta
19b598b0..93a7484). `src/storage/progress-context.tsx` was read as a dependency
of the new session hook and the reset path is unchanged, so the status stays
`open`. F9 does not widen it: the session grades one card per write and refuses
re-entry while that write is in flight.

### F-02 [P3] open - `easy` can tie `good` at a one-day interval, not outpace it

**File:** src/srs/schedule.ts:63-76
**Found:** 2026-09-20 by /audit (scope: current; lens: quality)
**Why it matters:** The spec's Data/contracts and step 5 both claim "`easy`
outpaces `good` from the same state". Executing the module shows this is not
universal. From the state produced by one `good` from scratch
(`intervalDays: 1`, `ease: 2.5`, `reviewCount: 1`), the next `good` gives 3 days
and the next `easy` also gives 3 days: `good` computes `round(1 * 2.5) = 3` (JS
rounds the half up) and `easy` computes `round(1 * 2.65 * 1.3) = round(3.445) = 3`.
The same non-cap tie occurs at interval 1 for prior ease 1.3 and 1.5. `easy` is
never worse than `good` (a scan over prior ease 1.3-3.55 and intervals 1-400
found no case where `easy` < `good`), and all other ties are both values hitting
the 365-day cap, so the learner-visible impact is small: at the very shortest
intervals `easy` and `good` schedule identically instead of `easy` reaching
further. It is recorded because the spec states a precise numeric behavior the
code does not always satisfy, not because a session is broken.
**Suggested fix:** Decide which side should hold. Either narrow the spec wording
to "`easy` never schedules earlier than `good`, and outpaces it beyond the
shortest intervals", or make the intent explicit in code, for example by giving
`easy` a first-interval/growth treatment that cannot round down to the `good`
result. Do not change the constants without a spec decision, since retuning is
an Open-question choice in `current-feature.md`.
**Resolution:** Re-examined 2026-09-20 by /audit independent (scope: current;
delta 19b598b0..93a7484). `src/srs/schedule.ts` was read as F9's grading
dependency and the arithmetic is unchanged: an interval of 1 with prior ease 2.5
still yields 3 days for both `good` and `easy`. The status stays `open`; the F9
spec neither restates the claim nor repairs it.

### F-03 [P3] open - The temporary queue readout can never re-evaluate `now`

**File:** src/hooks/use-study-queue.ts:43,62 and src/app/(tabs)/progress.tsx:127
**Found:** 2026-09-20 by /audit (scope: current; lens: quality, performance)
**Why it matters:** `useStudyQueue` captures `now` once at mount and only
re-captures it from `refresh()`, which is intentional and documented. No caller
calls `refresh()` (a repo-wide search finds only the hook's own definition and
returns), and the temporary `QueueReadout` does not remount when a review is
graded on the Verb detail tab. Because React Navigation tabs stay mounted, a
graded review whose new `dueAt` is the review instant (an `again`, interval 0)
is compared against the older captured `now`, so `when > now` and the item is
omitted. Grading `again` on an already-due item therefore makes it disappear from
"Due now" in the readout instead of staying due, which is the opposite of the
spec's "grading Again ... makes it due immediately" that step 5 asks to observe.
Only the temporary readout is affected; the engine, the stored record, and F9/F10
consumers that own their own session clock are not.
**Suggested fix:** Have the temporary readout re-capture time when it is
re-shown (for example call the hook's `refresh()` on focus), so the scaffolding
observes the engine it exists to demonstrate. This is scaffolding-only; the
underlying fixed-`now` behavior is intended and F12 owns the real "due today"
policy.
**Resolution:**

### F-04 [P3] open - `parseStudyItemId` accepts malformed slugs the spec says it rejects

**File:** src/data/types.ts:107-115
**Found:** 2026-09-20 by /audit independent (scope: current; lens: quality, tests)
**Why it matters:** Step 1's done-when states the direct check "rejects malformed
ids such as a wrong segment count, an unknown letter, and an uppercase slug", and
the function's own comment promises `undefined` "when the id is not that shape".
The implementation only checks the segment count and that each part is non-empty,
so `be.s.Upper`, `be.p.a b`, and `be.s.-dash` each return a ref. `isValidStudyItemId`
in `src/data/validate.ts` does reject those, and every id the session feeds the
parser comes from the validated bundle, so the reachable impact today is nil and
this is recorded as maintainability drift rather than a blocking defect.
**Suggested fix:** Decide which side holds. Either narrow the spec sentence to the
validator, or make the parser honor its contract by requiring the slug to satisfy
the same lowercase kebab-case shape the validator's `ITEM_SLUG` enforces, sharing
that constant rather than restating it.
**Resolution:**

### F-05 [P3] open - A failed card keeps `remaining` flat rather than growing it by one

**File:** src/hooks/use-study-session.ts:174-194, 249-256
**Found:** 2026-09-20 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec says "`remaining` is the count of cards still to
review, which grows by one when a card is failed". The code derives
`remaining = cards.length - index`, and an `again` grade appends one card while
the index also advances by one, so `remaining` is unchanged while `reviewed`
grows. The behavior is consistent with the spec's own definition and with
`progress = reviewed / (reviewed + remaining)`, which stays monotonic, so the
"N to go" counts are not wrong and no session is broken; the divergence is
between the spec's prose and the code.
**Suggested fix:** State the intent once. The smallest honest fix is the spec
wording: an `again` grade re-adds the card, so `remaining` does not shrink while
`reviewed` grows. Change the arithmetic only if a rising `remaining` is genuinely
wanted, since that would change what the "to go" count means.
**Resolution:**

### F-06 [P3] open - `FlashCard` restates the `Card` surface instead of using the primitive the spec names

**File:** src/components/flash-card.tsx:96-108
**Found:** 2026-09-20 by /audit independent (scope: current; lens: quality)
**Why it matters:** The spec's Notes say "`Card` from `src/components/ui/card.tsx`
is the surface for the card face". `FlashCard` instead re-declares that surface
inline (surface background, hairline border, border color, radius, padding,
shadow), which is the recipe `Card` already owns and that `StudyItemRow`,
`VerbListItem`, `VerbFormsTable`, and the Progress screen share. A future theme
change to the shared surface silently skips the flashcard, so the two definitions
can drift.
**Suggested fix:** Render the face through `Card` and pass the hero overrides
(radius `lg`, padding `xl`, `shadows.md`, `flex: 1`) via its `style` prop, or add
the radius/elevation variant it needs to `Card`. No current requirement is lost;
the larger radius, padding, and shadow are preserved by the override.
**Resolution:**

### F-07 [P3] open - `KIND_BY_LETTER` is a second hand-written definition of the persisted id-letter format

**File:** src/data/types.ts:93-103
**Found:** 2026-09-20 by /audit independent (scope: current; lens: quality)
**Why it matters:** This feature removed the validator's independent copy of the
id letters, but `KIND_BY_LETTER` is a hand-written inverse of
`STUDY_ITEM_KIND_LETTER` in the same file. The forward map is what the writer and
the validator use; the inverse is what the session parses with. Changing a letter
in the forward map alone would silently stop the session resolving that kind, with
no validator error and no failed write, only cards dropped. That is the exact
failure the "single definition" rule exists to prevent, narrowed to one file.
**Suggested fix:** Derive the inverse from the shared map, for example with
`Object.fromEntries(Object.entries(STUDY_ITEM_KIND_LETTER).map(([kind, letter]) => [letter, kind]))`,
so a letter is written in exactly one place.
**Resolution:**

### F-08 [P3] open - The queue-wide session's header shows the current card's verb rather than the scope

**File:** src/app/flashcards.tsx:43-46
**Found:** 2026-09-20 by /audit independent (scope: current; lens: quality)
**Why it matters:** Step 4 asks the screen to set the header title "from the
scope", and the adjacent comment says the queue-wide session "has no single header
worth showing". The `state.face.verbInfinitive` branch runs for the unscoped
session too, so a whole-library session shows a different verb in the header on
every grade. Cosmetic, but it contradicts both the step and its own comment.
**Suggested fix:** Restrict the derived title to the verb-scoped case, for example
`verbId ? state.face.verbInfinitive : "Flashcards"`, or correct the comment and
the step if the per-card verb is the intent.
**Resolution:**
