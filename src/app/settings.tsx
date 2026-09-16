import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function SettingsScreen() {
    return (
        <PlaceholderScreen
            title="Settings"
            message="Preferences, theme, data reset, and about arrive here."
            feature="F19"
            actions={[
                { label: "Unlock Allverb", href: "/unlock" },
                { label: "Onboarding", href: "/onboarding" },
            ]}
        />
    );
}
