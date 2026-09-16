import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import { router, type Href } from "expo-router";
import { View } from "react-native";

export interface PlaceholderAction {
    label: string;
    href: Href;
}

export interface PlaceholderScreenProps {
    title: string;
    message?: string;
    feature?: string;
    actions?: PlaceholderAction[];
}

export function PlaceholderScreen({
    title,
    message,
    feature,
    actions,
}: PlaceholderScreenProps) {
    const { colors, spacing } = useTheme();
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
            {feature ? <Badge tone="accent" label={feature} /> : null}
            <Text variant="title" align="center">
                {title}
            </Text>
            {message ? (
                <Text variant="body" color="muted" align="center">
                    {message}
                </Text>
            ) : null}
            {actions && actions.length > 0 ? (
                <View
                    style={{
                        alignSelf: "stretch",
                        gap: spacing.sm,
                        marginTop: spacing.sm,
                    }}
                >
                    {actions.map((action) => (
                        <Button
                            key={action.label}
                            title={action.label}
                            variant="ghost"
                            block
                            onPress={() => router.push(action.href)}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
}
