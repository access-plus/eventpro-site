import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { EventAddon } from "@eventpro/shared";

export function EventEnhancementsScreen({ route }: { route: { params: { eventId: string } }; navigation?: any }) {
  const { api } = useAuth();
  const [addons, setAddons] = useState<EventAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getEventAddons(route.params.eventId);
      setAddons(Array.isArray(data) ? data : []);
    } catch {
      setAddons([]);
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

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.hint}>Add-ons and merchandise. Add or edit on the web app.</Text>
      <FlatList
        data={addons}
        keyExtractor={(item) => item.id}
        contentContainerStyle={addons.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No add-ons yet.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.price}>${Number(item.price).toFixed(2)}</Text>
            {item.category ? (
              <Text style={styles.meta}>Category: {item.category}</Text>
            ) : null}
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
  name: { fontSize: 17, fontWeight: "600" },
  price: { fontSize: 18, fontWeight: "700", marginTop: 6 },
  meta: { fontSize: 14, color: "#666", marginTop: 4 },
  desc: { fontSize: 13, color: "#888", marginTop: 6 },
});
