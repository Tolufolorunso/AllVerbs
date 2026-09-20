// The app's only writable state: one stored record per study item, keyed by the
// stable id the bundled dataset assigns, plus the study streak.

import AsyncStorage from "@react-native-async-storage/async-storage";

import { isValidStudyItemId } from "@/data/validate";

import { advanceStreak, EMPTY_STREAK, type StreakState } from "./streak";

export const PROGRESS_SCHEMA_VERSION = 1;
export const PROGRESS_PREFIX = "allverb.progress.";

const META_KEY = `${PROGRESS_PREFIX}meta`;
const ITEM_PREFIX = `${PROGRESS_PREFIX}item.`;

export interface ItemProgress {
    studyItemId: string;
    ease: number;
    intervalDays: number;
    dueAt: string;
    reviewCount: number;
}

export interface StoredProgress {
    items: Map<string, ItemProgress>;
    streak: StreakState;
    // Records that were left stored but could not be read, one message each.
    warnings: string[];
}

export class ProgressStoreError extends Error {
    readonly issues: string[];

    constructor(issues: string[]) {
        super(`Invalid progress data: ${issues.join("; ")}`);
        this.name = "ProgressStoreError";
        this.issues = issues;
    }
}

function describeError(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseJson(raw: string): { ok: true; value: unknown } | { ok: false } {
    try {
        return { ok: true, value: JSON.parse(raw) as unknown };
    } catch {
        return { ok: false };
    }
}

// Only the known fields reach storage, so a caller cannot smuggle extra keys in.
function toItemProgress(source: ItemProgress): ItemProgress {
    return {
        studyItemId: source.studyItemId,
        ease: source.ease,
        intervalDays: source.intervalDays,
        dueAt: source.dueAt,
        reviewCount: source.reviewCount,
    };
}

function validateItemProgress(value: unknown, key: string): string[] {
    if (!isPlainObject(value)) return [`${key} must be a JSON object`];

    const issues: string[] = [];
    const { studyItemId, ease, intervalDays, dueAt, reviewCount } = value;

    if (typeof studyItemId !== "string" || !isValidStudyItemId(studyItemId)) {
        issues.push(`${key}.studyItemId must be a dataset study-item id`);
    } else if (`${ITEM_PREFIX}${studyItemId}` !== key) {
        issues.push(`${key}.studyItemId does not match its storage key`);
    }
    if (typeof ease !== "number" || !Number.isFinite(ease) || ease <= 0) {
        issues.push(`${key}.ease must be a positive number`);
    }
    if (
        typeof intervalDays !== "number" ||
        !Number.isFinite(intervalDays) ||
        intervalDays < 0
    ) {
        issues.push(`${key}.intervalDays must be zero or greater`);
    }
    if (typeof dueAt !== "string" || Number.isNaN(Date.parse(dueAt))) {
        issues.push(`${key}.dueAt must be an ISO 8601 timestamp`);
    }
    if (
        typeof reviewCount !== "number" ||
        !Number.isInteger(reviewCount) ||
        reviewCount < 0
    ) {
        issues.push(`${key}.reviewCount must be a non-negative integer`);
    }
    return issues;
}

function readStreak(value: unknown, warnings: string[]): StreakState {
    if (value === undefined) return EMPTY_STREAK;
    if (!isPlainObject(value)) {
        warnings.push(`${META_KEY}.streak is not an object; the streak was ignored`);
        return EMPTY_STREAK;
    }

    const { current, longest, lastStudyDate } = value;
    const isCount = (count: unknown): count is number =>
        typeof count === "number" && Number.isInteger(count) && count >= 0;

    if (
        !isCount(current) ||
        !isCount(longest) ||
        (lastStudyDate !== undefined && typeof lastStudyDate !== "string")
    ) {
        warnings.push(`${META_KEY}.streak is malformed; the streak was ignored`);
        return EMPTY_STREAK;
    }

    return {
        current,
        longest,
        lastStudyDate:
            typeof lastStudyDate === "string" ? lastStudyDate : undefined,
    };
}

async function listProgressKeys(): Promise<string[]> {
    try {
        const keys = await AsyncStorage.getAllKeys();
        return keys.filter((key) => key.startsWith(PROGRESS_PREFIX));
    } catch (error) {
        throw new ProgressStoreError([
            `could not list progress keys: ${describeError(error)}`,
        ]);
    }
}

async function readMeta(warnings: string[]): Promise<StreakState> {
    let raw: string | null;
    try {
        raw = await AsyncStorage.getItem(META_KEY);
    } catch (error) {
        throw new ProgressStoreError([
            `could not read ${META_KEY}: ${describeError(error)}`,
        ]);
    }
    if (raw === null) return EMPTY_STREAK;

    const parsed = parseJson(raw);
    if (!parsed.ok) {
        throw new ProgressStoreError([`${META_KEY} is not valid JSON`]);
    }
    // An unrecognized version comes from a newer build or from corruption. Either
    // way this build must not overwrite what it does not understand.
    if (
        !isPlainObject(parsed.value) ||
        parsed.value.schemaVersion !== PROGRESS_SCHEMA_VERSION
    ) {
        throw new ProgressStoreError([
            `${META_KEY} uses unsupported schema version`,
        ]);
    }
    return readStreak(parsed.value.streak, warnings);
}

async function readEntries(
    keys: string[],
): Promise<readonly (readonly [string, string | null])[]> {
    try {
        return await AsyncStorage.multiGet(keys);
    } catch (error) {
        throw new ProgressStoreError([
            `could not read progress records: ${describeError(error)}`,
        ]);
    }
}

export async function readProgress(): Promise<StoredProgress> {
    const warnings: string[] = [];
    const keys = await listProgressKeys();
    const streak = await readMeta(warnings);
    const items = new Map<string, ItemProgress>();

    const itemKeys = keys.filter((key) => key.startsWith(ITEM_PREFIX));
    if (itemKeys.length > 0) {
        for (const [key, raw] of await readEntries(itemKeys)) {
            if (raw === null) continue;

            const parsed = parseJson(raw);
            if (!parsed.ok) {
                warnings.push(`${key} is not valid JSON; it was left stored`);
                continue;
            }
            const issues = validateItemProgress(parsed.value, key);
            if (issues.length > 0) {
                warnings.push(...issues);
                continue;
            }

            const record = parsed.value as ItemProgress;
            items.set(record.studyItemId, toItemProgress(record));
        }
    }

    return { items, streak, warnings };
}

export async function writeItemProgress(progress: ItemProgress): Promise<void> {
    const key = `${ITEM_PREFIX}${progress.studyItemId}`;
    const issues = validateItemProgress(progress, key);
    if (issues.length > 0) throw new ProgressStoreError(issues);

    try {
        await AsyncStorage.setItem(key, JSON.stringify(toItemProgress(progress)));
    } catch (error) {
        throw new ProgressStoreError([
            `could not write ${key}: ${describeError(error)}`,
        ]);
    }
}

export async function updateStreak(now: Date): Promise<StreakState> {
    // Read back first so the increment is applied to what is actually stored,
    // not to a value a concurrent caller already superseded.
    const streak = await readMeta([]);
    const next = advanceStreak(streak, now);

    try {
        await AsyncStorage.setItem(
            META_KEY,
            JSON.stringify({
                schemaVersion: PROGRESS_SCHEMA_VERSION,
                streak: next,
            }),
        );
    } catch (error) {
        throw new ProgressStoreError([
            `could not write ${META_KEY}: ${describeError(error)}`,
        ]);
    }
    return next;
}

export async function clearProgress(): Promise<void> {
    const keys = await listProgressKeys();
    if (keys.length === 0) return;

    try {
        await AsyncStorage.multiRemove(keys);
    } catch (error) {
        throw new ProgressStoreError([
            `could not clear progress: ${describeError(error)}`,
        ]);
    }
}
