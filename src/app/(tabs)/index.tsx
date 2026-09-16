import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function TodayScreen() {
    return (
        <PlaceholderScreen
            title="Today"
            message="Your daily session, streak, CEFR progress ring, and Verb of the Day will live here."
            feature="F12"
            actions={[
                {
                    label: "Open a sample verb",
                    href: { pathname: "/verb/[id]", params: { id: "run" } },
                },
                { label: "Settings", href: "/settings" },
            ]}
        />
    );
}
