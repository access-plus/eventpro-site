import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  ImageBackground,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";
import { useTheme } from "../contexts/ThemeContext";
import { EventCard } from "../components/EventCard";
import { lightTheme } from "../theme";

const CATEGORIES = [
  "All",
  "Music",
  "Sports",
  "Technology",
  "Business",
  "Arts",
  "Food & Drink",
  "Health & Wellness",
  "Education",
  "Entertainment",
  "Other",
];

const FEATURES = [
  { icon: "ticket-outline" as const, title: "Easy Ticketing", desc: "Simple and secure ticket purchasing" },
  { icon: "calendar-outline" as const, title: "Event Discovery", desc: "Discover events near you and worldwide" },
  { icon: "shield-checkmark-outline" as const, title: "Secure Platform", desc: "Your data and payments protected" },
  { icon: "flash-outline" as const, title: "Instant Access", desc: "Get tickets instantly on any device" },
];

function getUpcoming(events: Event[], limit: number): Event[] {
  const now = new Date();
  return events
    .filter((e) => {
      const t = e.startTime ?? (e as any).startDateTime;
      return t && new Date(t) >= now;
    })
    .sort((a, b) => {
      const ta = new Date(a.startTime ?? (a as any).startDateTime ?? 0).getTime();
      const tb = new Date(b.startTime ?? (b as any).startDateTime ?? 0).getTime();
      return ta - tb;
    })
    .slice(0, limit);
}

export function HomeScreen({ navigation }: { navigation: any }) {
  const { api, user } = useAuth();
  const { theme } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [trendingEvents, setTrendingEvents] = useState<Event[]>([]);
  const [loadingTrending, setLoadingTrending] = useState(true);
  const [loadingUpcoming, setLoadingUpcoming] = useState(true);
  const [upcomingEvents, setUpcomingEvents] = useState<Event[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadTrending = useCallback(async () => {
    try {
      const events = selectedCategory && selectedCategory !== "All"
        ? await api.getEventsByCategory(selectedCategory)
        : await api.getEvents(1, 12);
      setTrendingEvents(Array.isArray(events) ? events.slice(0, 6) : []);
    } catch {
      setTrendingEvents([]);
    } finally {
      setLoadingTrending(false);
    }
  }, [api, selectedCategory]);

  const loadUpcoming = useCallback(async () => {
    try {
      const events = await api.getEvents(1, 50);
      const list = Array.isArray(events) ? events : [];
      setUpcomingEvents(getUpcoming(list, 6));
    } catch {
      setUpcomingEvents([]);
    } finally {
      setLoadingUpcoming(false);
    }
  }, [api]);

  useEffect(() => {
    setLoadingTrending(true);
    loadTrending();
  }, [loadTrending]);

  useEffect(() => {
    setLoadingUpcoming(true);
    loadUpcoming();
  }, [loadUpcoming]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadTrending(), loadUpcoming()]);
    setRefreshing(false);
  };

  const openPricing = () => {
    navigation.getParent()?.navigate("Profile", { screen: "Pricing" });
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Hero – same concept as web: background image + dark overlay + CTAs */}
      <ImageBackground
        source={require("../../assets/hero-concert.jpg")}
        style={styles.hero}
        resizeMode="cover"
      >
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <View style={styles.heroBadge}>
            <Ionicons name="play" size={14} color="rgba(255,255,255,0.95)" />
            <Text style={styles.heroBadgeText}>Discover experiences</Text>
          </View>
          <Text style={styles.heroTitle}>EventPro</Text>
          <Text style={styles.heroSubtitle}>
            Discover and book events. Your next experience is here.
          </Text>
          <View style={styles.heroActions}>
            <TouchableOpacity
              style={[styles.ctaButton, { backgroundColor: theme.colors.card }]}
              onPress={() => navigation.navigate("EventsList")}
            >
              <Ionicons name="calendar-outline" size={20} color={theme.colors.primary} />
              <Text style={[styles.ctaButtonText, { color: theme.colors.primary }]}>Browse events</Text>
            </TouchableOpacity>
            {!user && (
              <TouchableOpacity
                style={[styles.ctaButtonOutline, { borderColor: "rgba(255,255,255,0.5)" }]}
                onPress={() => navigation.getParent()?.navigate("Profile", { screen: "ProfileHome" })}
              >
                <Text style={styles.ctaButtonOutlineText}>Join the Front Row</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ImageBackground>

      {/* Category filter */}
      <View style={styles.categorySection}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryList}>
          {CATEGORIES.map((cat) => {
            const isAll = cat === "All";
            const isSelected = (isAll && !selectedCategory) || selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryPill,
                  {
                    backgroundColor: isSelected ? theme.colors.primary : theme.colors.card,
                    borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                  },
                ]}
                onPress={() => setSelectedCategory(isAll ? null : isSelected ? null : cat)}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    { color: isSelected ? theme.colors.primaryForeground : theme.colors.foreground },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Trending / Hot events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="trending-up" size={22} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Hot events</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("EventsList")}>
            <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>
        {loadingTrending ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
            <Text style={[styles.loadingText, { color: theme.colors.mutedForeground }]}>Loading…</Text>
          </View>
        ) : trendingEvents.length > 0 ? (
          trendingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
            />
          ))
        ) : (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.muted }]}>
            <Ionicons name="ticket-outline" size={40} color={theme.colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>No events yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.mutedForeground }]}>Check back soon for new events.</Text>
            <TouchableOpacity style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate("EventsList")}>
              <Text style={[styles.emptyButtonText, { color: theme.colors.primaryForeground }]}>Browse events</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Upcoming */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleRow}>
            <Ionicons name="time-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Upcoming</Text>
          </View>
          <TouchableOpacity onPress={() => navigation.navigate("EventsList")}>
            <Text style={[styles.viewAll, { color: theme.colors.primary }]}>View all</Text>
          </TouchableOpacity>
        </View>
        {loadingUpcoming ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator size="small" color={theme.colors.primary} />
          </View>
        ) : upcomingEvents.length > 0 ? (
          upcomingEvents.map((event) => (
            <EventCard
              key={event.id}
              event={event}
              onPress={() => navigation.navigate("EventDetail", { eventId: event.id })}
            />
          ))
        ) : (
          <View style={[styles.emptyCardSmall, { backgroundColor: theme.colors.muted }]}>
            <Ionicons name="calendar-outline" size={32} color={theme.colors.mutedForeground} />
            <Text style={[styles.emptyDesc, { color: theme.colors.mutedForeground, marginTop: 8 }]}>No upcoming events</Text>
          </View>
        )}
      </View>

      {/* Why EventPro - features */}
      <View style={[styles.section, { backgroundColor: theme.colors.muted + "40", marginHorizontal: -theme.spacing.md, paddingHorizontal: theme.spacing.md, paddingVertical: 24 }]}>
        <Text style={[styles.featuresTitle, { color: theme.colors.foreground }]}>Why EventPro?</Text>
        <Text style={[styles.featuresSubtitle, { color: theme.colors.mutedForeground }]}>Everything for seamless event experiences</Text>
        <View style={styles.featuresGrid}>
          {FEATURES.map((f) => (
            <View key={f.title} style={[styles.featureCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={[styles.featureIconWrap, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name={f.icon} size={24} color={theme.colors.primaryForeground} />
              </View>
              <Text style={[styles.featureTitle, { color: theme.colors.foreground }]}>{f.title}</Text>
              <Text style={[styles.featureDesc, { color: theme.colors.mutedForeground }]}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTA */}
      <View style={[styles.ctaCard, { backgroundColor: theme.colors.primary }]}>
        <Text style={[styles.ctaCardTitle, { color: theme.colors.primaryForeground }]}>Ready to secure your tickets?</Text>
        <Text style={[styles.ctaCardSubtitle, { color: "rgba(255,255,255,0.9)" }]}>
          Browse events and buy tickets—no account required.
        </Text>
        <TouchableOpacity
          style={[styles.ctaCardButton, { backgroundColor: theme.colors.card }]}
          onPress={() => navigation.navigate("EventsList")}
        >
          <Ionicons name="ticket-outline" size={20} color={theme.colors.primary} />
          <Text style={[styles.ctaCardButtonText, { color: theme.colors.primary }]}>Browse events & get tickets</Text>
        </TouchableOpacity>
      </View>

      {/* Shortcuts */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>More</Text>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("EventsList")}>
          <Text style={[styles.linkLabel, { color: theme.colors.foreground }]}>All events</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={openPricing}>
          <Text style={[styles.linkLabel, { color: theme.colors.foreground }]}>Pricing</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity
            style={[styles.linkRow, { borderBottomColor: theme.colors.border }]}
            onPress={() => navigation.getParent()?.navigate("Profile", { screen: "OrderHistory" })}
          >
            <Text style={[styles.linkLabel, { color: theme.colors.foreground }]}>My orders</Text>
            <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
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
    minHeight: 300,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 20,
    overflow: "hidden",
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  heroContent: {
    paddingVertical: 28,
    paddingHorizontal: lightTheme.spacing.lg,
  },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.15)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 12,
  },
  heroBadgeText: { fontSize: 13, color: "rgba(255,255,255,0.95)" },
  heroTitle: { fontSize: 32, fontWeight: "800", marginBottom: 8, color: "#fff" },
  heroSubtitle: { fontSize: 16, marginBottom: 20, color: "rgba(255,255,255,0.9)" },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  ctaButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: lightTheme.radius.lg,
  },
  ctaButtonText: { fontSize: 16, fontWeight: "700" },
  ctaButtonOutline: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 2,
  },
  ctaButtonOutlineText: { fontSize: 16, fontWeight: "600", color: "#fff" },
  categorySection: { marginBottom: 16 },
  categoryList: { paddingHorizontal: lightTheme.spacing.md, gap: 8, paddingVertical: 4 },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: { fontSize: 14, fontWeight: "600" },
  section: { paddingHorizontal: lightTheme.spacing.md, marginBottom: 28 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionTitle: { fontSize: 20, fontWeight: "700" },
  viewAll: { fontSize: 15, fontWeight: "600" },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 24 },
  loadingText: { fontSize: 15 },
  eventCard: { borderRadius: lightTheme.radius.lg, marginBottom: 12, overflow: "hidden", borderWidth: 1 },
  eventImage: { width: "100%", height: 140 },
  eventImagePlaceholder: { width: "100%", height: 140, justifyContent: "center", alignItems: "center" },
  eventCardBody: { padding: 14 },
  eventName: { fontSize: 17, fontWeight: "600" },
  eventDate: { fontSize: 13, marginTop: 4 },
  emptyCard: { padding: 24, borderRadius: lightTheme.radius.lg, alignItems: "center" },
  emptyCardSmall: { padding: 20, borderRadius: lightTheme.radius.lg, alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  emptyDesc: { fontSize: 14, marginBottom: 16, textAlign: "center" },
  emptyButton: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: lightTheme.radius.md },
  emptyButtonText: { fontWeight: "600" },
  featuresTitle: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  featuresSubtitle: { fontSize: 15, marginBottom: 16, color: lightTheme.colors.mutedForeground },
  featuresGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  featureCard: {
    width: "47%",
    minWidth: 140,
    padding: 14,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
  },
  featureIconWrap: { width: 44, height: 44, borderRadius: lightTheme.radius.md, justifyContent: "center", alignItems: "center", marginBottom: 10 },
  featureTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  featureDesc: { fontSize: 12 },
  ctaCard: {
    padding: 24,
    borderRadius: lightTheme.radius.lg,
    marginHorizontal: lightTheme.spacing.md,
    marginBottom: 24,
    alignItems: "center",
  },
  ctaCardTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  ctaCardSubtitle: { fontSize: 15, marginBottom: 16, textAlign: "center" },
  ctaCardButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: lightTheme.radius.md,
  },
  ctaCardButtonText: { fontSize: 16, fontWeight: "600" },
  linkRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1 },
  linkLabel: { fontSize: 16 },
});
