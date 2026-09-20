import { getAllVerbs, getStudyItem, getVerbById } from "@/data/loader";
import { getStudyItemIds, parseStudyItemId, type Verb } from "@/data/types";
import { useProgress, type ProgressStatus } from "@/storage/progress-context";
import { buildCardFace, type StudyCardFace } from "@/srs/card";
import { buildStudyQueue } from "@/srs/queue";
import type { ReviewGrade } from "@/srs/schedule";
import { useCallback, useEffect, useRef, useState } from "react";

export interface StudySessionOptions {
    // Restricts the session to one verb's items. Absent studies the whole queue.
    verbId?: string;
}

export type StudySessionState =
    | { status: "loading" }
    | { status: "error"; message: string }
    | { status: "empty" }
    | {
          status: "active";
          face: StudyCardFace;
          revealed: boolean;
          reviewed: number;
          remaining: number;
          progress: number;
      }
    | { status: "complete"; reviewed: number; againCount: number };

export interface UseStudySessionResult {
    state: StudySessionState;
    // True while a grade write is in flight, so the screen can disable its buttons.
    busy: boolean;
    reveal: () => void;
    grade: (grade: ReviewGrade) => Promise<void>;
    restart: () => void;
}

const LOAD_FAILURE = "Could not load the verb library.";

// The session snapshots the queue once and owns it. Rebuilding from the live queue
// would reshuffle the remaining cards under the learner, because grading changes
// the progress the queue is derived from.
interface Session {
    cards: StudyCardFace[];
    index: number;
    reviewed: number;
    againCount: number;
}

type Snapshot = { generation: number } & (
    | { status: "empty" }
    | { status: "error"; message: string }
    | { status: "active"; session: Session }
);

export function useStudySession(
    options: StudySessionOptions,
): UseStudySessionResult {
    const { verbId } = options;
    const { status: progressStatus, error, getItemProgress, recordReview } =
        useProgress();

    const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
    const [busy, setBusy] = useState(false);
    // Bumped by restart(), and recorded in the snapshot it produced. Loading is
    // derived from the two disagreeing, so the effect never has to reset state.
    const [generation, setGeneration] = useState(0);
    // Which card the learner revealed, by its position. Deriving revealed from this
    // rather than tracking a boolean means advancing a card resets it for free.
    const [revealedIndex, setRevealedIndex] = useState<number | null>(null);

    // Grading is async, so a second tap must not act on a card that has already
    // been replaced. Read only in handlers, so a ref is not a render dependency.
    const busyRef = useRef(false);

    // The progress lookup changes identity whenever the stored map changes, which
    // grading does. Reading it through a ref keeps the session-start effect from
    // re-running mid-session and rebuilding the cards under the learner.
    const progressRef = useRef(getItemProgress);
    useEffect(() => {
        progressRef.current = getItemProgress;
    }, [getItemProgress]);

    useEffect(() => {
        // Building the queue before stored progress has hydrated would treat every
        // already-scheduled item as new, so the session waits for the store.
        if (progressStatus === "loading") return;
        if (progressStatus === "error") return;

        let active = true;

        const start = async () => {
            const now = new Date();
            const verbs: Verb[] = await getAllVerbs();

            let candidateIds: string[];
            if (verbId !== undefined) {
                const verb = await getVerbById(verbId);
                if (!verb) {
                    throw new Error(`No verb named "${verbId}" in the library.`);
                }
                candidateIds = getStudyItemIds(verb);
            } else {
                candidateIds = verbs.flatMap(getStudyItemIds);
            }

            const queue = buildStudyQueue({
                studyItemIds: candidateIds,
                getItemProgress: progressRef.current,
                now,
                includeNew: true,
            });

            const cards: StudyCardFace[] = [];
            for (const entry of queue) {
                const ref = parseStudyItemId(entry.studyItemId);
                if (!ref) continue;
                const resolved = await getStudyItem(ref);
                // An id that does not resolve is an orphan from content that is no
                // longer shipped, so it must not become a blank card.
                if (resolved) cards.push(buildCardFace(resolved));
            }

            if (!active) return;
            if (cards.length === 0) {
                setSnapshot({ generation, status: "empty" });
                return;
            }
            setSnapshot({
                generation,
                status: "active",
                session: { cards, index: 0, reviewed: 0, againCount: 0 },
            });
        };

        start().catch((cause: unknown) => {
            if (!active) return;
            setSnapshot({
                generation,
                status: "error",
                message: cause instanceof Error ? cause.message : LOAD_FAILURE,
            });
        });

        return () => {
            active = false;
        };
    }, [verbId, generation, progressStatus]);

    const reveal = useCallback(() => {
        if (busyRef.current) return;
        if (snapshot?.status !== "active") return;
        setRevealedIndex(snapshot.session.index);
    }, [snapshot]);

    const grade = useCallback(
        async (gradeValue: ReviewGrade) => {
            if (snapshot?.status !== "active" || busyRef.current) return;
            const { session } = snapshot;
            const face = session.cards[session.index];
            if (!face) return;

            busyRef.current = true;
            setBusy(true);
            try {
                await recordReview(face.studyItemId, gradeValue, new Date());
            } catch (cause) {
                // Advancing would silently lose the review and desynchronize the
                // schedule from what the learner just did.
                busyRef.current = false;
                setBusy(false);
                throw cause;
            }

            setSnapshot((current) => {
                if (current?.status !== "active") return current;
                // A failed card returns to the end of this same session rather
                // than waiting for the next one.
                const nextCards =
                    gradeValue === "again"
                        ? [...current.session.cards, face]
                        : current.session.cards;
                return {
                    generation: current.generation,
                    status: "active",
                    session: {
                        cards: nextCards,
                        index: current.session.index + 1,
                        reviewed: current.session.reviewed + 1,
                        againCount:
                            current.session.againCount +
                            (gradeValue === "again" ? 1 : 0),
                    },
                };
            });
            setRevealedIndex(null);
            busyRef.current = false;
            setBusy(false);
        },
        [recordReview, snapshot],
    );

    const restart = useCallback(() => {
        setRevealedIndex(null);
        setGeneration((value) => value + 1);
    }, []);

    return {
        state: toState(snapshot, revealedIndex, generation, progressStatus, error),
        busy,
        reveal,
        grade,
        restart,
    };
}

function toState(
    snapshot: Snapshot | null,
    revealedIndex: number | null,
    generation: number,
    progressStatus: ProgressStatus,
    progressError: string | null,
): StudySessionState {
    // An unreadable or unhydrated store is reported as such rather than as a queue
    // full of new items, which would be actively misleading.
    if (progressStatus === "error") {
        return {
            status: "error",
            message: progressError ?? "Saved progress could not be read.",
        };
    }
    // A snapshot from an earlier generation is stale, so a restart reads as loading
    // until the fresh queue resolves. This is the derived reset the effect must not
    // perform itself.
    if (
        progressStatus === "loading" ||
        snapshot === null ||
        snapshot.generation !== generation
    ) {
        return { status: "loading" };
    }
    if (snapshot.status === "error") return { status: "error", message: snapshot.message };
    if (snapshot.status === "empty") return { status: "empty" };

    const { cards, index, reviewed, againCount } = snapshot.session;
    if (index >= cards.length) {
        return { status: "complete", reviewed, againCount };
    }

    const remaining = cards.length - index;
    return {
        status: "active",
        face: cards[index],
        revealed: revealedIndex === index,
        reviewed,
        remaining,
        progress: reviewed / (reviewed + remaining),
    };
}
