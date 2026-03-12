import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { User } from "@eventpro/shared";

export function AdminUsersScreen() {
  const { api } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const load = async (pageNum = 0) => {
    try {
      const res = await api.getUsersPage(pageNum + 1, 20);
      setUsers(res.content ?? []);
      setTotalPages(res.totalPages ?? 1);
      setPage(res.number ?? 0);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    load(0);
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
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No users.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>
              {[item.firstName, item.lastName].filter(Boolean).join(" ") || "—"}
            </Text>
            <Text style={styles.email}>{item.email}</Text>
            <View style={styles.row}>
              <Text style={styles.meta}>Role: {item.role}</Text>
              <Text style={styles.meta}>Status: {item.status ?? "—"}</Text>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  list: { padding: 16 },
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
  email: { fontSize: 14, color: "#666", marginTop: 4 },
  row: { flexDirection: "row", marginTop: 6, gap: 12 },
  meta: { fontSize: 13, color: "#888" },
});
