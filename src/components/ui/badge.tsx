import type { CefrLevel, Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { Text as RNText, View, type ViewProps } from "react-native";

export type BadgeTone = "neutral" | "accent" | "known" | "learning" | "wrong";

export interface BadgeProps extends ViewProps {
    level?: CefrLevel;
    tone?: BadgeTone;
    label?: string;
}

function toneBackground(colors: Colors, tone: BadgeTone): string {
    switch (tone) {
        case "accent":
            return colors.accentSoft;
        case "known":
            return colors.knownSoft;
        case "learning":
            return colors.learningSoft;
        case "wrong":
            return colors.wrongSoft;
        default:
            return colors.surfaceAlt;
    }
}

function toneForeground(colors: Colors, tone: BadgeTone): string {
    switch (tone) {
        case "accent":
            return colors.accent;
        case "known":
            return colors.known;
        case "learning":
            return colors.learning;
        case "wrong":
            return colors.wrong;
        default:
            return colors.textMuted;
    }
}

export function Badge({
    level,
    tone = "neutral",
    label,
    children,
    style,
    ...rest
}: BadgeProps) {
    const { colors, radius, spacing, font } = useTheme();
    const isLevel = level != null;
    const background = isLevel ? colors.cefr[level] : toneBackground(colors, tone);
    const foreground = isLevel ? colors.badgeInk : toneForeground(colors, tone);
    const text = isLevel ? level : label;

    return (
        <View
            {...rest}
            style={[
                {
                    alignSelf: "flex-start",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 30,
                    paddingHorizontal: spacing.sm,
                    paddingVertical: 2,
                    borderRadius: radius.sm,
                    backgroundColor: background,
                },
                style,
            ]}
        >
            {children ??
                (text != null ? (
                    <RNText
                        style={{
                            color: foreground,
                            fontSize: font.size.xs,
                            fontWeight: font.weight.bold,
                        }}
                    >
                        {text}
                    </RNText>
                ) : null)}
        </View>
    );
}
