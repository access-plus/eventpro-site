import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { theme } from "../theme";

export function AdminSubscriptionPaymentsScreen() {
  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>Subscription payments</Text>
      <Text style={[styles.desc, { color: theme.colors.mutedForeground }]}>
        Record offline or wire subscription payments here. Stripe subscriptions are recorded automatically. Use the web app to record manual subscription payments.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  desc: { fontSize: 15, lineHeight: 22 },
});
