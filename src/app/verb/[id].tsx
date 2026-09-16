import { PlaceholderScreen } from "@/components/placeholder-screen";
import { useLocalSearchParams } from "expo-router";

export default function VerbDetailScreen() {
    const { id } = useLocalSearchParams<{ id: string }>();
    return (
        <PlaceholderScreen
            title={id || "Verb"}
            message="Full verb detail arrives here: forms, senses, examples, collocations, phrasal verbs, synonyms, and antonyms."
            feature="F5"
        />
    );
}
