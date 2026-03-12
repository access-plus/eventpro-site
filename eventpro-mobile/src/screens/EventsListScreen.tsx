import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";
import { theme } from "../theme";

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

  if (loading) return <View style={[styles.centered, { backgroundColor: theme.colors.background }]}><ActivityIndicator color={theme.colors.primary} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={[styles.empty, { color: theme.colors.mutedForeground }]}>No events right now.</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          >
            <Text style={[styles.title, { color: theme.colors.foreground }]}>{item.name}</Text>
            <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{item.startTime ? new Date(item.startTime).toLocaleDateString() : ""}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.md },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  empty: { textAlign: "center", marginTop: 24 },
  card: { padding: 16, borderRadius: theme.radius.lg, marginBottom: 12, borderWidth: 1 },
  title: { fontSize: 17, fontWeight: "600" },
  meta: { fontSize: 13, marginTop: 4 },
});
