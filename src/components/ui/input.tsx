import { Text } from "@/components/ui/text";
import { useTheme } from "@/hooks/use-theme";
import { useState } from "react";
import { TextInput, View, type TextInputProps } from "react-native";

export interface InputProps extends TextInputProps {
    label?: string;
    error?: string;
    hint?: string;
}

export function Input({
    label,
    error,
    hint,
    style,
    onFocus,
    onBlur,
    onChangeText,
    ...rest
}: InputProps) {
    const { colors, radius, spacing, font } = useTheme();
    const [focused, setFocused] = useState(false);
    // Editing clears the current error visual; a changed error prop re-shows it.
    const [edited, setEdited] = useState(false);
    const [prevError, setPrevError] = useState(error);
    if (error !== prevError) {
        setPrevError(error);
        setEdited(false);
    }
    const showError = Boolean(error) && !edited;
    const borderColor = showError ? colors.wrong : focused ? colors.accent : colors.border;

    return (
        <View style={{ gap: spacing.xs }}>
            {label ? (
                <Text variant="label" color="muted">
                    {label}
                </Text>
            ) : null}
            <TextInput
                {...rest}
                onChangeText={(text) => {
                    setEdited(true);
                    onChangeText?.(text);
                }}
                onFocus={(event) => {
                    setFocused(true);
                    onFocus?.(event);
                }}
                onBlur={(event) => {
                    setFocused(false);
                    onBlur?.(event);
                }}
                placeholderTextColor={colors.textFaint}
                accessibilityLabel={label}
                accessibilityHint={hint}
                style={[
                    {
                        backgroundColor: colors.surfaceAlt,
                        borderColor,
                        borderWidth: 1,
                        borderRadius: radius.md,
                        paddingHorizontal: spacing.md,
                        paddingVertical: spacing.md,
                        color: colors.text,
                        fontSize: font.size.base,
                    },
                    style,
                ]}
            />
            {showError ? (
                <Text
                    variant="caption"
                    accessibilityLiveRegion="polite"
                    style={{ color: colors.wrong }}
                >
                    {error}
                </Text>
            ) : hint ? (
                <Text variant="caption" color="faint">
                    {hint}
                </Text>
            ) : null}
        </View>
    );
}
