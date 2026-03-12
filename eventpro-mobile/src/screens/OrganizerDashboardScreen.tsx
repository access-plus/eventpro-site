import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";

export function OrganizerDashboardScreen({ navigation }: { navigation: any }) {
  const { api, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    api
      .getOrganizerEvents()
      .then((list) => {
        if (!cancelled) setEvents(list);
      })
      .catch(() => {
        if (!cancelled) Alert.alert("Error", "Could not load events");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api]);

  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  if (!isOrganizer) {
    return (
      <View style={styles.centered}>
        <Text style={styles.message}>Organizer access required. Use the web app to create events.</Text>
      </View>
    );
  }

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
        data={events}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.empty}>No events yet. Create events in the web app.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("OrganizerEventDetail", { eventId: item.id })}
          >
            <Text style={styles.eventName}>{item.name}</Text>
            <Text style={styles.eventMeta}>
              {item.status ?? "PUBLISHED"} • {item.startTime ? new Date(item.startTime).toLocaleDateString() : ""}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  message: { textAlign: "center", color: "#666", padding: 24 },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 },
  eventName: { fontSize: 17, fontWeight: "600" },
  eventMeta: { fontSize: 13, color: "#666", marginTop: 4 },
});
