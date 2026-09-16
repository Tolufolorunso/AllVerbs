import { useTheme } from "@/hooks/use-theme";
import { View, type DimensionValue, type ViewProps } from "react-native";

export interface ProgressBarProps extends ViewProps {
    // Completion fraction, 0 to 1.
    value: number;
    color?: string;
    height?: number;
}

export function ProgressBar({
    value,
    color,
    height = 8,
    style,
    ...rest
}: ProgressBarProps) {
    const { colors, radius } = useTheme();
    const pct = Math.min(1, Math.max(0, value)) * 100;
    const width = `${pct}%` as DimensionValue;

    return (
        <View
            {...rest}
            accessibilityRole="progressbar"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(pct) }}
            style={[
                {
                    height,
                    borderRadius: radius.pill,
                    backgroundColor: colors.surfaceAlt,
                    overflow: "hidden",
                },
                style,
            ]}
        >
            <View
                style={{
                    width,
                    height: "100%",
                    borderRadius: radius.pill,
                    backgroundColor: color ?? colors.accent,
                }}
            />
        </View>
    );
}
