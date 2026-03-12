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
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={list}
        keyExtractor={(item) => item.id}
        contentContainerStyle={list.length === 0 ? styles.emptyList : styles.list}
        ListEmptyComponent={<Text style={styles.empty}>No pending verifications.</Text>}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => {
          const busy = actingId === item.id;
          const submittedAt = item.submittedAt
            ? new Date(item.submittedAt).toLocaleDateString(undefined, { dateStyle: "medium" })
            : "—";
          return (
            <View style={styles.card}>
              <Text style={styles.email}>{item.email}</Text>
              <Text style={styles.meta}>
                {item.legalEntityType ?? "—"} · {item.addressCity ?? ""}, {item.addressState ?? ""}
              </Text>
              <Text style={styles.date}>Submitted: {submittedAt}</Text>
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[styles.approveBtn, busy && styles.btnDisabled]}
                  onPress={() => handleApprove(item.id)}
                  disabled={busy}
                >
                  <Text style={styles.approveBtnText}>Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.rejectBtn, busy && styles.btnDisabled]}
                  onPress={() => handleReject(item.id)}
                  disabled={busy}
                >
                  <Text style={styles.rejectBtnText}>Reject</Text>
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
  email: { fontSize: 16, fontWeight: "600" },
  meta: { fontSize: 14, color: "#666", marginTop: 4 },
  date: { fontSize: 13, color: "#888", marginTop: 4 },
  actions: { flexDirection: "row", marginTop: 12, gap: 8 },
  approveBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#059669", alignItems: "center" },
  approveBtnText: { fontSize: 14, fontWeight: "600", color: "#fff" },
  rejectBtn: { flex: 1, padding: 10, borderRadius: 8, backgroundColor: "#fee", alignItems: "center" },
  rejectBtnText: { fontSize: 14, fontWeight: "600", color: "#c00" },
  btnDisabled: { opacity: 0.6 },
});
