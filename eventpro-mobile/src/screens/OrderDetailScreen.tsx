import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import type { Theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";
import { sectionLabel, editorialCard } from "../theme/screenStyles";
import { InstagramStoryTemplate } from "../components/InstagramStoryTemplate";

type OrderDetailScreenParams = {
  orderId: string;
  eventName?: string;
};

export function OrderDetailScreen({ route }: { route: { params: OrderDetailScreenParams } }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { orderId, eventName } = route.params ?? {};
  const [storyOpen, setStoryOpen] = useState(false);

  const title = eventName ?? "Your event";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[sectionLabel(theme), styles.screenTitle]}>Admission</Text>
      <View style={[editorialCard(theme), styles.card]}>
        <View style={[styles.qrArea, { backgroundColor: theme.colors.muted }]}>
          <Ionicons name="qr-code-outline" size={96} color={theme.colors.mutedForeground} />
          <Text style={[styles.qrPlaceholder, { color: theme.colors.mutedForeground }]}>QR code placeholder</Text>
          <Text style={[styles.qrHint, { color: theme.colors.mutedForeground }]}>Show at venue</Text>
        </View>
        <Text style={[styles.eventName, { color: theme.colors.foreground }]} numberOfLines={2}>
          {title}
        </Text>
        <Text style={[styles.orderId, { color: theme.colors.mutedForeground }]}>
          Order #{orderId?.slice(0, 8) ?? "—"}
        </Text>
        <TouchableOpacity
          style={[styles.storyBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => setStoryOpen(true)}
          activeOpacity={0.9}
        >
          <Ionicons name="share-social-outline" size={20} color={theme.colors.primaryForeground} />
          <Text style={[styles.storyBtnText, { color: theme.colors.primaryForeground }]}>Share story template</Text>
        </TouchableOpacity>
      </View>

      <InstagramStoryTemplate
        visible={storyOpen}
        onClose={() => setStoryOpen(false)}
        eventName={title}
        dateLine="June 15, 2024"
        venueLine="The Warehouse District"
      />
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, padding: theme.spacing.md, justifyContent: "center", alignItems: "center" },
    screenTitle: { marginBottom: theme.spacing.md, textAlign: "center", width: "100%" },
    card: {
      width: "100%",
      maxWidth: 340,
      overflow: "hidden",
    },
    qrArea: {
      minHeight: 220,
      justifyContent: "center",
      alignItems: "center",
      padding: theme.spacing.lg,
    },
    qrPlaceholder: { fontSize: 14, marginTop: 12 },
    qrHint: { fontSize: 12, marginTop: 4 },
    eventName: { fontSize: 16, fontWeight: "600", paddingHorizontal: theme.spacing.md, paddingTop: theme.spacing.md },
    orderId: { fontSize: 13, fontFamily: "monospace", paddingHorizontal: theme.spacing.md, paddingVertical: theme.spacing.sm },
    storyBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      marginHorizontal: theme.spacing.md,
      marginBottom: theme.spacing.md,
      paddingVertical: 14,
      borderRadius: theme.radius.full,
    },
    storyBtnText: { fontSize: 15, fontWeight: "700" },
  });
}
