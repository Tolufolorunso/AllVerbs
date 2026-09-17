import type { Verb } from "./types";

export type SearchMatchKind =
    | "headword"
    | "form"
    | "synonym"
    | "antonym"
    | "definition"
    | "collocation"
    | "phrasalVerb";

export interface SearchResult {
    verb: Verb;
    kind: SearchMatchKind;
    // The dataset string that matched, so the result can explain itself.
    text: string;
}

export const MATCH_LABEL: Record<SearchMatchKind, string> = {
    headword: "Headword",
    form: "Form",
    synonym: "Synonym",
    antonym: "Antonym",
    definition: "Meaning",
    collocation: "Collocation",
    phrasalVerb: "Phrasal verb",
};

export function normalizeQuery(raw: string): string {
    return raw.trim().replace(/\s+/g, " ").toLowerCase();
}

// Tier 0 is the verb itself, tier 1 is a related word, tier 2 is content, so a
// headword or form hit always outranks a meaning that merely mentions the query.
const TIER: Record<SearchMatchKind, number> = {
    headword: 0,
    form: 0,
    synonym: 1,
    antonym: 1,
    definition: 2,
    collocation: 2,
    phrasalVerb: 2,
};

function quality(text: string, query: string): number {
    const lower = text.toLowerCase();
    if (lower === query) return 0;
    if (lower.startsWith(query)) return 1;
    return 2;
}

interface Candidate {
    kind: SearchMatchKind;
    text: string;
}

function findBestMatch(verb: Verb, query: string): Candidate | null {
    const matches: Candidate[] = [];
    const consider = (kind: SearchMatchKind, text: string | undefined) => {
        if (typeof text === "string" && text.toLowerCase().includes(query)) {
            matches.push({ kind, text });
        }
    };

    consider("headword", verb.infinitive);
    consider("form", verb.forms.base);
    consider("form", verb.forms.past);
    consider("form", verb.forms.pastParticiple);
    consider("form", verb.forms.ing);
    consider("form", verb.forms.thirdPerson);
    verb.synonyms.forEach((word) => consider("synonym", word));
    verb.antonyms.forEach((word) => consider("antonym", word));
    verb.senses.forEach((sense) => consider("definition", sense.definition));
    verb.collocations.forEach((item) => {
        consider("collocation", item.text);
        consider("collocation", item.gloss);
    });
    verb.phrasalVerbs.forEach((item) => {
        consider("phrasalVerb", item.phrase);
        consider("phrasalVerb", item.meaning);
    });

    if (matches.length === 0) return null;

    matches.sort(
        (a, b) =>
            TIER[a.kind] - TIER[b.kind] ||
            quality(a.text, query) - quality(b.text, query) ||
            a.text.localeCompare(b.text),
    );
    return matches[0];
}

export function searchVerbs(verbs: Verb[], query: string): SearchResult[] {
    const needle = normalizeQuery(query);
    if (needle === "") return [];

    const results: SearchResult[] = [];
    for (const verb of verbs) {
        const match = findBestMatch(verb, needle);
        if (match) {
            results.push({ verb, kind: match.kind, text: match.text });
        }
    }

    results.sort(
        (a, b) =>
            TIER[a.kind] - TIER[b.kind] ||
            quality(a.text, needle) - quality(b.text, needle) ||
            a.verb.infinitive.localeCompare(b.verb.infinitive) ||
            a.text.localeCompare(b.text),
    );
    return results;
}
