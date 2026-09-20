// Turns a resolved study item into the two sides of a flashcard. Kept pure and
// kind-driven so the card component renders any item without branching on what
// kind it is.

import type { CefrLevel, ResolvedStudyItem, StudyItemKind } from "@/data/types";

export interface StudyCardFace {
    studyItemId: string;
    kind: StudyItemKind;
    level: CefrLevel;
    promptLabel: string;
    prompt: string;
    answerLabel: string;
    answer: string;
    verbId: string;
    verbInfinitive: string;
    examples: string[];
    note?: string;
}

// Fixed direction: the meaning side is the question and the target-language form
// is the answer. One rule for all three kinds, which is also what keeps a verb's
// senses distinguishable, since their definitions differ while their headword does
// not.
export function buildCardFace(resolved: ResolvedStudyItem): StudyCardFace {
    const verbId = resolved.verb.id;
    const verbInfinitive = resolved.verb.infinitive;

    switch (resolved.kind) {
        case "sense":
            return {
                studyItemId: resolved.sense.id,
                kind: "sense",
                level: resolved.sense.cefrLevel,
                promptLabel: "Recall the verb",
                prompt: resolved.sense.definition,
                answerLabel: "Verb",
                answer: verbInfinitive,
                verbId,
                verbInfinitive,
                examples: resolved.sense.examples,
            };
        case "collocation":
            return {
                studyItemId: resolved.collocation.id,
                kind: "collocation",
                level: resolved.collocation.cefrLevel,
                promptLabel: "Complete the collocation",
                prompt: resolved.collocation.gloss,
                answerLabel: "Collocation",
                answer: resolved.collocation.text,
                verbId,
                verbInfinitive,
                examples: [resolved.collocation.example],
                note: resolved.collocation.type,
            };
        case "phrasalVerb":
            return {
                studyItemId: resolved.phrasalVerb.id,
                kind: "phrasalVerb",
                level: resolved.phrasalVerb.cefrLevel,
                promptLabel: "Which phrasal verb?",
                prompt: resolved.phrasalVerb.meaning,
                answerLabel: "Phrasal verb",
                answer: resolved.phrasalVerb.phrase,
                verbId,
                verbInfinitive,
                examples: [resolved.phrasalVerb.example],
                note: separableNote(resolved.phrasalVerb),
            };
    }
}

// A written note wins over the boolean, so "used with a particle" style guidance is
// not overwritten by a bare "Separable".
function separableNote(item: {
    separable?: boolean;
    particleNote?: string;
}): string | undefined {
    if (item.particleNote) return item.particleNote;
    if (item.separable === undefined) return undefined;
    return item.separable ? "Separable" : "Not separable";
}
