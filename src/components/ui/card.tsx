import { useTheme } from "@/hooks/use-theme";
import { StyleSheet, View, type ViewProps } from "react-native";

export interface CardProps extends ViewProps {
    elevated?: boolean;
}

export function Card({ elevated = false, style, ...rest }: CardProps) {
    const { colors, radius, spacing, shadows } = useTheme();
    return (
        <View
            {...rest}
            style={[
                {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    borderWidth: StyleSheet.hairlineWidth,
                    borderRadius: radius.md,
                    padding: spacing.lg,
                },
                elevated && { backgroundColor: colors.surfaceAlt, ...shadows.sm },
                style,
            ]}
        />
    );
}
