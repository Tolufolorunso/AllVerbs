import { getAllVerbs } from "@/data/loader";
import {
    CEFR_LEVELS,
    getStudyItemIds,
    type CefrLevel,
    type Verb,
} from "@/data/types";
import { deriveItemMastery, deriveVerbMastery } from "@/hooks/use-mastery";
import type { ItemProgress } from "@/storage/progress";
import { useProgress } from "@/storage/progress-context";
import { useEffect, useMemo, useState } from "react";

export interface StudyStats {
    // Verbs whose every study item is known.
    verbsLearned: number;
    // Bundled study items whose derived mastery is known.
    itemsMastered: number;
    // Totals count what the bundled dataset actually holds, so A1 reports its
    // real size while the other levels are still empty.
    perLevelCompletion: Record<CefrLevel, { learned: number; total: number }>;
}

export type StudyStatsState =
    | { status: "loading" }
    | { status: "ready"; stats: StudyStats }
    | { status: "error"; message: string };

function emptyPerLevel(): Record<CefrLevel, { learned: number; total: number }> {
    return CEFR_LEVELS.reduce(
        (totals, level) => {
            totals[level] = { learned: 0, total: 0 };
            return totals;
        },
        {} as Record<CefrLevel, { learned: number; total: number }>,
    );
}

// Stored records for items that are not in the bundle are ignored: they belong
// to content that is no longer shipped, and counting them would report mastery
// against a total the learner cannot see.
export function computeStudyStats(
    verbs: Verb[],
    getItemProgress: (studyItemId: string) => ItemProgress | undefined,
): StudyStats {
    const perLevelCompletion = emptyPerLevel();
    let verbsLearned = 0;
    let itemsMastered = 0;

    for (const verb of verbs) {
        const bucket = perLevelCompletion[verb.cefrLevel];
        bucket.total += 1;

        const ids = getStudyItemIds(verb);
        for (const id of ids) {
            if (deriveItemMastery(getItemProgress(id)) === "known") {
                itemsMastered += 1;
            }
        }

        if (deriveVerbMastery(verb, getItemProgress) === "known") {
            verbsLearned += 1;
            bucket.learned += 1;
        }
    }

    return { verbsLearned, itemsMastered, perLevelCompletion };
}

export function useStudyStats(): StudyStatsState {
    const { status: progressStatus, error, getItemProgress } = useProgress();
    const [verbs, setVerbs] = useState<Verb[] | null>(null);
    const [loadError, setLoadError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;
        getAllVerbs()
            .then((loaded) => {
                if (active) setVerbs(loaded);
            })
            .catch((cause: unknown) => {
                if (!active) return;
                setLoadError(
                    cause instanceof Error
                        ? cause.message
                        : "Could not load the verb library.",
                );
            });
        return () => {
            active = false;
        };
    }, []);

    const stats = useMemo(
        () =>
            verbs === null ? null : computeStudyStats(verbs, getItemProgress),
        [verbs, getItemProgress],
    );

    if (loadError !== null) return { status: "error", message: loadError };
    if (progressStatus === "error") {
        return { status: "error", message: error ?? "Progress could not be read." };
    }
    if (stats === null || progressStatus === "loading") {
        return { status: "loading" };
    }
    return { status: "ready", stats };
}
