import {
    CEFR_LEVELS,
    type CefrLevel,
    type ResolvedStudyItem,
    type StudyItemRef,
    type Verb,
} from "./types";
import { validateVerbs, type ValidationIssue } from "./validate";

// A level with no entry resolves to an empty list, so browsing can render every
// section before the full dataset (F14) lands.
const LEVEL_CHUNKS: Partial<Record<CefrLevel, () => Promise<unknown>>> = {
    A1: () => import("./verbs/a1.json"),
};

export class DataSetError extends Error {
    readonly issues: ValidationIssue[];

    constructor(level: CefrLevel | "all", issues: ValidationIssue[]) {
        super(
            `Invalid verb dataset (${level}): ${issues
                .map((issue) => `${issue.path} ${issue.message}`)
                .join("; ")}`,
        );
        this.name = "DataSetError";
        this.issues = issues;
    }
}

const levelCache = new Map<CefrLevel, Promise<Verb[]>>();
let allLevelsCache: Promise<Verb[]> | undefined;

// Dynamic import returns the JSON module namespace, not the array itself.
function unwrapChunk(module: unknown): unknown {
    if (module !== null && typeof module === "object" && "default" in module) {
        return (module as { default: unknown }).default;
    }
    return module;
}

async function loadLevel(level: CefrLevel): Promise<Verb[]> {
    const load = LEVEL_CHUNKS[level];
    if (!load) return [];

    const module = await load();
    const value = unwrapChunk(module);
    const issues = validateVerbs(value);
    if (issues.length > 0) throw new DataSetError(level, issues);
    return value as Verb[];
}

export function getVerbsByLevel(level: CefrLevel): Promise<Verb[]> {
    const registered = LEVEL_CHUNKS[level] !== undefined;
    if (!registered) return Promise.resolve([]);

    const cached = levelCache.get(level);
    if (cached) return cached;

    const pending = loadLevel(level);
    levelCache.set(level, pending);
    // A failed load must not be cached, or every later caller sees the failure.
    pending.catch(() => levelCache.delete(level));
    return pending;
}

export function getAllVerbs(): Promise<Verb[]> {
    if (!allLevelsCache) {
        allLevelsCache = Promise.all(CEFR_LEVELS.map(getVerbsByLevel)).then(
            (levels) => levels.flat(),
        );
        allLevelsCache.catch(() => {
            allLevelsCache = undefined;
        });
    }
    return allLevelsCache;
}

async function findVerb(
    match: (verb: Verb) => boolean,
): Promise<Verb | undefined> {
    for (const level of CEFR_LEVELS) {
        const verbs = await getVerbsByLevel(level);
        const found = verbs.find(match);
        if (found) return found;
    }
    return undefined;
}

export function getVerbById(id: string): Promise<Verb | undefined> {
    return findVerb((verb) => verb.id === id);
}

export function getStudyItem(
    ref: StudyItemRef,
): Promise<ResolvedStudyItem | undefined> {
    return findVerb((verb) => hasStudyItem(verb, ref)).then((verb) => {
        if (!verb) return undefined;
        if (ref.kind === "sense") {
            const sense = verb.senses.find((item) => item.id === ref.id);
            return sense ? { kind: "sense", verb, sense } : undefined;
        }
        if (ref.kind === "collocation") {
            const collocation = verb.collocations.find(
                (item) => item.id === ref.id,
            );
            return collocation
                ? { kind: "collocation", verb, collocation }
                : undefined;
        }
        const phrasalVerb = verb.phrasalVerbs.find((item) => item.id === ref.id);
        return phrasalVerb
            ? { kind: "phrasalVerb", verb, phrasalVerb }
            : undefined;
    });
}

function hasStudyItem(verb: Verb, ref: StudyItemRef): boolean {
    switch (ref.kind) {
        case "sense":
            return verb.senses.some((item) => item.id === ref.id);
        case "collocation":
            return verb.collocations.some((item) => item.id === ref.id);
        case "phrasalVerb":
            return verb.phrasalVerbs.some((item) => item.id === ref.id);
    }
}
