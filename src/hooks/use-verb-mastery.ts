import { useCallback } from "react";

export type MasteryState = "new" | "learning" | "known";

// F4 renders mastery but owns no mastery data. Every verb reads as "new" until
// F7 supplies stored progress and F8 defines what makes a verb masterable.
export function useVerbMastery(): (verbId: string) => MasteryState {
    return useCallback(() => "new", []);
}
