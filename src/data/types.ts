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
