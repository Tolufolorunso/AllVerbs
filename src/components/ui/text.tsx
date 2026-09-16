import { font, type Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import {
    Text as RNText,
    type TextProps as RNTextProps,
    type TextStyle,
} from "react-native";

export type TextVariant = "heading" | "title" | "body" | "caption" | "label";
export type TextColor = "text" | "muted" | "faint" | "accent" | "inverse";

export interface TextProps extends RNTextProps {
    variant?: TextVariant;
    color?: TextColor;
    align?: TextStyle["textAlign"];
    weight?: TextStyle["fontWeight"];
}

const VARIANT_SIZE: Record<TextVariant, keyof typeof font.size> = {
    heading: "xxl",
    title: "lg",
    body: "base",
    caption: "sm",
    label: "xs",
};

const VARIANT_WEIGHT: Record<TextVariant, TextStyle["fontWeight"]> = {
    heading: "700",
    title: "600",
    body: "400",
    caption: "400",
    label: "600",
};

function resolveColor(colors: Colors, color: TextColor): string {
    switch (color) {
        case "muted":
            return colors.textMuted;
        case "faint":
            return colors.textFaint;
        case "accent":
            return colors.accent;
        case "inverse":
            return colors.accentInk;
        default:
            return colors.text;
    }
}

export function Text({
    variant = "body",
    color = "text",
    align,
    weight,
    style,
    ...rest
}: TextProps) {
    const { colors } = useTheme();
    return (
        <RNText
            {...rest}
            style={[
                {
                    color: resolveColor(colors, color),
                    fontSize: font.size[VARIANT_SIZE[variant]],
                    fontWeight: weight ?? VARIANT_WEIGHT[variant],
                    textAlign: align,
                },
                style,
            ]}
        />
    );
}
