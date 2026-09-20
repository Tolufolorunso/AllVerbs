import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { VerbListItem } from "@/components/verb-list-item";
import { getAllVerbs } from "@/data/loader";
import { searchVerbs, MATCH_LABEL, type SearchResult } from "@/data/search";
import { CEFR_LEVELS, type CefrLevel, type Verb } from "@/data/types";
import { useVerbMastery } from "@/hooks/use-mastery";
import { useTheme } from "@/hooks/use-theme";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { FlatList, SectionList, View } from "react-native";

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

// A headword hit needs no explanation; any other kind names where it matched.
function matchSnippet(result: SearchResult): string | undefined {
    if (result.kind === "headword") return undefined;
    return `${MATCH_LABEL[result.kind]}: ${result.text}`;
}

export default function BrowseScreen() {
    const { colors, spacing } = useTheme();
    const state = useVerbs();
    const masteryFor = useVerbMastery();
    const [query, setQuery] = useState("");

    const isSearching = query.trim() !== "";

    // Level browsing never depends on the query: searching switches to the
    // ranked result list, so the sections stay a pure view of the dataset.
    const sections = useMemo<VerbSection[]>(() => {
        if (state.status !== "ready") return [];
        return CEFR_LEVELS.map((level) => ({
            title: level,
            data: state.verbs.filter((verb) => verb.cefrLevel === level),
        }));
    }, [state]);

    const results = useMemo<SearchResult[]>(() => {
        if (state.status !== "ready" || !isSearching) return [];
        return searchVerbs(state.verbs, query);
    }, [state, query, isSearching]);

    const openVerb = (id: string) =>
        router.push({ pathname: "/verb/[id]", params: { id } });

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
            {isSearching ? (
                results.length === 0 ? (
                    <EmptyState
                        title="No verbs found"
                        message={`Nothing in the library matches "${query.trim()}". Search covers headwords, forms, meanings, synonyms, collocations, and phrasal verbs.`}
                    />
                ) : (
                    <FlatList
                        data={results}
                        keyExtractor={(result) => result.verb.id}
                        keyboardShouldPersistTaps="handled"
                        contentContainerStyle={{
                            paddingHorizontal: spacing.lg,
                            paddingBottom: spacing.xl,
                            gap: spacing.sm,
                        }}
                        ListHeaderComponent={
                            <Text
                                variant="caption"
                                color="muted"
                                accessibilityLiveRegion="polite"
                                accessibilityRole="text"
                            >
                                {results.length}{" "}
                                {results.length === 1 ? "result" : "results"}
                            </Text>
                        }
                        renderItem={({ item }) => (
                            <VerbListItem
                                verb={item.verb}
                                mastery={masteryFor(item.verb)}
                                snippet={matchSnippet(item)}
                                onPress={() => openVerb(item.verb.id)}
                            />
                        )}
                    />
                )
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
                        section.data.length === 0 ? (
                            <Text variant="caption" color="faint">
                                No {section.title}-level verbs yet.
                            </Text>
                        ) : null
                    }
                    renderItem={({ item }) => (
                        <VerbListItem
                            verb={item}
                            mastery={masteryFor(item)}
                            onPress={() => openVerb(item.id)}
                        />
                    )}
                />
            )}
        </View>
    );
}
