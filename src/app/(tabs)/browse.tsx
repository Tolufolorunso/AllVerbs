import { PlaceholderScreen } from "@/components/placeholder-screen";
import { Text } from "@/components/ui/text";
import { getVerbsByLevel } from "@/data/loader";
import { useEffect, useState } from "react";

// Temporary F3 scaffolding: proves the bundled dataset loads and validates inside
// the running app. F4 replaces this screen with the real A1-C2 browser.
type A1LoadState =
    | { status: "loading" }
    | { status: "ready"; count: number }
    | { status: "error"; message: string };

function useA1Verbs(): A1LoadState {
    const [state, setState] = useState<A1LoadState>({ status: "loading" });

    useEffect(() => {
        let active = true;
        getVerbsByLevel("A1")
            .then((verbs) => {
                if (active) setState({ status: "ready", count: verbs.length });
            })
            .catch((error: unknown) => {
                if (!active) return;
                setState({
                    status: "error",
                    message:
                        error instanceof Error
                            ? error.message
                            : "Could not load the verb dataset.",
                });
            });
        return () => {
            active = false;
        };
    }, []);

    return state;
}

export default function BrowseScreen() {
    const a1 = useA1Verbs();

    return (
        <PlaceholderScreen
            title="Browse"
            message="Search and filter the full verb library by CEFR level, form, and topic."
            feature="F4"
            actions={[
                {
                    label: "Open a sample verb",
                    href: { pathname: "/verb/[id]", params: { id: "run" } },
                },
            ]}
        >
            {a1.status === "loading" ? (
                <Text variant="caption" color="muted" align="center">
                    Loading the A1 dataset...
                </Text>
            ) : a1.status === "ready" ? (
                <Text variant="caption" color="muted" align="center">
                    A1 - {a1.count} verbs loaded
                </Text>
            ) : (
                <Text variant="caption" color="muted" align="center">
                    Dataset error: {a1.message}
                </Text>
            )}
        </PlaceholderScreen>
    );
}
