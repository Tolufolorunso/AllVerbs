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
**Resolution:**

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
