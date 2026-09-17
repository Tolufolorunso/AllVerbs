import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { Verb } from "@/data/types";
import type { MasteryState } from "@/hooks/use-verb-mastery";
import { useTheme } from "@/hooks/use-theme";
import { Pressable, View } from "react-native";

export interface VerbListItemProps {
    verb: Verb;
    mastery: MasteryState;
    onPress: () => void;
}

const MASTERY_LABEL: Record<MasteryState, string> = {
    new: "New",
    learning: "Learning",
    known: "Known",
};

const MASTERY_TONE: Record<MasteryState, BadgeTone> = {
    new: "neutral",
    learning: "learning",
    known: "known",
};

export function VerbListItem({ verb, mastery, onPress }: VerbListItemProps) {
    const { spacing } = useTheme();
    const definition = verb.senses[0]?.definition;

    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${verb.infinitive}, ${verb.cefrLevel}, ${MASTERY_LABEL[mastery]}`}
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
                    {definition}
                </Text>
            </Card>
        </Pressable>
    );
}
