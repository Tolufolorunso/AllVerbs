import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { Spinner } from "@/components/ui/spinner";
import { VerbListItem } from "@/components/verb-list-item";
import { getAllVerbs } from "@/data/loader";
import { CEFR_LEVELS, type CefrLevel, type Verb } from "@/data/types";
import { useTheme } from "@/hooks/use-theme";
import { useVerbMastery } from "@/hooks/use-mastery";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { SectionList, View } from "react-native";

interface VerbSection {
    title: CefrLevel;
    data: Verb[];
}

type LoadState =
    | { status: "loading" }
    | { status: "ready"; verbs: Verb[] }
    | { status: "error"; message: string };

function useVerbs(): LoadState {
    const [state, setState] = useState<LoadState>({ status: "loading" });

    useEffect(() => {
        let active = true;
        getAllVerbs()
            .then((verbs) => {
                if (active) setState({ status: "ready", verbs });
            })
            .catch((error: unknown) => {
                if (!active) return;
                setState({
                    status: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Could not load the verb library.",
                });
            });
        return () => {
            active = false;
        };
    }, []);

    return state;
}

export default function BrowseScreen() {
    const { colors, spacing } = useTheme();
    const state = useVerbs();
    const masteryFor = useVerbMastery();
    const [query, setQuery] = useState("");

    const isSearching = query.trim() !== "";

    const sections = useMemo<VerbSection[]>(() => {
        if (state.status !== "ready") return [];
        const needle = query.trim().toLowerCase();
        const matched = needle
            ? state.verbs.filter((verb) =>
                  verb.infinitive.toLowerCase().includes(needle),
              )
            : state.verbs;
        return CEFR_LEVELS.map((level) => ({
            title: level,
            data: matched.filter((verb) => verb.cefrLevel === level),
        }));
    }, [state, query]);

    if (state.status === "loading") {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.background,
                }}
            >
                <Spinner />
            </View>
        );
    }

    if (state.status === "error") {
        return (
            <View
                style={{
                    flex: 1,
                    alignItems: "center",
                    justifyContent: "center",
                    gap: spacing.md,
                    padding: spacing.xl,
                    backgroundColor: colors.background,
                }}
            >
                <Text variant="title" align="center">
                    Verb library unavailable
                </Text>
                <Text variant="body" color="muted" align="center">
                    {state.message}
                </Text>
            </View>
        );
    }

    const hasResults = sections.some((section) => section.data.length > 0);

    return (
        <View style={{ flex: 1, backgroundColor: colors.background }}>
            <View
                style={{
                    paddingHorizontal: spacing.lg,
                    paddingTop: spacing.md,
                    paddingBottom: spacing.sm,
                }}
            >
                <Input
                    label="Search verbs"
                    value={query}
                    onChangeText={setQuery}
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="search"
                />
            </View>
            {isSearching && !hasResults ? (
                <EmptyState
                    title="No verbs found"
                    message={`Nothing in the library matches "${query.trim()}".`}
                />
            ) : (
                <SectionList
                    sections={sections}
                    keyExtractor={(verb) => verb.id}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{
                        paddingHorizontal: spacing.lg,
                        paddingBottom: spacing.xl,
                        gap: spacing.sm,
                    }}
                    renderSectionHeader={({ section }) => (
                        <Text variant="title" accessibilityRole="header">
                            {section.title}
                        </Text>
                    )}
                    renderSectionFooter={({ section }) =>
                        section.data.length === 0 && !isSearching ? (
                            <Text variant="caption" color="faint">
                                No {section.title}-level verbs yet.
                            </Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <VerbListItem
                            verb={item}
                            mastery={masteryFor(item.id)}
                            onPress={() =>
                                router.push({
                                    pathname: "/verb/[id]",
                                    params: { id: item.id },
                                })
                            }
                        />
                    )}
                />
            )}
        </View>
    );
}
