// One answerable option in a quiz. Presentational: it takes a label, the state to
// render it in, and a press handler, and owns no session state. The answered states
// carry a text badge as well as colour, so the result never depends on seeing the
// difference between green and red.
//
// The surface comes from `Card` rather than a restated recipe, so a theme change to
// the shared surface reaches this component too.

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import { Pressable } from "react-native";

export type QuizOptionResult = "idle" | "correct" | "wrong" | "muted";

export interface QuizOptionProps {
    label: string;
    result?: QuizOptionResult;
    disabled?: boolean;
    onPress: () => void;
}

export function QuizOption({
    label,
    result = "idle",
    disabled = false,
    onPress,
}: QuizOptionProps) {
    const { colors, spacing, font } = useTheme();

    const isCorrect = result === "correct";
    const isWrong = result === "wrong";
    const inert = result !== "idle" || disabled;

    const border = isCorrect
        ? colors.known
        : isWrong
          ? colors.wrong
          : colors.border;
    const background = isCorrect
        ? colors.knownSoft
        : isWrong
          ? colors.wrongSoft
          : colors.surface;
    const foreground = isCorrect
        ? colors.known
        : isWrong
          ? colors.wrong
          : result === "muted"
            ? colors.textFaint
            : colors.text;
    const badge = isCorrect
        ? { tone: "known" as const, label: "Correct" }
        : isWrong
          ? { tone: "wrong" as const, label: "Your answer" }
          : null;

    const accessibilityLabel = isCorrect
        ? `${label}, correct answer`
        : isWrong
          ? `${label}, your answer, incorrect`
          : label;

    return (
        <Pressable
            onPress={onPress}
            disabled={inert}
            accessibilityRole="button"
            accessibilityLabel={accessibilityLabel}
            accessibilityState={{ disabled: inert }}
            style={({ pressed }) => ({
                opacity:
                    result === "muted" ? 0.6 : disabled ? 0.5 : pressed ? 0.85 : 1,
            })}
        >
            <Card
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.sm,
                    minHeight: 48,
                    paddingVertical: spacing.md,
                    paddingHorizontal: spacing.lg,
                    borderColor: border,
                    backgroundColor: background,
                }}
            >
                <Text
                    variant="body"
                    style={{
                        flexShrink: 1,
                        color: foreground,
                        fontWeight:
                            isCorrect || isWrong ? font.weight.semibold : undefined,
                    }}
                >
                    {label}
                </Text>
                {badge ? <Badge tone={badge.tone} label={badge.label} /> : null}
            </Card>
        </Pressable>
    );
}
