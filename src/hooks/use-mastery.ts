import type { BadgeTone } from "@/components/ui/badge";
import { getStudyItemIds, type Verb } from "@/data/types";
import type { ItemProgress } from "@/storage/progress";
import { useProgress } from "@/storage/progress-context";
import { useCallback } from "react";

export type MasteryState = "new" | "learning" | "known";

// Presentation vocabulary for mastery, shared by every component that shows it.
export const MASTERY_LABEL: Record<MasteryState, string> = {
    new: "New",
    learning: "Learning",
    known: "Known",
};

export const MASTERY_TONE: Record<MasteryState, BadgeTone> = {
    new: "neutral",
    learning: "learning",
    known: "known",
};

// The interval at which a spaced-repetition schedule has moved an item past
// short-term review. Mastery is derived here and never persisted, so F8 can
// retune this number without a migration.
export const MASTERY_INTERVAL_DAYS = 21;

export function deriveItemMastery(
    progress: ItemProgress | undefined,
): MasteryState {
    if (!progress || progress.reviewCount === 0) return "new";
    return progress.intervalDays >= MASTERY_INTERVAL_DAYS ? "known" : "learning";
}

// A verb is learned once every one of its items is known; one weak item keeps it
// in progress, which is the point of studying chunks rather than the headword.
export function deriveVerbMastery(
    verb: Verb,
    getItemProgress: (studyItemId: string) => ItemProgress | undefined,
): MasteryState {
    const ids = getStudyItemIds(verb);
    if (ids.length === 0) return "new";

    const states = ids.map((id) => deriveItemMastery(getItemProgress(id)));
    if (states.every((state) => state === "known")) return "known";
    if (states.every((state) => state === "new")) return "new";
    return "learning";
}

// Verb-level rollup, used by the Browse rows and the detail header.
export function useVerbMastery(): (verb: Verb) => MasteryState {
    const { getItemProgress } = useProgress();
    return useCallback(
        (verb: Verb) => deriveVerbMastery(verb, getItemProgress),
        [getItemProgress],
    );
}

// Per-study-item state, keyed by a Sense, Collocation, or PhrasalVerb id.
export function useStudyItemMastery(): (studyItemId: string) => MasteryState {
    const { getItemProgress } = useProgress();
    return useCallback(
        (studyItemId: string) =>
            deriveItemMastery(getItemProgress(studyItemId)),
        [getItemProgress],
    );
}
