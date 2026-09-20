// The spaced-repetition policy. Storage (src/storage) owns the bytes, the dataset
// (src/data) owns the content, and this module owns how a graded review turns
// into the next schedule. It is pure arithmetic so both study flows can feed it.

import type { ItemProgress } from "@/storage/progress";

export type ReviewGrade = "again" | "hard" | "good" | "easy";

export const GRADE_LABEL: Record<ReviewGrade, string> = {
    again: "Again",
    hard: "Hard",
    good: "Good",
    easy: "Easy",
};

export const EASE_DEFAULT = 2.5;
export const EASE_MIN = 1.3;
export const MAX_INTERVAL_DAYS = 365;

// An interval is an elapsed duration, not a calendar day, so this stays plain
// milliseconds and cannot drift across a daylight-saving change.
const MS_PER_DAY = 86_400_000;

const EASE_DELTA: Record<ReviewGrade, number> = {
    again: -0.2,
    hard: -0.15,
    good: 0,
    easy: 0.15,
};

const FIRST_INTERVAL_DAYS: Record<Exclude<ReviewGrade, "again">, number> = {
    hard: 1,
    good: 1,
    easy: 2,
};

function intervalGrowth(grade: ReviewGrade, ease: number): number {
    switch (grade) {
        case "hard":
            return 1.2;
        case "easy":
            return ease * 1.3;
        default:
            return ease;
    }
}

// The id is a parameter rather than something read off `current`, because an
// unreviewed item has no record yet and still needs to produce a valid one.
export function scheduleReview(
    studyItemId: string,
    current: ItemProgress | undefined,
    grade: ReviewGrade,
    now: Date,
): ItemProgress {
    const priorCount = current?.reviewCount ?? 0;
    const priorInterval = current?.intervalDays ?? 0;
    const priorEase = current?.ease ?? EASE_DEFAULT;

    const ease = Math.max(EASE_MIN, priorEase + EASE_DELTA[grade]);

    let intervalDays: number;
    if (grade === "again") {
        intervalDays = 0;
    } else if (priorCount === 0 || priorInterval === 0) {
        // A lapsed item restarts here rather than staying pinned at zero.
        intervalDays = FIRST_INTERVAL_DAYS[grade];
    } else {
        const grown = Math.round(priorInterval * intervalGrowth(grade, ease));
        // The +1 floor keeps every passing grade strictly increasing. Without it
        // "hard" from an interval of 1 rounds back to 1 forever.
        intervalDays = Math.min(
            MAX_INTERVAL_DAYS,
            Math.max(priorInterval + 1, grown),
        );
    }

    return {
        studyItemId,
        ease,
        intervalDays,
        dueAt: new Date(now.getTime() + intervalDays * MS_PER_DAY).toISOString(),
        // A failed review still counts as a review.
        reviewCount: priorCount + 1,
    };
}
