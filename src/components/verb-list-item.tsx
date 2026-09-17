import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { Verb } from "@/data/types";
import {
    MASTERY_LABEL,
    MASTERY_TONE,
    type MasteryState,
} from "@/hooks/use-mastery";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, View } from "react-native";

export interface VerbListItemProps {
    verb: Verb;
    mastery: MasteryState;
    onPress: () => void;
    // Why this row matched a search, replacing the default first-sense caption.
    snippet?: string;
}

export function VerbListItem({
    verb,
    mastery,
    onPress,
    snippet,
}: VerbListItemProps) {
    const { spacing } = useTheme();
    const caption = snippet ?? verb.senses[0]?.definition;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${verb.infinitive}, ${verb.cefrLevel}, ${MASTERY_LABEL[mastery]}${snippet ? `, ${snippet}` : ""}`}
            accessibilityHint="Opens the full verb page"
            style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
        >
            <Card style={{ gap: spacing.sm, minHeight: 44 }}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: spacing.sm,
                    }}
                >
                    <Text variant="title" style={{ flexShrink: 1 }}>
                        {verb.infinitive}
                    </Text>
                    <Badge level={verb.cefrLevel} style={{ alignSelf: "center" }} />
                    <Badge
                        tone={MASTERY_TONE[mastery]}
                        label={MASTERY_LABEL[mastery]}
                        style={{ alignSelf: "center" }}
                    />
                </View>
                <Text variant="caption" color="muted" numberOfLines={2}>
                    {caption}
                </Text>
            </Card>
        </Pressable>
    );
}
