// The flashcard presentation of the shared queue session. The session mechanics
// (hydration gate, queue snapshot, requeue rule, graded writes) live in
// use-queue-session; this hook only turns the current study item into a card face,
// so the quiz flow can share the same engine without a second copy of it.

import { buildCardFace, type StudyCardFace } from "@/srs/card";
import type { ReviewGrade } from "@/srs/schedule";
import {
    useQueueSession,
    type QueueSessionOptions,
    type QueueSessionState,
} from "@/hooks/use-queue-session";

export type StudySessionOptions = QueueSessionOptions;

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

export function useStudySession(
    options: StudySessionOptions,
): UseStudySessionResult {
    const { state, busy, reveal, grade, restart } = useQueueSession(options);
    return {
        state: toCardState(state),
        busy,
        reveal,
        grade,
        restart,
    };
}

function toCardState(state: QueueSessionState): StudySessionState {
    if (state.status !== "active") return state;
    return {
        status: "active",
        face: buildCardFace(state.item),
        revealed: state.revealed,
        reviewed: state.reviewed,
        remaining: state.remaining,
        progress: state.progress,
    };
}
