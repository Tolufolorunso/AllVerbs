import { PlaceholderScreen } from "@/components/placeholder-screen";

export default function StudyScreen() {
    return (
        <PlaceholderScreen
            title="Study"
            message="Start a spaced-repetition session with flashcards and quizzes."
            feature="F11"
            actions={[
                { label: "Flashcards", href: "/flashcards" },
                { label: "Quiz", href: "/quiz" },
            ]}
        />
    );
}
