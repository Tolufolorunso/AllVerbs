import { useTheme } from "@/hooks/use-theme";
import { ActivityIndicator, type ActivityIndicatorProps } from "react-native";

export interface SpinnerProps extends Omit<ActivityIndicatorProps, "color"> {
    color?: string;
}

export function Spinner({ color, ...rest }: SpinnerProps) {
    const { colors } = useTheme();
    return <ActivityIndicator {...rest} color={color ?? colors.accent} />;
}
