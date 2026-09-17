import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { VerbForms } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";
import { View } from "react-native";

export interface VerbFormsTableProps {
    forms: VerbForms;
}

const ROWS: { label: string; key: keyof VerbForms }[] = [
    { label: "Base", key: "base" },
    { label: "Past", key: "past" },
    { label: "Past participle", key: "pastParticiple" },
    { label: "-ing", key: "ing" },
    { label: "Third person", key: "thirdPerson" },
];

export function VerbFormsTable({ forms }: VerbFormsTableProps) {
    const { colors, spacing } = useTheme();

    return (
        <Card style={{ gap: spacing.sm }}>
            <View
                style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: spacing.sm,
                }}
            >
                <Text variant="title">Forms</Text>
                <Text variant="caption" color="muted">
                    {forms.regular ? "Regular" : "Irregular"}
                </Text>
            </View>
            <View>
                {ROWS.map(({ label, key }) => (
                    <View
                        key={key}
                        style={{
                            flexDirection: "row",
                            alignItems: "flex-start",
                            gap: spacing.md,
                            paddingVertical: spacing.sm,
                            borderTopWidth: 1,
                            borderTopColor: colors.border,
                        }}
                    >
                        <View style={{ width: 120 }}>
                            <Text variant="caption" color="muted">
                                {label}
                            </Text>
                        </View>
                        <Text variant="body" style={{ flexShrink: 1 }}>
                            {forms[key]}
                        </Text>
                    </View>
                ))}
            </View>
            {forms.notes ? (
                <Text variant="caption" color="faint">
                    {forms.notes}
                </Text>
            ) : null}
        </Card>
    );
}
