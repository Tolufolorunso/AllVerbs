import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { PlaceholderScreen } from "@/components/placeholder-screen";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { CEFR_LEVELS } from "@/data/types";
import { useStudyStats } from "@/hooks/use-study-stats";
import { useTheme } from "@/hooks/use-theme";
import { useProgress } from "@/storage/progress-context";
import { useCallback, useState } from "react";
import { ScrollView, View } from "react-native";

const PLACEHOLDER_MESSAGE =
    "Track verbs learned, retention by CEFR level, and streak history.";

interface StatRowProps {
    label: string;
    value: string;
}

function StatRow({ label, value }: StatRowProps) {
    const { colors, spacing } = useTheme();
    return (
        <View
            accessible
            accessibilityLabel={`${label}: ${value}`}
            style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                gap: spacing.md,
            }}
        >
            <Text variant="body" color="muted">
                {label}
            </Text>
            <Text variant="body" style={{ color: colors.text }}>
                {value}
            </Text>
        </View>
    );
}

// TEMPORARY (F13 replaces this screen). F7 needs the stored numbers observable
// before the Today hub and the real dashboard exist, so this readout proves
// streak and stats come from storage. Delete it with the placeholder framing.
function ProgressReadout() {
    const { spacing } = useTheme();
    const { streak } = useProgress();
    const state = useStudyStats();

    if (state.status === "loading") {
        return (
            <View style={{ paddingVertical: spacing.lg }}>
                <Spinner />
            </View>
        );
    }

    if (state.status === "error") {
        return (
            <Text variant="body" color="muted" align="center">
                {state.message}
            </Text>
        );
    }

    const { stats } = state;

    return (
        <View style={{ alignSelf: "stretch", gap: spacing.md }}>
            <Text variant="title" accessibilityRole="header">
                Streak
            </Text>
            <Card style={{ gap: spacing.sm }}>
                <StatRow label="Current" value={String(streak.current)} />
                <StatRow label="Longest" value={String(streak.longest)} />
                <StatRow
                    label="Last study day"
                    value={streak.lastStudyDate ?? "Not studied yet"}
                />
            </Card>

            <Text variant="title" accessibilityRole="header">
                Totals
            </Text>
            <Card style={{ gap: spacing.sm }}>
                <StatRow
                    label="Verbs learned"
                    value={String(stats.verbsLearned)}
                />
                <StatRow
                    label="Items mastered"
                    value={String(stats.itemsMastered)}
                />
            </Card>

            <Text variant="title" accessibilityRole="header">
                By level
            </Text>
            <Card style={{ gap: spacing.sm }}>
                {CEFR_LEVELS.map((level) => {
                    const { learned, total } = stats.perLevelCompletion[level];
                    return (
                        <StatRow
                            key={level}
                            label={level}
                            value={
                                total === 0
                                    ? "No verbs yet"
                                    : `${learned} of ${total} learned`
                            }
                        />
                    );
                })}
            </Card>
        </View>
    );
}

export default function ProgressScreen() {
    const { spacing } = useTheme();
    const { status, error, warnings, resetProgress } = useProgress();
    const [resetError, setResetError] = useState<string | null>(null);
    const [resetting, setResetting] = useState(false);

    const reset = useCallback(async () => {
        setResetting(true);
        setResetError(null);
        try {
            await resetProgress();
        } catch (cause: unknown) {
            setResetError(
                cause instanceof Error
                    ? cause.message
                    : "Progress could not be reset.",
            );
        } finally {
            setResetting(false);
        }
    }, [resetProgress]);

    // Recovery lives here while F7 is the only screen that shows progress: a
    // store this build cannot read must be clearable without reinstalling.
    const resetControl = (
        <View style={{ alignSelf: "stretch", gap: spacing.sm }}>
            <Button
                title="Reset progress"
                variant="ghost"
                block
                loading={resetting}
                onPress={reset}
            />
            {resetError ? (
                <Text variant="caption" color="muted" align="center">
                    {resetError}
                </Text>
            ) : null}
        </View>
    );

    if (status === "loading") {
        return (
            <PlaceholderScreen
                title="Progress"
                message={PLACEHOLDER_MESSAGE}
                feature="F13"
            >
                <Spinner />
            </PlaceholderScreen>
        );
    }

    if (status === "error") {
        return (
            <PlaceholderScreen
                title="Progress"
                message={error ?? "Saved progress could not be read."}
                feature="F13"
            >
                {resetControl}
            </PlaceholderScreen>
        );
    }

    return (
        <ScrollView
            contentContainerStyle={{
                gap: spacing.md,
                padding: spacing.lg,
                paddingBottom: spacing.xxxl,
                alignItems: "center",
            }}
        >
            <Badge tone="accent" label="F13" />
            <Text variant="title" align="center">
                Progress
            </Text>
            <Text variant="body" color="muted" align="center">
                {PLACEHOLDER_MESSAGE}
            </Text>
            {warnings.length > 0 ? (
                <Card style={{ gap: spacing.sm, alignSelf: "stretch" }}>
                    <Text variant="caption" color="muted">
                        Some saved records could not be read and were left
                        untouched:
                    </Text>
                    {warnings.map((warning) => (
                        <Text key={warning} variant="caption" color="faint">
                            {warning}
                        </Text>
                    ))}
                </Card>
            ) : null}
            <ProgressReadout />
            {resetControl}
        </ScrollView>
    );
}
