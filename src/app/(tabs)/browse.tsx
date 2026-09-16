import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function BrowseScreen() {
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
        />
    );
}
