// Turns a set of candidate study items into the order a session should present
// them. Pure over ids and a progress lookup, so the caller decides the scope
// (a CEFR level, one verb, everything) and F11 can filter on the way in.

import type { ItemProgress } from "@/storage/progress";

export type StudyQueueReason = "due" | "new";

export interface StudyQueueEntry {
    studyItemId: string;
    reason: StudyQueueReason;
    // Absent only for an unstarted item.
    progress?: ItemProgress;
}

export interface StudyQueueOptions {
    studyItemIds: string[];
    getItemProgress: (studyItemId: string) => ItemProgress | undefined;
    now: Date;
    includeNew: boolean;
    limit?: number;
}

function dueTime(progress: ItemProgress): number | undefined {
    const parsed = Date.parse(progress.dueAt);
    return Number.isNaN(parsed) ? undefined : parsed;
}

export function buildStudyQueue({
    studyItemIds,
    getItemProgress,
    now,
    includeNew,
    limit,
}: StudyQueueOptions): StudyQueueEntry[] {
    const at = now.getTime();
    const due: { entry: StudyQueueEntry; at: number; ease: number; order: number }[] = [];
    const fresh: { entry: StudyQueueEntry; order: number }[] = [];

    studyItemIds.forEach((studyItemId, order) => {
        const progress = getItemProgress(studyItemId);

        if (!progress || progress.reviewCount === 0) {
            if (includeNew) {
                fresh.push({ entry: { studyItemId, reason: "new" }, order });
            }
            return;
        }

        // An unparseable dueAt can only come from data that bypassed the store's
        // validator, so treat it as due rather than hiding the item forever.
        const when = dueTime(progress) ?? at;
        if (when > at) return;

        due.push({
            entry: { studyItemId, reason: "due", progress },
            at: when,
            ease: progress.ease,
            order,
        });
    });

    // Most overdue first; among equally due items, the lowest ease (the worst
    // history) leads. The id's position breaks ties so the order is stable.
    due.sort((a, b) => a.at - b.at || a.ease - b.ease || a.order - b.order);
    fresh.sort((a, b) => a.order - b.order);

    const queue = [
        ...due.map((item) => item.entry),
        ...fresh.map((item) => item.entry),
    ];
    return limit === undefined ? queue : queue.slice(0, limit);
}
