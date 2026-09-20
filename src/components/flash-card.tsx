import { Badge } from "@/components/ui/badge";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import type { StudyCardFace } from "@/srs/card";
import { useCallback, useMemo, useState } from "react";
import {
    Animated,
    PanResponder,
    Pressable,
    StyleSheet,
    View,
} from "react-native";

// How far a drag must travel before it counts as a swipe rather than a tap.
const SWIPE_THRESHOLD = 90;

export interface FlashCardProps {
    face: StudyCardFace;
    revealed: boolean;
    onReveal: () => void;
    // Swipe shortcuts, active only once revealed. Hard and Easy stay buttons.
    onSwipeAgain?: () => void;
    onSwipeGood?: () => void;
    busy?: boolean;
}

export function FlashCard({
    face,
    revealed,
    onReveal,
    onSwipeAgain,
    onSwipeGood,
    busy = false,
}: FlashCardProps) {
    const { colors, spacing, radius, font, shadows } = useTheme();
    // A lazy initializer rather than a ref: the value is stable across renders and
    // reading it during render is what the React Compiler requires.
    const [offset] = useState(() => new Animated.Value(0));

    const swipeEnabled =
        revealed && !busy && (onSwipeAgain !== undefined || onSwipeGood !== undefined);

    const settle = useCallback(() => {
        Animated.spring(offset, {
            toValue: 0,
            useNativeDriver: true,
        }).start();
    }, [offset]);

    const panResponder = useMemo(
        () =>
            PanResponder.create({
                // Only claim the gesture once the card is revealed, so a tap to
                // reveal is never swallowed by the drag handler.
                onMoveShouldSetPanResponder: (_event, gesture) =>
                    swipeEnabled && Math.abs(gesture.dx) > 8,
                onPanResponderMove: (_event, gesture) => {
                    offset.setValue(gesture.dx);
                },
                onPanResponderRelease: (_event, gesture) => {
                    if (gesture.dx <= -SWIPE_THRESHOLD && onSwipeAgain) {
                        onSwipeAgain();
                    } else if (gesture.dx >= SWIPE_THRESHOLD && onSwipeGood) {
                        onSwipeGood();
                    }
                    settle();
                },
                onPanResponderTerminate: settle,
            }),
        [offset, onSwipeAgain, onSwipeGood, settle, swipeEnabled],
    );

    const accessibilityLabel = revealed
        ? `${face.answerLabel}: ${face.answer}`
        : `${face.promptLabel}: ${face.prompt}`;

    return (
        <Animated.View
            {...(swipeEnabled ? panResponder.panHandlers : {})}
            style={[
                {
                    flex: 1,
                    transform: [{ translateX: offset }],
                },
            ]}
        >
            <Pressable
                onPress={revealed ? undefined : onReveal}
                disabled={revealed}
                accessibilityRole="button"
                accessibilityLabel={accessibilityLabel}
                accessibilityHint={
                    revealed ? undefined : "Reveals the answer"
                }
                accessibilityState={{ disabled: revealed }}
                style={({ pressed }) => [
                    {
                        flex: 1,
                        gap: spacing.md,
                        padding: spacing.xl,
                        borderRadius: radius.lg,
                        borderWidth: StyleSheet.hairlineWidth,
                        borderColor: colors.border,
                        backgroundColor: colors.surface,
                        opacity: pressed && !revealed ? 0.9 : 1,
                        ...shadows.md,
                    },
                ]}
            >
                {revealed ? (
                    <View style={{ flex: 1, gap: spacing.md }}>
                        <Text variant="caption" color="muted">
                            {face.promptLabel}
                        </Text>
                        <Text variant="body" color="muted">
                            {face.prompt}
                        </Text>

                        <View style={{ gap: spacing.xs }}>
                            <Text variant="caption" color="muted">
                                {face.answerLabel}
                            </Text>
                            <Text
                                variant="heading"
                                accessibilityRole="header"
                                accessibilityLiveRegion="polite"
                            >
                                {face.answer}
                            </Text>
                        </View>

                        <Text variant="body" color="muted">
                            {face.verbInfinitive}
                        </Text>

                        {face.examples.length > 0 ? (
                            <View style={{ gap: spacing.sm }}>
                                {face.examples.map((example) => (
                                    <Text
                                        key={example}
                                        variant="body"
                                        style={{
                                            color: colors.textMuted,
                                            borderLeftWidth: 2,
                                            borderLeftColor: colors.border,
                                            paddingLeft: spacing.md,
                                        }}
                                    >
                                        {example}
                                    </Text>
                                ))}
                            </View>
                        ) : null}

                        {face.note ? (
                            <Text variant="caption" color="faint">
                                {face.note}
                            </Text>
                        ) : null}
                    </View>
                ) : (
                    <View
                        style={{
                            flex: 1,
                            alignItems: "center",
                            justifyContent: "center",
                            gap: spacing.md,
                        }}
                    >
                        <Text variant="caption" color="muted">
                            {face.promptLabel}
                        </Text>
                        <Text
                            variant="heading"
                            align="center"
                            accessibilityRole="header"
                        >
                            {face.prompt}
                        </Text>
                        <Text
                            variant="caption"
                            color="faint"
                            style={{ fontWeight: font.weight.medium }}
                        >
                            Tap to reveal
                        </Text>
                    </View>
                )}

                <View style={{ flexDirection: "row", gap: spacing.sm }}>
                    <Badge level={face.level} />
                </View>
            </Pressable>
        </Animated.View>
    );
}
