import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import type { ReactNode } from "react";
import { View, type ViewProps } from "react-native";

export interface EmptyStateAction {
    label: string;
    onPress: () => void;
}

export interface EmptyStateProps extends ViewProps {
    title: string;
    message?: string;
    icon?: ReactNode;
    action?: EmptyStateAction;
}

export function EmptyState({
    title,
    message,
    icon,
    action,
    style,
    ...rest
}: EmptyStateProps) {
    const { spacing } = useTheme();
    return (
        <View
            {...rest}
            style={[
                {
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.md,
                    padding: spacing.xl,
                },
                style,
            ]}
        >
            {icon}
            <Text variant="title" align="center">
                {title}
            </Text>
            {message ? (
                <Text variant="body" color="muted" align="center">
                    {message}
                </Text>
            ) : null}
            {action ? (
                <Button title={action.label} onPress={action.onPress} variant="ghost" />
            ) : null}
        </View>
    );
}
