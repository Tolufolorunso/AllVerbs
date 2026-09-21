// Turns a study item into one answerable quiz question. Pure and kind-driven, so
// the quiz screen renders any exercise without branching on the item kind.
//
// The exercise kind and the option order are derived from the item id, never from
// randomness: a card that comes back after a failed answer must rebuild into the
// same question, and a stable build is what makes the choice testable.

import type {
    CefrLevel,
    Collocation,
    PhrasalVerb,
    ResolvedStudyItem,
    Sense,
    StudyItemKind,
    Verb,
} from "@/data/types";

export type ExerciseKind =
    | "multipleChoice"
    | "verbForm"
    | "fillInTheBlank"
    | "completeThePhrase";

export interface ExerciseOption {
    id: string;
    label: string;
}

export interface QuizExercise {
    studyItemId: string;
    itemKind: StudyItemKind;
    exerciseKind: ExerciseKind;
    level: CefrLevel;
    promptLabel: string;
    prompt: string;
    // The context that pins the answer. Absent for multiple choice.
    promptNote?: string;
    verbId: string;
    verbInfinitive: string;
    options: ExerciseOption[];
    correctOptionId: string;
    // The answer in full, shown after answering. Absent for multiple choice, where
    // the correct option already is the answer.
    explanation?: string;
}

export interface ExercisePool {
    verbLemmas: ExerciseOption[];
    collocationTexts: ExerciseOption[];
    phrasalPhrases: ExerciseOption[];
    particles: ExerciseOption[];
}

const OPTION_COUNT = 4;
const MIN_OPTION_COUNT = 3;

// The three-character gap the learner answers into.
const BLANK = "___";

type FormSlot = "base" | "past" | "pastParticiple" | "ing" | "thirdPerson";

const FORM_SLOTS: readonly FormSlot[] = [
    "base",
    "past",
    "pastParticiple",
    "ing",
    "thirdPerson",
];

const SLOT_LABEL: Record<FormSlot, string> = {
    base: "base form",
    past: "past form",
    pastParticiple: "past participle",
    ing: "-ing form",
    thirdPerson: "third person form",
};

interface OptionSet {
    correct: ExerciseOption;
    candidates: ExerciseOption[];
}

interface Options {
    options: ExerciseOption[];
    correctOptionId: string;
}

// Only the distribution and the stability matter here.
function hashSeed(value: string): number {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i++) {
        hash ^= value.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
}

// Case folded, with punctuation that cannot be part of a verb form removed. The
// apostrophe stays, so "don't" keeps its shape.
function normalizeWord(value: string): string {
    return value.toLowerCase().replace(/[^a-z0-9']/g, "");
}

function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function wordsOf(value: string): string[] {
    return value
        .split(/\s+/)
        .map(normalizeWord)
        .filter((word) => word.length > 0);
}

// A slot can hold alternatives separated by a slash, as "was/were" does, so both
// readings match.
function slotWords(value: string): string[] {
    return value
        .split(/[\s/]+/)
        .map(normalizeWord)
        .filter((word) => word.length > 0);
}

// Replaces the first whole-word, case-insensitive occurrence of the target and
// leaves every other character of the source untouched.
function blankOut(source: string, target: string): string {
    const words = wordsOf(target).map(escapeRegExp);
    return source.replace(new RegExp(`\\b${words.join("\\s+")}\\b`, "i"), BLANK);
}

function compareById(a: ExerciseOption, b: ExerciseOption): number {
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function dedupeByLabel(options: ExerciseOption[]): ExerciseOption[] {
    const seen = new Set<string>();
    const kept: ExerciseOption[] = [];
    // Ordered by id first, so which duplicate survives does not depend on the order
    // the library happened to load in.
    for (const option of [...options].sort(compareById)) {
        if (seen.has(option.label)) continue;
        seen.add(option.label);
        kept.push(option);
    }
    return kept;
}

function particleOf(phrase: string): string {
    return phrase.trim().split(/\s+/).slice(1).join(" ");
}

// Deterministic ordering keyed by the item id, so the same item always produces the
// same option order.
function seededOrder(
    options: ExerciseOption[],
    studyItemId: string,
): ExerciseOption[] {
    return [...options].sort(
        (a, b) =>
            hashSeed(`${studyItemId}|${a.id}`) - hashSeed(`${studyItemId}|${b.id}`) ||
            compareById(a, b),
    );
}

// Rotated so the id's hash picks which eligible kind leads, and a kind that cannot
// fill an option set falls through to the next rather than failing the item.
function rotate<T>(items: readonly T[], start: number): T[] {
    if (items.length === 0) return [];
    const offset = start % items.length;
    return [...items.slice(offset), ...items.slice(0, offset)];
}

// The correct answer plus its distractors, then the whole set ordered so the answer
// is not always in the same place. The pool a caller passes decides what kind of word
// the fillers are, which is what keeps a complete-the-phrase filler concrete: the
// particle pool holds particles and the lemma pool holds verbs.
function assembleOptions(
    set: OptionSet,
    studyItemId: string,
): Options | undefined {
    const others = set.candidates.filter(
        (option) => option.label !== set.correct.label,
    );
    const distractors = seededOrder(others, studyItemId).slice(
        0,
        OPTION_COUNT - 1,
    );
    const options = seededOrder(
        [set.correct, ...distractors],
        studyItemId,
    );
    return options.length >= MIN_OPTION_COUNT
        ? { options, correctOptionId: set.correct.id }
        : undefined;
}

export function buildExercisePool(verbs: Verb[]): ExercisePool {
    const phrases = verbs.flatMap((verb) =>
        verb.phrasalVerbs.map((item) => ({
            id: item.id,
            label: item.phrase,
            particle: particleOf(item.phrase),
        })),
    );

    return {
        verbLemmas: dedupeByLabel(
            verbs.map((verb) => ({ id: verb.id, label: verb.infinitive })),
        ),
        collocationTexts: dedupeByLabel(
            verbs.flatMap((verb) =>
                verb.collocations.map((item) => ({
                    id: item.id,
                    label: item.text,
                })),
            ),
        ),
        phrasalPhrases: dedupeByLabel(
            phrases.map((item) => ({ id: item.id, label: item.label })),
        ),
        particles: dedupeByLabel(
            phrases
                .filter((item) => item.particle.length > 0)
                .map((item) => ({ id: item.particle, label: item.particle })),
        ),
    };
}

interface GapTarget {
    example: string;
    word: string;
    slot: FormSlot;
}

// The example that asks for exactly one form: a sentence whose only token matching
// any of the verb's slots matches exactly one slot. Anything looser would have more
// than one defensible answer.
function findGapTarget(verb: Verb, sense: Sense): GapTarget | undefined {
    const slots = FORM_SLOTS.map((slot) => ({
        slot,
        words: slotWords(verb.forms[slot]),
    }));

    for (const example of sense.examples) {
        const matches: { word: string; slot: FormSlot }[] = [];
        let ambiguous = false;

        for (const raw of example.split(/\s+/)) {
            const word = normalizeWord(raw);
            if (!word) continue;
            const hits = slots.filter((entry) => entry.words.includes(word));
            // A token shared by two slots, as "had" is by past and past participle,
            // asks for nothing, so the whole example is unusable.
            if (hits.length > 1) {
                ambiguous = true;
                break;
            }
            if (hits.length === 1) matches.push({ word, slot: hits[0].slot });
        }

        if (!ambiguous && matches.length === 1) {
            return { example, word: matches[0].word, slot: matches[0].slot };
        }
    }
    return undefined;
}

interface ExerciseBase {
    studyItemId: string;
    itemKind: StudyItemKind;
    level: CefrLevel;
    verbId: string;
    verbInfinitive: string;
}

function senseBase(verb: Verb, sense: Sense): ExerciseBase {
    return {
        studyItemId: sense.id,
        itemKind: "sense",
        level: sense.cefrLevel,
        verbId: verb.id,
        verbInfinitive: verb.infinitive,
    };
}

// The meanings of a verb cannot answer a form question, so the multiple-choice
// fallback offers the verb whose meaning was given.
function buildSenseMultipleChoice(
    verb: Verb,
    sense: Sense,
    pool: ExercisePool,
): QuizExercise | undefined {
    const options = assembleOptions(
        {
            correct: { id: verb.id, label: verb.infinitive },
            candidates: pool.verbLemmas,
        },
        sense.id,
    );
    if (!options) return undefined;
    return {
        ...senseBase(verb, sense),
        exerciseKind: "multipleChoice",
        promptLabel: "Which verb means this?",
        prompt: sense.definition,
        ...options,
    };
}

function buildFillInTheBlank(
    verb: Verb,
    sense: Sense,
    pool: ExercisePool,
    gap: GapTarget,
): QuizExercise | undefined {
    const options = assembleOptions(
        {
            correct: { id: verb.id, label: verb.infinitive },
            candidates: pool.verbLemmas,
        },
        sense.id,
    );
    if (!options) return undefined;
    return {
        ...senseBase(verb, sense),
        exerciseKind: "fillInTheBlank",
        promptLabel: "Which verb completes this sentence?",
        prompt: blankOut(gap.example, gap.word),
        promptNote: sense.definition,
        ...options,
        explanation: gap.example,
    };
}

// One option per distinct form string, with the asked-for slot owning its own
// string so the correct option id always resolves.
function buildFormOptions(
    verb: Verb,
    required: FormSlot,
): Options | undefined {
    const byLabel = new Map<string, ExerciseOption>();
    for (const slot of [required, ...FORM_SLOTS]) {
        const label = verb.forms[slot];
        if (!byLabel.has(label)) byLabel.set(label, { id: slot, label });
    }
    const options = [...byLabel.values()];
    return options.length >= MIN_OPTION_COUNT
        ? { options, correctOptionId: required }
        : undefined;
}

function buildVerbForm(
    verb: Verb,
    sense: Sense,
    gap: GapTarget,
): QuizExercise | undefined {
    const options = buildFormOptions(verb, gap.slot);
    if (!options) return undefined;
    return {
        ...senseBase(verb, sense),
        exerciseKind: "verbForm",
        promptLabel: "Choose the correct form",
        prompt: blankOut(gap.example, gap.word),
        promptNote: `${SLOT_LABEL[gap.slot]} of "${verb.infinitive}"`,
        options: seededOrder(options.options, sense.id),
        correctOptionId: options.correctOptionId,
        explanation: gap.example,
    };
}

export function buildSenseExercise(
    verb: Verb,
    sense: Sense,
    pool: ExercisePool,
): QuizExercise | undefined {
    const gap = findGapTarget(verb, sense);
    const eligible: ExerciseKind[] = ["multipleChoice"];
    if (gap) {
        eligible.push("verbForm");
        // The base form is the one slot a sentence can ask for without naming the
        // form in the prompt, which is what makes a bare gap fair.
        if (gap.slot === "base") eligible.push("fillInTheBlank");
    }

    for (const kind of rotate(eligible, hashSeed(sense.id))) {
        const built =
            kind === "multipleChoice"
                ? buildSenseMultipleChoice(verb, sense, pool)
                : kind === "fillInTheBlank" && gap
                  ? buildFillInTheBlank(verb, sense, pool, gap)
                  : kind === "verbForm" && gap
                    ? buildVerbForm(verb, sense, gap)
                    : undefined;
        if (built) return built;
    }
    return undefined;
}

function collocationBase(verb: Verb, item: Collocation): ExerciseBase {
    return {
        studyItemId: item.id,
        itemKind: "collocation",
        level: item.cefrLevel,
        verbId: verb.id,
        verbInfinitive: verb.infinitive,
    };
}

export function buildCollocationExercise(
    verb: Verb,
    collocation: Collocation,
    pool: ExercisePool,
): QuizExercise | undefined {
    const head = collocation.text.trim().split(/\s+/)[0] ?? "";
    const eligible: ExerciseKind[] = ["multipleChoice"];
    if (head) eligible.push("completeThePhrase");

    for (const kind of rotate(eligible, hashSeed(collocation.id))) {
        if (kind === "multipleChoice") {
            const options = assembleOptions(
                {
                    correct: { id: collocation.id, label: collocation.text },
                    candidates: pool.collocationTexts,
                },
                collocation.id,
            );
            if (options) {
                return {
                    ...collocationBase(verb, collocation),
                    exerciseKind: "multipleChoice",
                    promptLabel: "Which collocation means this?",
                    prompt: collocation.gloss,
                    ...options,
                };
            }
            continue;
        }

        const options = assembleOptions(
            { correct: { id: head, label: head }, candidates: pool.verbLemmas },
            collocation.id,
        );
        if (options) {
            return {
                ...collocationBase(verb, collocation),
                exerciseKind: "completeThePhrase",
                promptLabel: "Complete the collocation",
                prompt: blankOut(collocation.text, head),
                promptNote: collocation.gloss,
                ...options,
                explanation: collocation.text,
            };
        }
    }
    return undefined;
}

function phrasalBase(verb: Verb, item: PhrasalVerb): ExerciseBase {
    return {
        studyItemId: item.id,
        itemKind: "phrasalVerb",
        level: item.cefrLevel,
        verbId: verb.id,
        verbInfinitive: verb.infinitive,
    };
}

export function buildPhrasalExercise(
    verb: Verb,
    phrasalVerb: PhrasalVerb,
    pool: ExercisePool,
): QuizExercise | undefined {
    const particle = particleOf(phrasalVerb.phrase);
    const hasTwoTokens = phrasalVerb.phrase.trim().split(/\s+/).length >= 2;
    const eligible: ExerciseKind[] = ["multipleChoice"];
    if (hasTwoTokens && particle) eligible.push("completeThePhrase");

    for (const kind of rotate(eligible, hashSeed(phrasalVerb.id))) {
        if (kind === "multipleChoice") {
            const options = assembleOptions(
                {
                    correct: {
                        id: phrasalVerb.id,
                        label: phrasalVerb.phrase,
                    },
                    candidates: pool.phrasalPhrases,
                },
                phrasalVerb.id,
            );
            if (options) {
                return {
                    ...phrasalBase(verb, phrasalVerb),
                    exerciseKind: "multipleChoice",
                    promptLabel: "Which phrasal verb means this?",
                    prompt: phrasalVerb.meaning,
                    ...options,
                };
            }
            continue;
        }

        const options = assembleOptions(
            {
                correct: { id: particle, label: particle },
                candidates: pool.particles,
            },
            phrasalVerb.id,
        );
        if (options) {
            return {
                ...phrasalBase(verb, phrasalVerb),
                exerciseKind: "completeThePhrase",
                promptLabel: "Complete the phrasal verb",
                prompt: blankOut(phrasalVerb.phrase, particle),
                promptNote: phrasalVerb.meaning,
                ...options,
                explanation: phrasalVerb.phrase,
            };
        }
    }
    return undefined;
}

export function buildExercise(
    resolved: ResolvedStudyItem,
    pool: ExercisePool,
): QuizExercise | undefined {
    switch (resolved.kind) {
        case "sense":
            return buildSenseExercise(resolved.verb, resolved.sense, pool);
        case "collocation":
            return buildCollocationExercise(
                resolved.verb,
                resolved.collocation,
                pool,
            );
        case "phrasalVerb":
            return buildPhrasalExercise(
                resolved.verb,
                resolved.phrasalVerb,
                pool,
            );
    }
}
