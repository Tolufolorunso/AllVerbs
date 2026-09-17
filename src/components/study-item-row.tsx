import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { CefrLevel } from "@/data/types";
import {
    MASTERY_LABEL,
    MASTERY_TONE,
    type MasteryState,
} from "@/hooks/use-mastery";
import { useTheme } from "@/hooks/use-theme";
import { View } from "react-native";

export interface StudyItemRowProps {
    // Sense rows are untitled; phrasal verbs and collocations show their phrase.
    title?: string;
    level: CefrLevel;
    // Definition, meaning, or gloss, depending on the item kind.
    body: string;
    examples: string[];
    mastery: MasteryState;
    note?: string;
}

export function StudyItemRow({
    title,
    level,
    body,
    examples,
    mastery,
    note,
}: StudyItemRowProps) {
    const { colors, spacing } = useTheme();

    return (
        <Card
            accessible
            accessibilityLabel={title ? `${title}. ${body}` : body}
            style={{ gap: spacing.sm }}
        >
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.sm,
                }}
            >
                {title ? (
                    <Text variant="title" style={{ flexShrink: 1 }}>
                        {title}
                    </Text>
                ) : (
                    <View />
                )}
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                    }}
                >
                    <Badge level={level} />
                    <Badge tone={MASTERY_TONE[mastery]} label={MASTERY_LABEL[mastery]} />
                </View>
            </View>
            <Text variant="body">{body}</Text>
            {examples.map((example) => (
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
            {note ? (
                <Text variant="caption" color="faint">
                    {note}
                </Text>
            ) : null}
        </Card>
    );
}
