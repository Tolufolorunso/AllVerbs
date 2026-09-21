import { QuizOption, type QuizOptionResult } from "@/components/quiz-option";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useQueueSession } from "@/hooks/use-queue-session";
import { useTheme } from "@/hooks/use-theme";
import {
    buildExercise,
    buildExercisePool,
    type ExerciseOption,
    type QuizExercise,
} from "@/srs/exercise";
import type { ReviewGrade } from "@/srs/schedule";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import { ScrollView, View } from "react-native";

function firstParam(value: string | string[] | undefined): string | undefined {
    if (Array.isArray(value)) return value[0]?.trim() || undefined;
    return value?.trim() || undefined;
}

// A quiz has an objective answer, so it has no basis for the self-assessed grades:
// a right answer passes, a wrong one comes back at interval zero.
function gradeFor(correct: boolean): ReviewGrade {
    return correct ? "good" : "again";
}

function optionResult(
    option: ExerciseOption,
    exercise: QuizExercise,
    chosenOptionId: string | null,
): QuizOptionResult {
    if (chosenOptionId === null) return "idle";
    if (option.id === exercise.correctOptionId) return "correct";
    if (option.id === chosenOptionId) return "wrong";
    return "muted";
}

export default function QuizScreen() {
    const { colors, spacing } = useTheme();
    const verbId = firstParam(
        useLocalSearchParams<{ verbId: string | string[] }>().verbId,
    );
    const { state, busy, grade, restart } = useQueueSession({ verbId });

    // Which option the learner picked, and for which card. Keyed by position so
    // advancing the card clears the answer by itself; restart clears it explicitly
    // because a restart returns the position to zero.
    const [answer, setAnswer] = useState<{
        index: number;
        optionId: string;
    } | null>(null);
    const [gradeError, setGradeError] = useState<string | null>(null);

    // The snapshot hands back stable references for the current card and the loaded
    // library, so the pool and the exercise are built once per card rather than on
    // every render.
    const item = state.status === "active" ? state.item : null;
    const library = state.status === "active" ? state.library : null;

    // Latching the scope name is what keeps the header from falling back to the
    // generic title on the complete and error screens of a verb-scoped session
    // after the active state is gone. Adjusted during render rather than in an
    // effect, which is the supported way to hold a value derived from a prop.
    const [scopeName, setScopeName] = useState<string | null>(null);
    const resolvedScope =
        verbId && library
            ? (library.find((verb) => verb.id === verbId)?.infinitive ?? null)
            : null;
    if (resolvedScope && resolvedScope !== scopeName) {
        setScopeName(resolvedScope);
    }
    const pool = useMemo(
        () => (library ? buildExercisePool(library) : null),
        [library],
    );
    const exercise = useMemo(
        () => (item && pool ? (buildExercise(item, pool) ?? null) : null),
        [item, pool],
    );

    const chosenOptionId =
        state.status === "active" && answer?.index === state.index
            ? answer.optionId
            : null;
    const answered = chosenOptionId !== null;
    const isCorrect =
        exercise !== null && chosenOptionId === exercise.correctOptionId;

    const onContinue = useCallback(() => {
        if (!answered) return;
        setGradeError(null);
        grade(gradeFor(isCorrect)).catch((cause: unknown) => {
            setGradeError(
                cause instanceof Error
                    ? cause.message
                    : "That answer could not be saved.",
            );
        });
    }, [answered, grade, isCorrect]);

    const onRestart = useCallback(() => {
        setAnswer(null);
        setGradeError(null);
        restart();
    }, [restart]);

    // The title names the scope, not the card on screen, so it holds still while
    // the learner works through a verb's items.
    const title = scopeName ?? "Quiz";

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
                    title="Quiz unavailable"
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
                    title="Nothing to quiz"
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
        const correct = state.reviewed - state.againCount;
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
                    Quiz complete
                </Text>
                <Text variant="body" color="muted" align="center">
                    {`Answered ${state.reviewed} ${
                        state.reviewed === 1 ? "question" : "questions"
                    }, ${correct} correct.`}
                </Text>
                <Button title="Quiz again" block onPress={onRestart} />
                <Button
                    title="Back to Study"
                    variant="ghost"
                    block
                    onPress={() => router.replace("/study")}
                />
            </ScrollView>
        );
    }

    // Step 2's check proves every bundled item builds an exercise, so this is the
    // path for a content gap rather than a learner-visible state in normal use. It
    // refuses rather than recording a grade the question never earned.
    if (!exercise) {
        return (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
                <Stack.Screen options={{ title }} />
                <EmptyState
                    title="Question unavailable"
                    message="This item has no answerable question yet."
                    action={{
                        label: "Back to Study",
                        onPress: () => router.replace("/study"),
                    }}
                />
            </View>
        );
    }

    const correctOption = exercise.options.find(
        (option) => option.id === exercise.correctOptionId,
    );
    const answerLabel = correctOption?.label ?? "";
    const feedback = isCorrect
        ? "Correct."
        : `Not quite. The answer is ${answerLabel}.`;

    return (
        <ScrollView
            contentContainerStyle={{
                flexGrow: 1,
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
                    {`${state.reviewed} answered, ${state.remaining} to go`}
                </Text>
            </View>

            <Card style={{ gap: spacing.sm }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: spacing.sm,
                    }}
                >
                    <Text variant="caption" color="muted" style={{ flexShrink: 1 }}>
                        {exercise.promptLabel}
                    </Text>
                    <Badge level={exercise.level} />
                </View>
                <Text variant="title" accessibilityRole="header">
                    {exercise.prompt}
                </Text>
                {exercise.promptNote ? (
                    <Text variant="body" color="muted">
                        {exercise.promptNote}
                    </Text>
                ) : null}
            </Card>

            <View style={{ gap: spacing.sm }}>
                {exercise.options.map((option) => (
                    <QuizOption
                        key={option.id}
                        label={option.label}
                        result={optionResult(option, exercise, chosenOptionId)}
                        disabled={answered}
                        onPress={() =>
                            setAnswer({ index: state.index, optionId: option.id })
                        }
                    />
                ))}
            </View>

            {answered ? (
                <View
                    style={{ gap: spacing.md }}
                    accessibilityLiveRegion="polite"
                >
                    <Text
                        variant="body"
                        color="muted"
                        style={{ color: isCorrect ? colors.known : colors.wrong }}
                    >
                        {feedback}
                    </Text>
                    {exercise.explanation ? (
                        <Text variant="caption" color="faint">
                            {exercise.explanation}
                        </Text>
                    ) : null}
                    <Button
                        title="Continue"
                        block
                        loading={busy}
                        disabled={busy}
                        onPress={onContinue}
                    />
                </View>
            ) : (
                <Text variant="caption" color="faint" align="center">
                    Choose the answer that fits.
                </Text>
            )}

            {gradeError ? (
                <Text variant="caption" color="muted" align="center">
                    {gradeError}
                </Text>
            ) : null}
        </ScrollView>
    );
}
