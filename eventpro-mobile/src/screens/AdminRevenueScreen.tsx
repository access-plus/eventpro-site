import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { RevenueData } from "@eventpro/shared";
import { theme } from "../theme";

export function AdminRevenueScreen() {
  const { api } = useAuth();
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const list = await api.getRevenue("30d");
      setData(Array.isArray(list) ? list : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={data}
        keyExtractor={(item) => item.date}
        contentContainerStyle={data.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.mutedForeground }]}>No revenue data.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} color={theme.colors.primary} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.date, { color: theme.colors.foreground }]}>{item.date}</Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
              Revenue: ${Number(item.revenue).toFixed(2)} · Tickets: {item.ticketsSold}
            </Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: theme.spacing.lg },
  emptyList: { flexGrow: 1, padding: theme.spacing.lg },
  empty: { textAlign: "center", marginTop: 24 },
  card: { padding: 16, borderRadius: theme.radius.lg, marginBottom: 12, borderWidth: 1 },
  date: { fontSize: 17, fontWeight: "600" },
  meta: { fontSize: 14, marginTop: 4 },
});
