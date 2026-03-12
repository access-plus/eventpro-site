import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";

export function AdminOverviewScreen({ navigation }: { navigation: any }) {
  const { api, user } = useAuth();
  const [stats, setStats] = useState<{ totalUsers?: number; totalEvents?: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.role !== "ADMIN") return;
    api.getStats().then(setStats).catch(() => setStats(null)).finally(() => setLoading(false));
  }, [api, user?.role]);

  if (user?.role !== "ADMIN") {
    return <View style={styles.centered}><Text style={styles.text}>Admin only.</Text></View>;
  }
  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.stat}>Users: {stats?.totalUsers ?? "—"}</Text>
      <Text style={styles.stat}>Events: {stats?.totalEvents ?? "—"}</Text>
      <TouchableOpacity onPress={() => navigation.navigate("AdminUsers")}>
        <Text style={styles.link}>Users</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("AdminVerification")}>
        <Text style={styles.link}>Verification</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  stat: { marginBottom: 8 },
  text: { color: "#666" },
  link: { marginTop: 12, color: "#0a0a0a" },
});
