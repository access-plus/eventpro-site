import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";

export function OrganizerEventDetailScreen({ route, navigation }: { route: { params: { eventId: string } }; navigation: any }) {
  const { api } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getEvent(route.params.eventId).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [api, route.params.eventId]);

  if (loading) return <View style={styles.centered}><ActivityIndicator /></View>;
  if (!event) return <Text style={styles.error}>Event not found.</Text>;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{event.name}</Text>
      <Text style={styles.meta}>{event.startTime ? new Date(event.startTime).toLocaleString() : ""}</Text>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("EventTickets", { eventId: event.id })}>
        <Text style={styles.linkText}>Tickets</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("EventEnhancements", { eventId: event.id })}>
        <Text style={styles.linkText}>Enhancements</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("CheckIn", { eventId: event.id })}>
        <Text style={styles.buttonText}>Check-in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { padding: 24, color: "#666" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  meta: { fontSize: 14, color: "#666", marginBottom: 24 },
  link: { paddingVertical: 12 },
  linkText: { fontSize: 16 },
  button: { marginTop: 16, backgroundColor: "#0a0a0a", padding: 16, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
