import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import {
    Pressable,
    StyleSheet,
    type PressableProps,
    type StyleProp,
    type ViewStyle,
} from "react-native";

export type ButtonVariant = "primary" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps extends Omit<PressableProps, "style" | "children"> {
    title: string;
    variant?: ButtonVariant;
    size?: ButtonSize;
    block?: boolean;
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
}

export function Button({
    title,
    variant = "primary",
    size = "md",
    block = false,
    loading = false,
    disabled = false,
    style,
    ...rest
}: ButtonProps) {
    const { colors, radius, spacing, font } = useTheme();
    const isPrimary = variant === "primary";
    const isDisabled = disabled || loading;

    const padV = size === "sm" ? spacing.sm : size === "lg" ? spacing.lg : spacing.md;
    const padH = size === "sm" ? spacing.lg : spacing.xl;
    const textSize = size === "sm" ? font.size.sm : size === "lg" ? font.size.md : font.size.base;
    const background = isPrimary ? colors.accent : colors.surfaceAlt;
    const foreground = isPrimary ? colors.accentInk : colors.text;

    return (
        <Pressable
            {...rest}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            accessibilityState={{ disabled: isDisabled, busy: loading }}
            style={({ pressed }) => [
                {
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.sm,
                    alignSelf: block ? "stretch" : "flex-start",
                    backgroundColor: background,
                    borderRadius: radius.pill,
                    borderWidth: isPrimary ? 0 : StyleSheet.hairlineWidth,
                    borderColor: isPrimary ? colors.accent : colors.border,
                    paddingVertical: padV,
                    paddingHorizontal: padH,
                    opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
                },
                style,
            ]}
        >
            {loading ? <Spinner color={foreground} /> : null}
            <Text
                variant="body"
                style={{ color: foreground, fontSize: textSize, fontWeight: font.weight.semibold }}
            >
                {title}
            </Text>
        </Pressable>
    );
}
