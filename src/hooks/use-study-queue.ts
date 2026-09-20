import { getAllVerbs } from "@/data/loader";
import { getStudyItemIds, type Verb } from "@/data/types";
import { useProgress } from "@/storage/progress-context";
import { buildStudyQueue, type StudyQueueEntry } from "@/srs/queue";
import { useCallback, useEffect, useMemo, useState } from "react";

export interface StudyQueueOptions {
    includeNew?: boolean;
    limit?: number;
}

export type StudyQueueState =
    | { status: "loading" }
    | {
          status: "ready";
          queue: StudyQueueEntry[];
          dueCount: number;
          newCount: number;
      }
    | { status: "error"; message: string };

export type UseStudyQueueResult = StudyQueueState & {
    // Re-captures the current time, for a session that wants to re-evaluate what
    // is due rather than working from the moment it opened.
    refresh: () => void;
};

const QUEUE_LOAD_FAILURE = "Could not load the verb library.";

async function loadStudyItemIds(): Promise<string[]> {
    const verbs: Verb[] = await getAllVerbs();
    return verbs.flatMap(getStudyItemIds);
}

export function useStudyQueue(
    options: StudyQueueOptions = {},
): UseStudyQueueResult {
    const { includeNew = true, limit } = options;
    const { status: progressStatus, error, getItemProgress } = useProgress();

    const [studyItemIds, setStudyItemIds] = useState<string[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);
    const [now, setNow] = useState(() => new Date());

    useEffect(() => {
        let active = true;
        loadStudyItemIds()
            .then((ids) => {
                if (active) setStudyItemIds(ids);
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setLoadError(
                    cause instanceof Error ? cause.message : QUEUE_LOAD_FAILURE,
                );
            });
        return () => {
            active = false;
        };
    }, []);

    const refresh = useCallback(() => setNow(new Date()), []);

    // `now` is deliberately a dependency rather than read inside: the queue stays
    // fixed for a session until refresh() re-captures the time. The full queue is
    // built so the counts are true totals, and `limit` only shortens what is
    // handed back to a caller that wants a preview.
    const full = useMemo(
        () =>
            studyItemIds === null
                ? null
                : buildStudyQueue({
                      studyItemIds,
                      getItemProgress,
                      now,
                      includeNew,
                  }),
        [studyItemIds, getItemProgress, now, includeNew],
    );

    const queue = useMemo(
        () => (full === null || limit === undefined ? full : full.slice(0, limit)),
        [full, limit],
    );

    if (loadError !== null) {
        return { status: "error", message: loadError, refresh };
    }
    if (progressStatus === "error") {
        return {
            status: "error",
            message: error ?? "Progress could not be read.",
            refresh,
        };
    }
    // Reporting an unreadable store as "everything is new" would be actively
    // misleading, so a not-ready queue stays loading instead.
    if (full === null || queue === null || progressStatus === "loading") {
        return { status: "loading", refresh };
    }

    return {
        status: "ready",
        queue,
        dueCount: full.filter((entry) => entry.reason === "due").length,
        newCount: full.filter((entry) => entry.reason === "new").length,
        refresh,
    };
}
