import { darkTheme, lightTheme, type Theme } from "@/constants/theme";
import { useColorScheme } from "react-native";

// Dark-first: fall back to the dark theme when the system scheme is unset.
export function useTheme(): Theme {
    const scheme = useColorScheme();
    return scheme === "light" ? lightTheme : darkTheme;
}
