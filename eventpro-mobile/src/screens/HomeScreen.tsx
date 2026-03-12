import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";

export function HomeScreen({ navigation }: { navigation: any }) {
  const { api, user } = useAuth();
  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getEvents(1, 6)
      .then(setFeaturedEvents)
      .catch(() => setFeaturedEvents([]))
      .finally(() => setLoading(false));
  }, [api]);

  const openPricing = () => {
    navigation.getParent()?.navigate("Profile", { screen: "Pricing" });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>EventPro</Text>
        <Text style={styles.heroSubtitle}>
          Discover and book events. Your next experience is here.
        </Text>
        <TouchableOpacity
          style={styles.ctaButton}
          onPress={() => navigation.navigate("EventsList")}
        >
          <Text style={styles.ctaButtonText}>Browse events</Text>
        </TouchableOpacity>
      </View>

      {/* Featured / Trending */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hot events</Text>
          <TouchableOpacity onPress={() => navigation.navigate("EventsList")}>
            <Text style={styles.viewAll}>View all</Text>
          </TouchableOpacity>
        </View>
        {loading ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" />
            <Text style={styles.loadingText}>Loading events…</Text>
          </View>
        ) : featuredEvents.length > 0 ? (
          featuredEvents.slice(0, 6).map((event) => {
            const imageUrl = (event as any).imageUrl ?? (event as any).coverImageUrl;
            const startTime = event.startTime ?? (event as any).startDateTime;
            return (
              <TouchableOpacity
                key={event.id}
                style={styles.eventCard}
                onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
                activeOpacity={0.8}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.eventImage} resizeMode="cover" />
                ) : (
                  <View style={styles.eventImagePlaceholder} />
                )}
                <View style={styles.eventCardBody}>
                  <Text style={styles.eventName} numberOfLines={2}>{event.name}</Text>
                  <Text style={styles.eventDate}>
                    {startTime
                      ? new Date(startTime).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>No events yet</Text>
            <Text style={styles.emptyDesc}>Check back soon for new events.</Text>
            <TouchableOpacity style={styles.emptyButton} onPress={() => navigation.navigate("EventsList")}>
              <Text style={styles.emptyButtonText}>Browse events</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Shortcuts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>More</Text>
        <TouchableOpacity style={styles.linkRow} onPress={() => navigation.navigate("EventsList")}>
          <Text style={styles.linkLabel}>All events</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.linkRow} onPress={openPricing}>
          <Text style={styles.linkLabel}>Pricing</Text>
          <Text style={styles.linkArrow}>→</Text>
        </TouchableOpacity>
        {user && (
          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.getParent()?.navigate("Profile", { screen: "OrderHistory" })}
          >
            <Text style={styles.linkLabel}>My orders</Text>
            <Text style={styles.linkArrow}>→</Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { paddingBottom: 32 },
  hero: {
    paddingVertical: 32,
    paddingHorizontal: 24,
    backgroundColor: "#0f0f0f",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 24,
  },
  heroTitle: { fontSize: 32, fontWeight: "800", color: "#fff", marginBottom: 8 },
  heroSubtitle: { fontSize: 16, color: "rgba(255,255,255,0.85)", marginBottom: 24 },
  ctaButton: {
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  ctaButtonText: { fontSize: 16, fontWeight: "700", color: "#0f0f0f" },
  section: { paddingHorizontal: 16, marginBottom: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  viewAll: { fontSize: 15, color: "#0a0a0a", fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 24 },
  loadingText: { fontSize: 15, color: "#666" },
  eventCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#eee",
  },
  eventImage: { width: "100%", height: 140, backgroundColor: "#eee" },
  eventImagePlaceholder: { width: "100%", height: 140, backgroundColor: "#e5e5e5" },
  eventCardBody: { padding: 14 },
  eventName: { fontSize: 17, fontWeight: "600" },
  eventDate: { fontSize: 13, color: "#666", marginTop: 4 },
  emptyCard: {
    backgroundColor: "#f5f5f5",
    padding: 24,
    borderRadius: 12,
    alignItems: "center",
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  emptyDesc: { fontSize: 14, color: "#666", marginBottom: 16 },
  emptyButton: { paddingVertical: 10, paddingHorizontal: 20, backgroundColor: "#0a0a0a", borderRadius: 8 },
  emptyButtonText: { color: "#fff", fontWeight: "600" },
  linkRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  linkLabel: { fontSize: 16 },
  linkArrow: { fontSize: 16, color: "#666" },
});
