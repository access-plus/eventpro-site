import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { TicketType } from "@eventpro/shared";

export function EventTicketsScreen({ route }: { route: { params: { eventId: string } }; navigation?: any }) {
  const { api } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getTicketTypes(route.params.eventId);
      setTickets(data ?? []);
    } catch {
      setTickets([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, [route.params.eventId]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ACTIVE": return "#059669";
      case "SOLD_OUT": return "#dc2626";
      case "INACTIVE": return "#6b7280";
      default: return "#6b7280";
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Manage or add ticket types on the web app.</Text>
      <FlatList
        data={tickets}
        keyExtractor={(item) => item.id}
        contentContainerStyle={tickets.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No ticket types yet.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.name}>{item.name}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.badgeText}>{item.status}</Text>
              </View>
            </View>
            <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
            <Text style={styles.meta}>
              Available: {item.availableQuantity ?? 0} / {item.totalQuantity ?? 0}
            </Text>
            {item.description ? (
              <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>
            ) : null}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  hint: { fontSize: 13, color: "#666", padding: 16, paddingBottom: 8 },
  list: { padding: 16, paddingTop: 0 },
  emptyList: { flexGrow: 1, padding: 16 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  name: { fontSize: 17, fontWeight: "600" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
  price: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  meta: { fontSize: 14, color: "#666", marginTop: 4 },
  desc: { fontSize: 13, color: "#888", marginTop: 6 },
});
