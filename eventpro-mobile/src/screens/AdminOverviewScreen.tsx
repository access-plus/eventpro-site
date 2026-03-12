import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

const ADMIN_CARDS = [
  { title: "Overview", description: "Platform stats: users, events, tickets, revenue", route: "AdminStats" as const },
  { title: "User Management", description: "Manage users, roles, permissions", route: "AdminUsers" as const },
  { title: "Verification (KYC)", description: "Review and approve identity verification", route: "AdminVerification" as const },
  { title: "Events", description: "View all events on the platform", route: "AdminEvents" as const },
  { title: "Event Sales", description: "Tickets sold and revenue per event", route: "AdminEventSales" as const },
  { title: "Revenue", description: "Revenue and tickets sold over time", route: "AdminRevenue" as const },
  { title: "Subscription payments", description: "Record offline subscription payment", route: "AdminSubscriptionPayments" as const },
];

export function AdminOverviewScreen({ navigation }: { navigation: any }) {
  const { user } = useAuth();

  if (user?.role !== "ADMIN") {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.forbidden}>Admin only.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Text style={styles.headerIconText}>🛡</Text>
        </View>
        <View>
          <Text style={[styles.title, { color: theme.colors.primary }]}>Admin Dashboard</Text>
          <Text style={[styles.subtitle, { color: theme.colors.mutedForeground }]}>Welcome, {user?.firstName ?? "Admin"}</Text>
        </View>
      </View>
      <View style={styles.grid}>
        {ADMIN_CARDS.map((card) => (
          <TouchableOpacity
            key={card.route}
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate(card.route)}
            activeOpacity={0.8}
          >
            <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>{card.title}</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>{card.description}</Text>
            <Text style={[styles.cardArrow, { color: theme.colors.primary }]}>→</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg, paddingBottom: 40 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  forbidden: { fontSize: 16, color: theme.colors.mutedForeground },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 24, gap: 12 },
  headerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: theme.colors.primary, justifyContent: "center", alignItems: "center" },
  headerIconText: { fontSize: 24 },
  title: { fontSize: 22, fontWeight: "700" },
  subtitle: { fontSize: 14, marginTop: 2 },
  grid: { gap: 12 },
  card: {
    padding: 16,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
  },
  cardTitle: { fontSize: 17, fontWeight: "600" },
  cardDesc: { fontSize: 13, marginTop: 4 },
  cardArrow: { fontSize: 18, marginTop: 8, fontWeight: "600" },
});
