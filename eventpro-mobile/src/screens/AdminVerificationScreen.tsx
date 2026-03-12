import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { PendingVerification } from "@eventpro/shared";
import { theme } from "../theme";

export function AdminVerificationScreen() {
  const { api } = useAuth();
  const [list, setList] = useState<PendingVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = async () => {
    try {
      const data = await api.getVerificationPending(50);
      setList(Array.isArray(data) ? data : []);
    } catch {
      setList([]);
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
    load();
  };

  const handleApprove = (submissionId: string) => {
    Alert.alert("Approve", "Approve this verification?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Approve",
        onPress: async () => {
          setActingId(submissionId);
          try {
            await api.approveVerification(submissionId);
            await load();
          } catch (e) {
            Alert.alert("Error", "Failed to approve.");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
  };

  const handleReject = (submissionId: string) => {
    Alert.alert("Reject", "Reject this verification? You can optionally provide a reason on the web app.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Reject",
        style: "destructive",
        onPress: async () => {
          setActingId(submissionId);
          try {
            await api.rejectVerification(submissionId);
            await load();
          } catch (e) {
            Alert.alert("Error", "Failed to reject.");
          } finally {
            setActingId(null);
          }
        },
      },
    ]);
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
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={list.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.mutedForeground }]}>No pending verifications.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} color={theme.colors.primary} />}
        renderItem={({ item }) => {
          const busy = actingId === item.id;
          const submittedAt = item.submittedAt
            ? new Date(item.submittedAt).toLocaleDateString(undefined, { dateStyle: "medium" })
            : "—";
          return (
            <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <Text style={[styles.email, { color: theme.colors.foreground }]}>{item.email}</Text>
              <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>
                {item.legalEntityType ?? "—"} · {item.addressCity ?? ""}, {item.addressState ?? ""}
              </Text>
              <Text style={[styles.date, { color: theme.colors.mutedForeground }]}>Submitted: {submittedAt}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.approveBtn, { backgroundColor: theme.colors.success }, busy && styles.btnDisabled]}
                  onPress={() => handleApprove(item.id)}
                  disabled={busy}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, { backgroundColor: theme.colors.destructive + "20" }, busy && styles.btnDisabled]}
                  onPress={() => handleReject(item.id)}
                  disabled={busy}
                >
                  <Text style={[styles.rejectBtnText, { color: theme.colors.destructive }]}>Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
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
  email: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 14, marginTop: 4 },
  date: { fontSize: 13, marginTop: 4 },
  actions: { flexDirection: "row", marginTop: 12, gap: 8 },
  approveBtn: { flex: 1, padding: 10, borderRadius: theme.radius.md, alignItems: "center" },
  approveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  rejectBtn: { flex: 1, padding: 10, borderRadius: theme.radius.md, alignItems: "center" },
  rejectBtnText: { fontSize: 14, fontWeight: "600" },
  btnDisabled: { opacity: 0.6 },
});
