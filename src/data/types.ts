export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

export const CEFR_LEVELS: readonly CefrLevel[] = [
    "A1",
    "A2",
    "B1",
    "B2",
    "C1",
    "C2",
];

export type StudyItemKind = "sense" | "collocation" | "phrasalVerb";

export type CollocationType =
    | "verb+noun"
    | "adverb+verb"
    | "verb+preposition"
    | "other";

export interface VerbForms {
    base: string;
    past: string;
    pastParticiple: string;
    ing: string;
    thirdPerson: string;
    regular: boolean;
    notes?: string;
}

export interface Sense {
    id: string;
    definition: string;
    cefrLevel: CefrLevel;
    examples: string[];
}

export interface PhrasalVerb {
    id: string;
    phrase: string;
    meaning: string;
    example: string;
    cefrLevel: CefrLevel;
    separable?: boolean;
    particleNote?: string;
}

export interface Collocation {
    id: string;
    text: string;
    type: CollocationType;
    gloss: string;
    example: string;
    cefrLevel: CefrLevel;
}

export interface Verb {
    id: string;
    infinitive: string;
    cefrLevel: CefrLevel;
    forms: VerbForms;
    senses: Sense[];
    phrasalVerbs: PhrasalVerb[];
    collocations: Collocation[];
    synonyms: string[];
    antonyms: string[];
    audioText: string;
    phonetic?: string;
}

export type StudyItemRef =
    | { kind: "sense"; id: string }
    | { kind: "collocation"; id: string }
    | { kind: "phrasalVerb"; id: string };

export type ResolvedStudyItem =
    | { kind: "sense"; verb: Verb; sense: Sense }
    | { kind: "collocation"; verb: Verb; collocation: Collocation }
    | { kind: "phrasalVerb"; verb: Verb; phrasalVerb: PhrasalVerb };

// A verb's study items in a fixed order. Mastery, stats, and the study flows all
// need this list, and they must agree on what a verb's items are.
export function getStudyItemIds(verb: Verb): string[] {
    return [
        ...verb.senses.map((item) => item.id),
        ...verb.collocations.map((item) => item.id),
        ...verb.phrasalVerbs.map((item) => item.id),
    ];
}

// The letter each kind occupies in the persisted "<verbId>.<letter>.<slug>" id.
// The validator and anything reading an id back out of storage share this map, so
// the format cannot drift between what is written and what is parsed.
export const STUDY_ITEM_KIND_LETTER: Record<StudyItemKind, "s" | "c" | "p"> = {
    sense: "s",
    collocation: "c",
    phrasalVerb: "p",
};

const KIND_BY_LETTER: Record<string, StudyItemKind> = {
    s: "sense",
    c: "collocation",
    p: "phrasalVerb",
};

// Recovers the ref an id encodes, or undefined when the id is not that shape. It
// says nothing about whether the item exists in the bundle.
export function parseStudyItemId(id: string): StudyItemRef | undefined {
    const parts = id.split(".");
    if (parts.length !== 3) return undefined;
    const [verbId, letter, slug] = parts;
    if (!verbId || !letter || !slug) return undefined;
    const kind = KIND_BY_LETTER[letter];
    if (!kind) return undefined;
    return { kind, id };
}
