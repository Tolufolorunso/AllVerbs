import * as Speech from "expo-speech";
import { useCallback, useEffect, useRef, useState } from "react";
import { Platform } from "react-native";

export type SpeechStatus = "idle" | "speaking" | "unavailable";

// expo-speech delegates to the Web Speech API in the browser, which is not
// guaranteed to exist. Native platforms always have a speech engine.
function isSpeechSupported(): boolean {
    if (Platform.OS !== "web") return true;
    return typeof window !== "undefined" && "speechSynthesis" in window;
}

export interface SpeechController {
    status: SpeechStatus;
    speak: (text: string) => void;
    stop: () => void;
}

export function useSpeech(): SpeechController {
    const [status, setStatus] = useState<SpeechStatus>("idle");
    // Identifies the current utterance so a late callback cannot clear the state
    // of a newer one.
    const tokenRef = useRef(0);
    const speakingRef = useRef(false);

    const stop = useCallback(() => {
        tokenRef.current += 1;
        speakingRef.current = false;
        setStatus((current) => (current === "unavailable" ? current : "idle"));
        void Speech.stop().catch(() => {});
    }, []);

    const speak = useCallback(
        (text: string) => {
            if (!isSpeechSupported()) {
                setStatus("unavailable");
                return;
            }
            // A second tap stops rather than restarting.
            if (speakingRef.current) {
                stop();
                return;
            }

            const token = tokenRef.current + 1;
            tokenRef.current = token;
            speakingRef.current = true;
            const settle = () => {
                if (tokenRef.current === token) {
                    speakingRef.current = false;
                    setStatus("idle");
                }
            };

            try {
                Speech.speak(text, {
                    onStart: () => {
                        if (tokenRef.current === token) setStatus("speaking");
                    },
                    onDone: settle,
                    onStopped: settle,
                    onError: () => {
                        if (tokenRef.current === token) {
                            speakingRef.current = false;
                            setStatus("unavailable");
                        }
                    },
                });
                setStatus("speaking");
            } catch {
                speakingRef.current = false;
                setStatus("unavailable");
            }
        },
        [stop],
    );

    // Audio must not outlive the screen.
    useEffect(() => {
        return () => {
            tokenRef.current += 1;
            speakingRef.current = false;
            void Speech.stop().catch(() => {});
        };
    }, []);

    return { status, speak, stop };
}
