import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../contexts/ThemeContext";
import type { Theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

type OrderDetailScreenParams = {
  orderId: string;
  eventName?: string;
};

export function OrderDetailScreen({ route }: { route: { params: OrderDetailScreenParams } }) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const { orderId, eventName } = route.params ?? {};

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.qrArea, { backgroundColor: theme.colors.muted }]}>
          <Ionicons name="qr-code-outline" size={96} color={theme.colors.mutedForeground} />
          <Text style={[styles.qrPlaceholder, { color: theme.colors.mutedForeground }]}>QR code placeholder</Text>
          <Text style={[styles.qrHint, { color: theme.colors.mutedForeground }]}>Show at venue</Text>
        </View>
        {eventName ? (
          <Text style={[styles.eventName, { color: theme.colors.foreground }]} numberOfLines={2}>{eventName}</Text>
        ) : null}
        <Text style={[styles.orderId, { color: theme.colors.mutedForeground }]}>
          Order #{orderId?.slice(0, 8) ?? "—"}
        </Text>
      </View>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, padding: theme.spacing.md, justifyContent: "center", alignItems: "center" },
    card: {
      width: "100%",
      maxWidth: 340,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
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
  });
}
