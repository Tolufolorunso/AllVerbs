export type CefrLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type Scheme = "light" | "dark";

export interface Colors {
    background: string;
    surface: string;
    surfaceAlt: string;
    border: string;
    borderStrong: string;
    text: string;
    textMuted: string;
    textFaint: string;
    accent: string;
    accentAlt: string;
    accentInk: string;
    accentSoft: string;
    known: string;
    learning: string;
    wrong: string;
    knownSoft: string;
    learningSoft: string;
    wrongSoft: string;
    cefr: Record<CefrLevel, string>;
    badgeInk: string;
}

export interface Spacing {
    xs: number;
    sm: number;
    md: number;
    lg: number;
    xl: number;
    xxl: number;
    xxxl: number;
}

export interface Radius {
    sm: number;
    md: number;
    lg: number;
    pill: number;
}

export interface Font {
    // Platform system sans by default; reserved for a bundled Inter later.
    family: string;
    size: {
        xs: number;
        sm: number;
        base: number;
        md: number;
        lg: number;
        xl: number;
        xxl: number;
    };
    weight: {
        medium: "500";
        semibold: "600";
        bold: "700";
    };
}

export interface Shadow {
    shadowColor: string;
    shadowOffset: { width: number; height: number };
    shadowOpacity: number;
    shadowRadius: number;
    elevation: number;
}

export interface Shadows {
    sm: Shadow;
    md: Shadow;
}

export interface Theme {
    scheme: Scheme;
    isDark: boolean;
    colors: Colors;
    spacing: Spacing;
    radius: Radius;
    font: Font;
    shadows: Shadows;
}

export const spacing: Spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32,
    xxxl: 48,
};

export const radius: Radius = { sm: 8, md: 14, lg: 20, pill: 999 };

export const font: Font = {
    family: "",
    size: { xs: 12, sm: 13, base: 15, md: 17, lg: 20, xl: 26, xxl: 34 },
    weight: { medium: "500", semibold: "600", bold: "700" },
};

export const shadows: Shadows = {
    sm: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 2,
    },
    md: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.4,
        shadowRadius: 15,
        elevation: 6,
    },
};

// CEFR chips stay bright in both schemes and always use the dark badgeInk.
const cefr: Record<CefrLevel, string> = {
    A1: "#38bdf8",
    A2: "#34d399",
    B1: "#fbbf24",
    B2: "#fb923c",
    C1: "#f472b6",
    C2: "#a78bfa",
};

export const darkColors: Colors = {
    background: "#0b0e14",
    surface: "#141922",
    surfaceAlt: "#1b2130",
    border: "#232b3a",
    borderStrong: "#2f3a4d",
    text: "#eef2f8",
    textMuted: "#9aa6b8",
    textFaint: "#5c6879",
    accent: "#6d5efc",
    accentAlt: "#8b5cf6",
    accentInk: "#ffffff",
    accentSoft: "rgba(109,94,252,0.16)",
    known: "#34d399",
    learning: "#fbbf24",
    wrong: "#f87171",
    knownSoft: "rgba(52,211,153,0.15)",
    learningSoft: "rgba(251,191,36,0.15)",
    wrongSoft: "rgba(248,113,113,0.15)",
    cefr,
    badgeInk: "#08111f",
};

export const lightColors: Colors = {
    background: "#f6f7f9",
    surface: "#ffffff",
    surfaceAlt: "#eef1f5",
    border: "#e3e7ee",
    borderStrong: "#cdd5e0",
    text: "#0b0e14",
    textMuted: "#59636f",
    textFaint: "#8a94a3",
    accent: "#5b48ef",
    accentAlt: "#7c4fe0",
    accentInk: "#ffffff",
    accentSoft: "rgba(91,72,239,0.12)",
    known: "#12a06a",
    learning: "#c2760a",
    wrong: "#d92d20",
    knownSoft: "rgba(18,160,106,0.14)",
    learningSoft: "rgba(194,118,10,0.14)",
    wrongSoft: "rgba(217,45,32,0.12)",
    cefr,
    badgeInk: "#08111f",
};

export const darkTheme: Theme = {
    scheme: "dark",
    isDark: true,
    colors: darkColors,
    spacing,
    radius,
    font,
    shadows,
};

export const lightTheme: Theme = {
    scheme: "light",
    isDark: false,
    colors: lightColors,
    spacing,
    radius,
    font,
    shadows,
};
