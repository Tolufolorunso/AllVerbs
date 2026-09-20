// Streak rules are pure date arithmetic, kept apart from storage so later
// features (F12's Today hub, F13's dashboard) read the same definition.

export interface StreakState {
    current: number;
    longest: number;
    // "YYYY-MM-DD" in device local time. Absent until the first study day.
    lastStudyDate?: string;
}

export const EMPTY_STREAK: StreakState = { current: 0, longest: 0 };

function pad2(value: number): string {
    return value < 10 ? `0${value}` : String(value);
}

// A study day is a local calendar date, so the key never depends on the time of
// day and never shifts with a UTC offset.
export function toLocalDateKey(date: Date): string {
    const month = pad2(date.getMonth() + 1);
    const day = pad2(date.getDate());
    return `${date.getFullYear()}-${month}-${day}`;
}

// Calendar arithmetic, not milliseconds: subtracting a fixed 24 hours would skip
// or repeat a day across a daylight-saving change.
function previousDateKey(date: Date): string {
    return toLocalDateKey(
        new Date(date.getFullYear(), date.getMonth(), date.getDate() - 1),
    );
}

export function advanceStreak(streak: StreakState, now: Date): StreakState {
    const today = toLocalDateKey(now);
    if (streak.lastStudyDate === today) return streak;

    const consecutive = streak.lastStudyDate === previousDateKey(now);
    const current = consecutive ? streak.current + 1 : 1;
    return {
        current,
        longest: Math.max(streak.longest, current),
        lastStudyDate: today,
    };
}
