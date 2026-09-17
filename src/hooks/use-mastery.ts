import type { BadgeTone } from "@/components/ui/badge";
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

// These hooks render mastery but own no mastery data. Everything reads as "new"
// until F7 supplies stored progress and F8 defines what mastery means.

// Verb-level rollup, used by the Browse rows and the detail header.
export function useVerbMastery(): (verbId: string) => MasteryState {
    return useCallback(() => "new", []);
}

// Per-study-item state, keyed by a Sense, Collocation, or PhrasalVerb id.
export function useStudyItemMastery(): (studyItemId: string) => MasteryState {
    return useCallback(() => "new", []);
}
