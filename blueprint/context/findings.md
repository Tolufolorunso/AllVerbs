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
**Resolution:**
