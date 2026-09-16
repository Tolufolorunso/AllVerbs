import {
    CEFR_LEVELS,
    type CefrLevel,
    type CollocationType,
} from "./types";

export interface ValidationIssue {
    path: string;
    message: string;
}

const VERB_ID = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const ITEM_SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const VERB_KEYS = [
    "id",
    "infinitive",
    "cefrLevel",
    "forms",
    "senses",
    "phrasalVerbs",
    "collocations",
    "synonyms",
    "antonyms",
    "audioText",
    "phonetic",
];

const FORM_KEYS = [
    "base",
    "past",
    "pastParticiple",
    "ing",
    "thirdPerson",
    "regular",
    "notes",
];

const FORM_STRING_KEYS = ["base", "past", "pastParticiple", "ing", "thirdPerson"];

const SENSE_KEYS = ["id", "definition", "cefrLevel", "examples"];

const PHRASAL_VERB_KEYS = [
    "id",
    "phrase",
    "meaning",
    "example",
    "cefrLevel",
    "separable",
    "particleNote",
];

const COLLOCATION_KEYS = ["id", "text", "type", "gloss", "example", "cefrLevel"];

const COLLOCATION_TYPES: readonly CollocationType[] = [
    "verb+noun",
    "adverb+verb",
    "verb+preposition",
    "other",
];

const COLLECTION_LETTER = {
    senses: "s",
    phrasalVerbs: "p",
    collocations: "c",
} as const;

type ItemLetter = "s" | "p" | "c";

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function collectUnknownKeys(
    value: Record<string, unknown>,
    allowed: readonly string[],
    path: string,
    issues: ValidationIssue[],
): void {
    for (const key of Object.keys(value)) {
        if (!allowed.includes(key)) {
            issues.push({ path: `${path}.${key}`, message: "unknown key" });
        }
    }
}

function requireString(
    value: Record<string, unknown>,
    key: string,
    path: string,
    issues: ValidationIssue[],
): string | undefined {
    const field = value[key];
    if (typeof field !== "string" || field.trim() === "") {
        issues.push({ path: `${path}.${key}`, message: "must be a non-empty string" });
        return undefined;
    }
    return field;
}

function optionalString(
    value: Record<string, unknown>,
    key: string,
    path: string,
    issues: ValidationIssue[],
): void {
    const field = value[key];
    if (field === undefined) return;
    if (typeof field !== "string" || field.trim() === "") {
        issues.push({ path: `${path}.${key}`, message: "must be a non-empty string when present" });
    }
}

function optionalBoolean(
    value: Record<string, unknown>,
    key: string,
    path: string,
    issues: ValidationIssue[],
): void {
    const field = value[key];
    if (field !== undefined && typeof field !== "boolean") {
        issues.push({ path: `${path}.${key}`, message: "must be a boolean when present" });
    }
}

function requireStringArray(value: unknown, path: string, issues: ValidationIssue[]): void {
    if (!Array.isArray(value)) {
        issues.push({ path, message: "must be an array of strings" });
        return;
    }
    value.forEach((entry, index) => {
        if (typeof entry !== "string" || entry.trim() === "") {
            issues.push({ path: `${path}[${index}]`, message: "must be a non-empty string" });
        }
    });
}

function validateCefrLevel(
    value: Record<string, unknown>,
    path: string,
    issues: ValidationIssue[],
): void {
    const level = value.cefrLevel;
    if (typeof level !== "string" || !CEFR_LEVELS.includes(level as CefrLevel)) {
        issues.push({
            path: `${path}.cefrLevel`,
            message: `must be one of ${CEFR_LEVELS.join(", ")}`,
        });
    }
}

function validateForms(
    value: unknown,
    path: string,
    infinitive: string | undefined,
    issues: ValidationIssue[],
): void {
    if (!isPlainObject(value)) {
        issues.push({ path, message: "must be an object" });
        return;
    }
    collectUnknownKeys(value, FORM_KEYS, path, issues);
    for (const key of FORM_STRING_KEYS) requireString(value, key, path, issues);
    if (typeof value.regular !== "boolean") {
        issues.push({ path: `${path}.regular`, message: "must be a boolean" });
    }
    optionalString(value, "notes", path, issues);
    if (infinitive !== undefined && value.base !== infinitive) {
        issues.push({ path: `${path}.base`, message: "must equal the verb infinitive" });
    }
}

function validateSense(
    value: Record<string, unknown>,
    path: string,
    issues: ValidationIssue[],
): void {
    collectUnknownKeys(value, SENSE_KEYS, path, issues);
    requireString(value, "definition", path, issues);
    validateCefrLevel(value, path, issues);
    const examples = value.examples;
    if (!Array.isArray(examples) || examples.length === 0) {
        issues.push({ path: `${path}.examples`, message: "must be a non-empty array" });
        return;
    }
    requireStringArray(examples, `${path}.examples`, issues);
}

function validatePhrasalVerb(
    value: Record<string, unknown>,
    path: string,
    issues: ValidationIssue[],
): void {
    collectUnknownKeys(value, PHRASAL_VERB_KEYS, path, issues);
    requireString(value, "phrase", path, issues);
    requireString(value, "meaning", path, issues);
    requireString(value, "example", path, issues);
    validateCefrLevel(value, path, issues);
    optionalBoolean(value, "separable", path, issues);
    optionalString(value, "particleNote", path, issues);
}

function validateCollocation(
    value: Record<string, unknown>,
    path: string,
    issues: ValidationIssue[],
): void {
    collectUnknownKeys(value, COLLOCATION_KEYS, path, issues);
    requireString(value, "text", path, issues);
    requireString(value, "gloss", path, issues);
    requireString(value, "example", path, issues);
    validateCefrLevel(value, path, issues);
    const type = value.type;
    if (typeof type !== "string" || !COLLOCATION_TYPES.includes(type as CollocationType)) {
        issues.push({
            path: `${path}.type`,
            message: `must be one of ${COLLOCATION_TYPES.join(", ")}`,
        });
    }
}

function validateStudyItemId(
    value: unknown,
    letter: ItemLetter,
    verbId: string,
    seenIds: Map<string, string>,
    path: string,
    issues: ValidationIssue[],
): void {
    if (typeof value !== "string" || value.trim() === "") {
        issues.push({ path: `${path}.id`, message: "must be a non-empty string" });
        return;
    }
    const prefix = `${verbId}.${letter}.`;
    if (!value.startsWith(prefix)) {
        issues.push({ path: `${path}.id`, message: `must start with ${prefix}` });
    } else if (!ITEM_SLUG.test(value.slice(prefix.length))) {
        issues.push({
            path: `${path}.id`,
            message: "must end with a lowercase kebab-case slug naming the item",
        });
    }
    const firstSeen = seenIds.get(value);
    if (firstSeen !== undefined) {
        issues.push({
            path: `${path}.id`,
            message: `duplicates the id used at ${firstSeen}`,
        });
        return;
    }
    seenIds.set(value, path);
}

type ItemValidator = (
    value: Record<string, unknown>,
    path: string,
    issues: ValidationIssue[],
) => void;

function validateStudyItems(
    value: unknown,
    letter: ItemLetter,
    verbId: string | undefined,
    path: string,
    requireItem: boolean,
    seenIds: Map<string, string>,
    validateItem: ItemValidator,
    issues: ValidationIssue[],
): void {
    if (!Array.isArray(value)) {
        issues.push({ path, message: "must be an array" });
        return;
    }
    if (requireItem && value.length === 0) {
        issues.push({ path, message: "must contain at least one entry" });
    }
    value.forEach((entry, index) => {
        const entryPath = `${path}[${index}]`;
        if (!isPlainObject(entry)) {
            issues.push({ path: entryPath, message: "must be an object" });
            return;
        }
        validateItem(entry, entryPath, issues);
        if (verbId !== undefined) {
            validateStudyItemId(entry.id, letter, verbId, seenIds, entryPath, issues);
        }
    });
}

function validateVerb(
    value: unknown,
    path: string,
    seenIds: Map<string, string>,
    issues: ValidationIssue[],
): void {
    if (!isPlainObject(value)) {
        issues.push({ path, message: "must be an object" });
        return;
    }
    collectUnknownKeys(value, VERB_KEYS, path, issues);
    const id = requireString(value, "id", path, issues);
    const infinitive = requireString(value, "infinitive", path, issues);
    requireString(value, "audioText", path, issues);
    optionalString(value, "phonetic", path, issues);
    validateCefrLevel(value, path, issues);
    if (id !== undefined) {
        if (!VERB_ID.test(id)) {
            issues.push({
                path: `${path}.id`,
                message: "must be a lowercase kebab-case id",
            });
        }
        const firstSeen = seenIds.get(id);
        if (firstSeen !== undefined) {
            issues.push({ path: `${path}.id`, message: `duplicates the id used at ${firstSeen}` });
        } else {
            seenIds.set(id, path);
        }
    }
    validateForms(value.forms, `${path}.forms`, infinitive, issues);
    requireStringArray(value.synonyms, `${path}.synonyms`, issues);
    requireStringArray(value.antonyms, `${path}.antonyms`, issues);
    validateStudyItems(
        value.senses,
        COLLECTION_LETTER.senses,
        id,
        `${path}.senses`,
        true,
        seenIds,
        validateSense,
        issues,
    );
    validateStudyItems(
        value.phrasalVerbs,
        COLLECTION_LETTER.phrasalVerbs,
        id,
        `${path}.phrasalVerbs`,
        false,
        seenIds,
        validatePhrasalVerb,
        issues,
    );
    validateStudyItems(
        value.collocations,
        COLLECTION_LETTER.collocations,
        id,
        `${path}.collocations`,
        false,
        seenIds,
        validateCollocation,
        issues,
    );
}

export function validateVerbs(value: unknown): ValidationIssue[] {
    if (!Array.isArray(value)) {
        return [{ path: "verbs", message: "must be an array of verbs" }];
    }
    const issues: ValidationIssue[] = [];
    const seenIds = new Map<string, string>();
    value.forEach((entry, index) => {
        validateVerb(entry, `verbs[${index}]`, seenIds, issues);
    });
    return issues;
}
