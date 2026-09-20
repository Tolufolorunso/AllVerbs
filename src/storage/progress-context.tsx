// The React seam over src/storage/progress.ts. Screens and hooks read stored
// progress here; nothing outside this file touches the storage module directly,
// so F8 can change scheduling without any screen knowing how data is persisted.

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from "react";

import {
    clearProgress,
    readProgress,
    updateStreak as persistStreak,
    ProgressStoreError,
    writeItemProgress,
    type ItemProgress,
} from "./progress";
import { EMPTY_STREAK, type StreakState } from "./streak";

export type ProgressStatus = "loading" | "ready" | "error";

export interface ProgressContextValue {
    status: ProgressStatus;
    // Set only when stored progress could not be read at all.
    error: string | null;
    // Records that were skipped, so unusable data stays visible instead of
    // looking like a learner who has not studied yet.
    warnings: string[];
    streak: StreakState;
    getItemProgress: (studyItemId: string) => ItemProgress | undefined;
    saveItemProgress: (progress: ItemProgress) => Promise<void>;
    updateStreak: (now: Date) => Promise<StreakState>;
    resetProgress: () => Promise<void>;
}

const ProgressContext = createContext<ProgressContextValue | null>(null);

const READ_FAILURE =
    "Saved progress could not be read and was left untouched. Reset progress to start over.";
const LOADING_FAILURE = "Progress is still loading.";

export function ProgressProvider({ children }: { children: ReactNode }) {
    const [status, setStatus] = useState<ProgressStatus>("loading");
    const [error, setError] = useState<string | null>(null);
    const [warnings, setWarnings] = useState<string[]>([]);
    const [items, setItems] = useState<Map<string, ItemProgress>>(
        () => new Map(),
    );
    const [streak, setStreak] = useState<StreakState>(EMPTY_STREAK);

    // Mirrors status for the write paths, which must refuse whenever hydration
    // failed: writing then would replace data this build cannot read.
    const statusRef = useRef<ProgressStatus>("loading");
    const streakQueue = useRef<Promise<void>>(Promise.resolve());

    useEffect(() => {
        let active = true;
        readProgress()
            .then((stored) => {
                if (!active) return;
                statusRef.current = "ready";
                setItems(stored.items);
                setStreak(stored.streak);
                setWarnings(stored.warnings);
                setStatus("ready");
            })
            .catch((cause: unknown) => {
                if (!active) return;
                statusRef.current = "error";
                setError(cause instanceof ProgressStoreError ? cause.message : READ_FAILURE);
                setStatus("error");
            });
        return () => {
            active = false;
        };
    }, []);

    const requireReady = useCallback(() => {
        if (statusRef.current === "ready") return;
        throw new Error(
            statusRef.current === "loading" ? LOADING_FAILURE : READ_FAILURE,
        );
    }, []);

    const getItemProgress = useCallback(
        (studyItemId: string) => items.get(studyItemId),
        [items],
    );

    // Memory follows storage, never leads it, so a failed write cannot leave the
    // UI claiming progress the next launch will not have.
    const saveItemProgress = useCallback(
        async (progress: ItemProgress) => {
            requireReady();
            await writeItemProgress(progress);
            setItems((current) => {
                const next = new Map(current);
                next.set(progress.studyItemId, progress);
                return next;
            });
        },
        [requireReady],
    );

    // Serialized: two quick reviews on the same day must not both read the same
    // stored streak and write the same increment.
    const updateStreak = useCallback(
        (now: Date) => {
            requireReady();
            const run = streakQueue.current.then(async () => {
                const next = await persistStreak(now);
                setStreak(next);
                return next;
            });
            streakQueue.current = run.then(
                () => undefined,
                () => undefined,
            );
            return run;
        },
        [requireReady],
    );

    // Allowed while in the error state on purpose: clearing unusable data is the
    // only way back to a clean store, and it is the one write that cannot destroy
    // anything this build understands.
    const resetProgress = useCallback(async () => {
        if (statusRef.current === "loading") throw new Error(LOADING_FAILURE);
        await clearProgress();
        statusRef.current = "ready";
        setStatus("ready");
        setItems(new Map());
        setStreak(EMPTY_STREAK);
        setWarnings([]);
        setError(null);
    }, []);

    const value = useMemo<ProgressContextValue>(
        () => ({
            status,
            error,
            warnings,
            streak,
            getItemProgress,
            saveItemProgress,
            updateStreak,
            resetProgress,
        }),
        [
            status,
            error,
            warnings,
            streak,
            getItemProgress,
            saveItemProgress,
            updateStreak,
            resetProgress,
        ],
    );

    return (
        <ProgressContext.Provider value={value}>
            {children}
        </ProgressContext.Provider>
    );
}

export function useProgress(): ProgressContextValue {
    const value = useContext(ProgressContext);
    if (!value) {
        throw new Error("useProgress must be used inside a ProgressProvider");
    }
    return value;
}
