import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { User } from "@eventpro/shared";
import { theme } from "../theme";

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
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        contentContainerStyle={users.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.mutedForeground }]}>No users.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color={theme.colors.primary} />}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Text style={[styles.name, { color: theme.colors.foreground }]}>
              {[item.firstName, item.lastName].filter(Boolean).join(" ") || "—"}
            </Text>
            <Text style={[styles.email, { color: theme.colors.mutedForeground }]}>{item.email}</Text>
            <View style={styles.row}>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Role: {item.role}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>Status: {item.status ?? "—"}</Text>
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
  list: { padding: theme.spacing.lg },
  emptyList: { flexGrow: 1, padding: theme.spacing.lg },
  empty: { textAlign: "center", marginTop: 24 },
  card: { padding: 16, borderRadius: theme.radius.lg, marginBottom: 12, borderWidth: 1 },
  name: { fontSize: 17, fontWeight: "600" },
  email: { fontSize: 14, marginTop: 4 },
  row: { flexDirection: "row", marginTop: 6, gap: 12 },
  meta: { fontSize: 13 },
});
