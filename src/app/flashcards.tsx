import { FlashCard } from "@/components/flash-card";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useStudySession } from "@/hooks/use-study-session";
import { useTheme } from "@/hooks/use-theme";
import { GRADE_LABEL, type ReviewGrade } from "@/srs/schedule";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";

const GRADES: ReviewGrade[] = ["again", "hard", "good", "easy"];

function firstParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return value?.trim() || undefined;
}

export default function FlashcardsScreen() {
    const { colors, spacing } = useTheme();
    const verbId = firstParam(
        useLocalSearchParams<{ verbId: string | string[] }>().verbId,
    );
    const { state, busy, reveal, grade, restart } = useStudySession({ verbId });
    const [gradeError, setGradeError] = useState<string | null>(null);

    const onGrade = useCallback(
        (value: ReviewGrade) => {
            setGradeError(null);
            grade(value).catch((cause: unknown) => {
                setGradeError(
                    cause instanceof Error
                        ? cause.message
                        : "That review could not be saved.",
                );
            });
        },
        [grade],
    );

    // A verb-scoped session names the verb once a card is known; the queue-wide one
    // has no single header worth showing.
    const scopeVerb = state.status === "active" ? state.face.verbInfinitive : null;
    const title = scopeVerb ?? "Flashcards";

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
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack.Screen options={{ title }} />
                <EmptyState
                    title="Session unavailable"
                    message={state.message}
                    action={{
                        label: "Back to Study",
                        onPress: () => router.replace("/study"),
                    }}
                />
            </View>
        );
    }

    if (state.status === "empty") {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack.Screen options={{ title }} />
                <EmptyState
                    title="Nothing to review"
                    message="Every item in scope is scheduled for later. Come back when the next review is due, or study a single verb from its page."
                    action={{
                        label: "Back to Study",
                        onPress: () => router.replace("/study"),
                    }}
                />
            </View>
        );
    }

    if (state.status === "complete") {
        return (
            <ScrollView
                contentContainerStyle={{
                    flexGrow: 1,
                    justifyContent: "center",
                    gap: spacing.md,
                    padding: spacing.xl,
                    backgroundColor: colors.background,
                }}
            >
                <Stack.Screen options={{ title }} />
                <Text variant="heading" align="center" accessibilityRole="header">
                    Session complete
                </Text>
                <Text variant="body" color="muted" align="center">
                    {`Reviewed ${state.reviewed} ${state.reviewed === 1 ? "card" : "cards"}${
                        state.againCount > 0
                            ? `, with ${state.againCount} marked Again`
                            : ""
                    }.`}
                </Text>
                <Button title="Study again" block onPress={restart} />
                <Button
                    title="Back to Study"
                    variant="ghost"
                    block
                    onPress={() => router.replace("/study")}
                />
            </ScrollView>
        );
    }

    const reviewedLabel = `${state.reviewed} reviewed, ${state.remaining} to go`;

    return (
        <View
            style={{
                flex: 1,
                gap: spacing.md,
                padding: spacing.lg,
                backgroundColor: colors.background,
            }}
        >
            <Stack.Screen options={{ title }} />
            <View style={{ gap: spacing.xs }}>
                <ProgressBar value={state.progress} />
                <Text
                    variant="caption"
                    color="muted"
                    accessibilityLiveRegion="polite"
                >
                    {reviewedLabel}
                </Text>
            </View>

            <FlashCard
                face={state.face}
                revealed={state.revealed}
                busy={busy}
                onReveal={reveal}
                onSwipeAgain={() => onGrade("again")}
                onSwipeGood={() => onGrade("good")}
            />

            {state.revealed ? (
                <View style={{ gap: spacing.sm }}>
                    <View
                        style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: spacing.sm,
                            justifyContent: "center",
                        }}
                    >
                        {GRADES.map((value) => (
                            <Button
                                key={value}
                                title={GRADE_LABEL[value]}
                                variant={value === "good" ? "primary" : "ghost"}
                                size="sm"
                                disabled={busy}
                                onPress={() => onGrade(value)}
                            />
                        ))}
                    </View>
                    <Text variant="caption" color="faint" align="center">
                        Swipe left to grade Again, right to grade Good.
                    </Text>
                </View>
            ) : (
                <Text variant="caption" color="faint" align="center">
                    Reveal the answer to grade this card.
                </Text>
            )}

            {gradeError ? (
                <Text variant="caption" color="muted" align="center">
                    {gradeError}
                </Text>
            ) : null}
        </View>
    );
}
