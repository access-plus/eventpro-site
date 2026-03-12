import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";
import { theme } from "../theme";
import { canUseAddons } from "../lib/organizerTiers";

export function OrganizerEventDetailScreen({ route, navigation }: { route: { params: { eventId: string } }; navigation: any }) {
  const { api, user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  const showEnhance = canUseAddons(user?.subscriptionTier);

  useEffect(() => {
    api.getEvent(route.params.eventId).then(setEvent).catch(() => setEvent(null)).finally(() => setLoading(false));
  }, [api, route.params.eventId]);

  if (loading) return <View style={[styles.centered, { backgroundColor: theme.colors.background }]}><ActivityIndicator color={theme.colors.primary} /></View>;
  if (!event) return <Text style={[styles.error, { color: theme.colors.mutedForeground }]}>Event not found.</Text>;

  const goToPricing = () => navigation.getParent()?.navigate("Profile", { screen: "Pricing" });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>{event.name}</Text>
      <Text style={[styles.meta, { color: theme.colors.mutedForeground }]}>{event.startTime ? new Date(event.startTime).toLocaleString() : ""}</Text>

      <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("EventTickets", { eventId: event.id })}>
        <Ionicons name="ticket-outline" size={22} color={theme.colors.primary} />
        <Text style={[styles.linkText, { color: theme.colors.primary }]}>Tickets</Text>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
      </TouchableOpacity>

      {showEnhance ? (
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("EventEnhancements", { eventId: event.id })}>
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>Enhancements</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={[styles.linkRow, styles.linkRowLocked, { borderBottomColor: theme.colors.border }]} onPress={goToPricing}>
          <Ionicons name="lock-closed-outline" size={22} color={theme.colors.mutedForeground} />
          <Text style={[styles.linkText, { color: theme.colors.mutedForeground }]}>Enhancements (Pro)</Text>
          <Text style={[styles.linkHint, { color: theme.colors.mutedForeground }]}>Upgrade to add</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate("CheckIn", { eventId: event.id })}>
        <Ionicons name="scan-outline" size={22} color={theme.colors.primaryForeground} />
        <Text style={[styles.buttonText, { color: theme.colors.primaryForeground }]}>Check-in</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { padding: 24 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  meta: { fontSize: 14, marginBottom: 24 },
  linkRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, gap: 12 },
  linkRowLocked: { opacity: 0.9 },
  linkText: { flex: 1, fontSize: 16 },
  linkHint: { fontSize: 12 },
  button: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 20, padding: 16, borderRadius: theme.radius.md, justifyContent: "center" },
  buttonText: { fontWeight: "600", fontSize: 16 },
});
