import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";

export function EventsListScreen({ navigation }: { navigation: any }) {
  const { api } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEvents(1, 20)
      .then(setEvents)
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, [api]);

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No events right now.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          >
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.meta}>{item.startTime ? new Date(item.startTime).toLocaleDateString() : ""}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", color: "#666", marginTop: 24 },
  card: { backgroundColor: "#fff", padding: 16, borderRadius: 12, marginBottom: 12 },
  title: { fontSize: 17, fontWeight: "600" },
  meta: { fontSize: 13, color: "#666", marginTop: 4 },
});
