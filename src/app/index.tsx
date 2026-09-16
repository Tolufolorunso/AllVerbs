import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress-bar";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { spacing as scale, type CefrLevel, type Colors } from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";
import { useState, type ReactNode } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

const LEVELS: CefrLevel[] = ["A1", "A2", "B1", "B2", "C1", "C2"];

// Temporary design-system preview. Feature 2 (navigation shell) replaces this route.
export default function DesignSystemPreview() {
  const { colors, scheme, spacing } = useTheme();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | undefined>(undefined);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
      contentContainerStyle={{ padding: spacing.lg, gap: spacing.xl }}
    >
      <View style={{ gap: spacing.xs }}>
        <Text variant="heading">Design System</Text>
        <Text variant="caption" color="muted">
          Temporary preview ({scheme} scheme). Feature 2 replaces this route.
        </Text>
      </View>

      <Section title="Colors">
        <View style={styles.swatchGrid}>
          {colorSwatches(colors).map((swatch) => (
            <View key={swatch.name} style={{ width: 92, gap: spacing.xs }}>
              <View
                style={{
                  height: 40,
                  borderRadius: scale.sm,
                  backgroundColor: swatch.value,
                  borderWidth: StyleSheet.hairlineWidth,
                  borderColor: colors.border,
                }}
              />
              <Text variant="label" color="muted">
                {swatch.name}
              </Text>
            </View>
          ))}
        </View>
      </Section>

      <Section title="Text">
        <View style={{ gap: spacing.sm }}>
          <Text variant="heading">Heading</Text>
          <Text variant="title">Title</Text>
          <Text variant="body">Body - the quick brown fox jumps over the lazy dog.</Text>
          <Text variant="caption" color="muted">
            Caption (muted)
          </Text>
          <Text variant="label" color="faint">
            Label (faint)
          </Text>
          <Text variant="body" color="accent">
            Accent text
          </Text>
        </View>
      </Section>

      <Section title="Buttons">
        <View style={{ gap: spacing.md }}>
          <View style={styles.wrapRow}>
            <Button title="Primary" onPress={() => { }} />
            <Button title="Ghost" variant="ghost" onPress={() => { }} />
            <Button title="Disabled" disabled onPress={() => { }} />
            <Button title="Loading" loading onPress={() => { }} />
          </View>
          <View style={{ ...styles.wrapRow, alignItems: "center" }}>
            <Button title="Small" size="sm" onPress={() => { }} />
            <Button title="Medium" size="md" onPress={() => { }} />
            <Button title="Large" size="lg" onPress={() => { }} />
          </View>
          <Button title="Block button" block onPress={() => { }} />
        </View>
      </Section>

      <Section title="Card + Badge">
        <Card elevated style={{ gap: spacing.md }}>
          <Text variant="title">run</Text>
          <View style={styles.wrapRow}>
            {LEVELS.map((level) => (
              <Badge key={level} level={level} />
            ))}
          </View>
          <View style={styles.wrapRow}>
            <Badge tone="neutral" label="neutral" />
            <Badge tone="accent" label="accent" />
            <Badge tone="known" label="known" />
            <Badge tone="learning" label="learning" />
            <Badge tone="wrong" label="wrong" />
          </View>
        </Card>
      </Section>

      <Section title="Input">
        <View style={{ gap: spacing.md }}>
          <Input
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            error={error}
            hint="Used for a daily study reminder."
          />
          <Button
            title="Validate"
            variant="ghost"
            onPress={() =>
              setError(email.trim().length < 3 ? "Enter at least 3 characters." : undefined)
            }
          />
        </View>
      </Section>

      <Section title="Feedback">
        <View style={{ gap: spacing.lg }}>
          <View style={{ flexDirection: "row", gap: spacing.lg, alignItems: "center" }}>
            <Spinner />
            <Spinner color={colors.known} size="large" />
          </View>
          <View style={{ gap: spacing.sm }}>
            <Text variant="caption" color="muted">
              Progress 65%
            </Text>
            <ProgressBar value={0.65} />
            <ProgressBar value={0.3} color={colors.learning} height={6} />
          </View>
          <EmptyState
            title="No verbs due"
            message="Your next review cards will appear here."
            action={{ label: "Browse verbs", onPress: () => { } }}
          />
        </View>
      </Section>
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const { spacing } = useTheme();
  return (
    <View style={{ gap: spacing.md }}>
      <Text variant="label" color="faint">
        {title.toUpperCase()}
      </Text>
      {children}
    </View>
  );
}

function colorSwatches(colors: Colors): { name: string; value: string }[] {
  const skip = new Set(["cefr", "badgeInk"]);
  return Object.entries(colors)
    .filter(([key, value]) => !skip.has(key) && typeof value === "string")
    .map(([key, value]) => ({ name: key, value: value as string }));
}

const styles = StyleSheet.create({
  swatchGrid: { flexDirection: "row", flexWrap: "wrap", gap: scale.sm },
  wrapRow: { flexDirection: "row", flexWrap: "wrap", gap: scale.sm },
});
