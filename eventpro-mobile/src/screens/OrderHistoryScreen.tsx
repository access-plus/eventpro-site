import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Order } from "@eventpro/shared";

function getStatusLabel(status: string) {
  switch (status) {
    case "COMPLETED": return "Confirmed";
    case "PENDING": return "Pending";
    case "CANCELLED": return "Cancelled";
    case "REFUNDED": return "Refunded";
    default: return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED": return "#059669";
    case "PENDING": return "#d97706";
    case "CANCELLED": return "#dc2626";
    case "REFUNDED": return "#6b7280";
    default: return "#6b7280";
  }
}

export function OrderHistoryScreen({ navigation }: { navigation: any }) {
  const { api } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getOrders(1, 50).then(setOrders).catch(() => setOrders([])).finally(() => setLoading(false));
  }, [api]);

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No orders yet.</Text>}
        contentContainerStyle={orders.length === 0 ? styles.emptyList : undefined}
        renderItem={({ item }) => {
          const status = (item as any).status ?? "COMPLETED";
          const dateStr = item.createdAt
            ? new Date(item.createdAt).toLocaleDateString(undefined, { dateStyle: "medium" })
            : "—";
          return (
            <TouchableOpacity style={styles.card} activeOpacity={0.7}>
              <View style={styles.cardRow}>
                <Text style={styles.amount}>${Number((item as any).totalAmount ?? 0).toFixed(2)}</Text>
                <View style={[styles.badge, { backgroundColor: getStatusColor(status) }]}>
                  <Text style={styles.badgeText}>{getStatusLabel(status)}</Text>
                </View>
              </View>
              <Text style={styles.date}>{dateStr}</Text>
              <Text style={styles.id}>Order #{item.id.slice(0, 8)}</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyList: { flexGrow: 1 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: "#eee" },
  cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  id: { fontSize: 12, color: "#888", marginTop: 6 },
  amount: { fontSize: 18, fontWeight: "700" },
  date: { fontSize: 14, color: "#666", marginTop: 4 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
});
