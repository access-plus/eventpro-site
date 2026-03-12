import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

export function PrivacyScreen({ navigation }: { navigation: any }) {
  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "18" }]}>
          <Ionicons name="shield-checkmark" size={32} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Privacy Policy</Text>
        <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>
          How we collect, use, and protect your data. Your choices matter.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.primary + "10", borderColor: theme.colors.primary + "30" }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Your choices</Text>
        <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>
          You can control how we communicate with you and use your data.
        </Text>
        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="notifications-outline" size={20} color={theme.colors.primaryForeground} />
          <Text style={[styles.primaryBtnText, { color: theme.colors.primaryForeground }]}>Notification preferences</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.primaryForeground} />
        </TouchableOpacity>
        <Text style={[styles.hint, { color: theme.colors.mutedForeground }]}>
          Turn off marketing emails and set order confirmations and reminders in Settings.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Information we collect</Text>
        <Text style={[styles.paragraph, { color: theme.colors.mutedForeground }]}>
          We collect information you provide when you create an account (name, email, phone), purchase tickets (payment and order details), or organize events. We also collect usage data to improve the service.
        </Text>
      </View>

      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Your rights</Text>
        <Text style={[styles.paragraph, { color: theme.colors.mutedForeground }]}>
          You may have the right to access, correct, or delete your data, or opt out of marketing. Use Notification preferences in Settings to opt out of marketing. For data export or deletion, contact support@accessplus.com.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: 32 },
  header: { alignItems: "center", marginBottom: 24 },
  iconWrap: { width: 64, height: 64, borderRadius: 32, justifyContent: "center", alignItems: "center", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "700", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 15, textAlign: "center", paddingHorizontal: 16 },
  card: {
    padding: theme.spacing.md,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 17, fontWeight: "600", marginBottom: 8 },
  cardDesc: { fontSize: 14, marginBottom: 12 },
  paragraph: { fontSize: 14, lineHeight: 22 },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radius.md,
    marginBottom: 12,
  },
  primaryBtnText: { fontSize: 16, fontWeight: "600" },
  hint: { fontSize: 12 },
});
