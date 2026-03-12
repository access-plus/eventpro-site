import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { AdminStats } from "@eventpro/shared";
import { theme } from "../theme";

function StatCard({ title, value, sub }: { title: string; value: string; sub?: string }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <Text style={[styles.statTitle, { color: theme.colors.mutedForeground }]}>{title}</Text>
      <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{value}</Text>
      {sub != null && <Text style={[styles.statSub, { color: theme.colors.mutedForeground }]}>{sub}</Text>}
    </View>
  );
}

function formatGrowth(n: number) {
  if (n == null || Number.isNaN(n)) return "—";
  const sign = n >= 0 ? "+" : "";
  return `${sign}${n.toFixed(1)}%`;
}

export function AdminStatsScreen() {
  const { api, user } = useAuth();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch {
      setStats(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    load();
  }, [api, user?.role]);

  if (user?.role !== "ADMIN") {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.forbidden}>Admin only.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!stats) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.forbidden, { color: theme.colors.mutedForeground }]}>Failed to load stats.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} color={theme.colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Platform overview</Text>
      </View>
      <View style={styles.grid}>
        <StatCard title="Total users" value={stats.totalUsers.toLocaleString()} sub={formatGrowth(stats.userGrowth)} />
        <StatCard title="Total events" value={stats.totalEvents.toLocaleString()} sub={formatGrowth(stats.eventGrowth)} />
        <StatCard title="Tickets sold" value={stats.totalTicketsSold.toLocaleString()} sub={formatGrowth(stats.ticketGrowth)} />
        <StatCard
          title="Total revenue"
          value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          sub={formatGrowth(stats.revenueGrowth)}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.lg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  forbidden: { fontSize: 16 },
  header: { marginBottom: 20 },
  title: { fontSize: 20, fontWeight: "700" },
  grid: { gap: 12 },
  statCard: { padding: 16, borderRadius: theme.radius.lg, borderWidth: 1 },
  statTitle: { fontSize: 13 },
  statValue: { fontSize: 22, fontWeight: "700", marginTop: 4 },
  statSub: { fontSize: 12, marginTop: 4 },
});
