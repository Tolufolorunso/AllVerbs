import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { StudyItemRow } from "@/components/study-item-row";
import { VerbFormsTable } from "@/components/verb-forms-table";
import { getVerbById } from "@/data/loader";
import type { Verb } from "@/data/types";
import { useSpeech, type SpeechStatus } from "@/hooks/use-speech";
import { useTheme } from "@/hooks/use-theme";
import {
    MASTERY_LABEL,
    MASTERY_TONE,
    useStudyItemMastery,
    useVerbMastery,
} from "@/hooks/use-mastery";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";

type LoadState =
    | { status: "loading" }
    | { status: "ready"; verb: Verb }
    | { status: "notFound" }
    | { status: "error"; message: string };

type LoadResult =
    | { id: string; kind: "ready"; verb: Verb }
    | { id: string; kind: "notFound" }
    | { id: string; kind: "error"; message: string };

// useLocalSearchParams yields a string, an array, or undefined, so collapse it
// before lookup instead of indexing it directly.
function firstParam(value: string | string[] | undefined): string {
    if (Array.isArray(value)) return (value[0] ?? "").trim();
    return (value ?? "").trim();
}

function useVerb(id: string): LoadState {
    const [result, setResult] = useState<LoadResult | null>(null);

    useEffect(() => {
        if (id === "") return;
        let active = true;
        getVerbById(id)
            .then((verb) => {
                if (active) {
                    setResult(
                        verb
                            ? { id, kind: "ready", verb }
                            : { id, kind: "notFound" },
                    );
                }
            })
            .catch((error: unknown) => {
                if (!active) return;
                setResult({
                    id,
                    kind: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Could not load this verb.",
                });
            });
        return () => {
            active = false;
        };
    }, [id]);

    // Loading is derived, not stored, so a changed param never shows the
    // previous verb's content while the new one is in flight.
    if (id === "") return { status: "notFound" };
    if (!result || result.id !== id) return { status: "loading" };
    if (result.kind === "ready") return { status: "ready", verb: result.verb };
    if (result.kind === "notFound") return { status: "notFound" };
    return { status: "error", message: result.message };
}

interface SpeakControlProps {
    status: SpeechStatus;
    onPress: () => void;
}

function SpeakControl({ status, onPress }: SpeakControlProps) {
    const { colors, spacing, radius, font } = useTheme();
    const isSpeaking = status === "speaking";
    const disabled = status === "unavailable";

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={isSpeaking ? "Stop pronunciation" : "Hear pronunciation"}
            accessibilityState={{ disabled, busy: isSpeaking }}
            style={({ pressed }) => [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.sm,
                    alignSelf: "flex-start",
                    minHeight: 44,
                    paddingHorizontal: spacing.lg,
                    paddingVertical: spacing.md,
                    borderRadius: radius.pill,
                    borderWidth: 1,
                    borderColor: colors.border,
                    backgroundColor: isSpeaking ? colors.accentSoft : colors.surfaceAlt,
                    opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
                },
            ]}
        >
            <Text
                variant="body"
                style={{
                    color: isSpeaking ? colors.accent : colors.text,
                    fontWeight: font.weight.semibold,
                }}
            >
                {isSpeaking ? "Stop" : "Hear it"}
            </Text>
        </Pressable>
    );
}

interface ChipRowProps {
    label: string;
    words: string[];
}

function ChipRow({ label, words }: ChipRowProps) {
    const { spacing } = useTheme();
    return (
        <View style={{ gap: spacing.xs }}>
            <Text variant="caption" color="muted">
                {label}
            </Text>
            <View
                style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    gap: spacing.sm,
                }}
            >
                {words.map((word) => (
                    <Badge key={word} label={word} />
                ))}
            </View>
        </View>
    );
}

export default function VerbDetailScreen() {
    const { colors, spacing } = useTheme();
    const id = firstParam(useLocalSearchParams<{ id: string | string[] }>().id);
    const state = useVerb(id);
    const masteryFor = useVerbMastery();
    const studyItemMasteryFor = useStudyItemMastery();
    const speech = useSpeech();

    const title = state.status === "ready" ? state.verb.infinitive : "Verb";

    if (state.status === "loading") {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.background,
                }}
            >
                <Stack.Screen options={{ title }} />
                <Spinner />
            </View>
        );
    }

    if (state.status === "error") {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.md,
                    padding: spacing.xl,
                    backgroundColor: colors.background,
                }}
            >
                <Stack.Screen options={{ title }} />
                <Text variant="title" align="center">
                    Verb unavailable
                </Text>
                <Text variant="body" color="muted" align="center">
                    {state.message}
                </Text>
            </View>
        );
    }

    if (state.status === "notFound") {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.md,
                    padding: spacing.xl,
                    backgroundColor: colors.background,
                }}
            >
                <Stack.Screen options={{ title }} />
                <Text variant="title" align="center">
                    Verb not found
                </Text>
                <Text variant="body" color="muted" align="center">
                    {id === ""
                        ? "No verb was requested."
                        : `"${id}" is not in the verb library.`}
                </Text>
                <Button
                    title="Browse all verbs"
                    variant="ghost"
                    onPress={() => router.replace("/browse")}
                />
            </View>
        );
    }

    const { verb } = state;
    const mastery = masteryFor(verb.id);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <Stack.Screen options={{ title }} />
            <ScrollView
                contentContainerStyle={{
                    gap: spacing.lg,
                    padding: spacing.lg,
                    paddingBottom: spacing.xxxl,
                }}
            >
                <View style={{ gap: spacing.sm }}>
                    <Text variant="heading" accessibilityRole="header">
                        {verb.infinitive}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: spacing.sm,
                            flexWrap: "wrap",
                        }}
                    >
                        <Badge level={verb.cefrLevel} />
                        <Badge
                            label={MASTERY_LABEL[mastery]}
                            tone={MASTERY_TONE[mastery]}
                        />
                        {verb.phonetic ? (
                            <Text
                                variant="body"
                                color="muted"
                                accessibilityLabel={`Pronounced ${verb.phonetic}`}
                            >
                                {verb.phonetic}
                            </Text>
                        ) : null}
                    </View>
                    <SpeakControl
                        status={speech.status}
                        onPress={() => speech.speak(verb.audioText)}
                    />
                    {speech.status === "unavailable" ? (
                        <Text variant="caption" color="muted">
                            Audio is not available on this device.
                        </Text>
                    ) : null}
                </View>

                <VerbFormsTable forms={verb.forms} />

                {verb.senses.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                        <Text variant="title" accessibilityRole="header">
                            Senses
                        </Text>
                        {verb.senses.map((sense) => (
                            <StudyItemRow
                                key={sense.id}
                                level={sense.cefrLevel}
                                body={sense.definition}
                                examples={sense.examples}
                                mastery={studyItemMasteryFor(sense.id)}
                            />
                        ))}
                    </View>
                ) : null}
                {verb.phrasalVerbs.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                        <Text variant="title" accessibilityRole="header">
                            Phrasal verbs
                        </Text>
                        {verb.phrasalVerbs.map((item) => (
                            <StudyItemRow
                                key={item.id}
                                title={item.phrase}
                                level={item.cefrLevel}
                                body={item.meaning}
                                examples={[item.example]}
                                mastery={studyItemMasteryFor(item.id)}
                                note={item.particleNote}
                            />
                        ))}
                    </View>
                ) : null}

                {verb.collocations.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                        <Text variant="title" accessibilityRole="header">
                            Collocations
                        </Text>
                        {verb.collocations.map((item) => (
                            <StudyItemRow
                                key={item.id}
                                title={item.text}
                                level={item.cefrLevel}
                                body={item.gloss}
                                examples={[item.example]}
                                mastery={studyItemMasteryFor(item.id)}
                            />
                        ))}
                    </View>
                ) : null}

                {verb.synonyms.length > 0 || verb.antonyms.length > 0 ? (
                    <View style={{ gap: spacing.sm }}>
                        <Text variant="title" accessibilityRole="header">
                            Related words
                        </Text>
                        {verb.synonyms.length > 0 ? (
                            <ChipRow label="Synonyms" words={verb.synonyms} />
                        ) : null}
                        {verb.antonyms.length > 0 ? (
                            <ChipRow label="Antonyms" words={verb.antonyms} />
                        ) : null}
                    </View>
                ) : null}
            </ScrollView>
        </View>
    );
}
