import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event } from "@eventpro/shared";
import { useTheme } from "../contexts/ThemeContext";
import { EventCard } from "../components/EventCard";
import { theme as staticTheme } from "../theme";
import { Ionicons } from "@expo/vector-icons";

const EVENT_CATEGORIES = [
  "Music", "Sports", "Technology", "Business", "Arts",
  "Food & Drink", "Health & Wellness", "Education", "Entertainment", "Other",
];

export function EventsListScreen({ route, navigation }: { route: any; navigation: any }) {
  const { api } = useAuth();
  const { theme } = useTheme();
  const organizerId = route?.params?.organizerId;
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);

  const loadEvents = useCallback(async () => {
    try {
      let list: Event[];
      if (selectedCategory) {
        list = await api.getEventsByCategory(selectedCategory);
      } else {
        list = await api.getEvents(1, 30, searchQuery.trim() || undefined, organizerId);
      }
      setEvents(Array.isArray(list) ? list : []);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api, organizerId, searchQuery, selectedCategory]);

  useEffect(() => {
    setLoading(true);
    loadEvents();
  }, [loadEvents]);

  const runSearch = () => {
    setSearchQuery(keyword);
    setLoading(true);
  };

  const clearFilters = () => {
    setSelectedCategory(undefined);
    setSearchQuery("");
    setKeyword("");
    setLoading(true);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadEvents();
  };

  if (loading && events.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {!organizerId && (
        <>
          <View style={[styles.searchWrap, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="search" size={20} color={theme.colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: theme.colors.foreground }]}
              placeholder="Search events..."
              placeholderTextColor={theme.colors.mutedForeground}
              value={keyword}
              onChangeText={setKeyword}
              returnKeyType="search"
              onSubmitEditing={runSearch}
              editable={!selectedCategory}
            />
            {(keyword.length > 0 || selectedCategory) && (
              <TouchableOpacity onPress={clearFilters}>
                <Ionicons name="close-circle" size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            )}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
            style={styles.categoryScrollWrap}
          >
            <TouchableOpacity
              style={[
                styles.categoryPill,
                { borderColor: theme.colors.border, backgroundColor: selectedCategory === undefined ? theme.colors.primary : theme.colors.card },
              ]}
              onPress={() => { setSelectedCategory(undefined); setLoading(true); }}
            >
              <Text style={[styles.categoryPillText, { color: selectedCategory === undefined ? theme.colors.primaryForeground : theme.colors.foreground }]}>All</Text>
            </TouchableOpacity>
            {EVENT_CATEGORIES.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.categoryPill,
                    { borderColor: theme.colors.border, backgroundColor: isSelected ? theme.colors.primary : theme.colors.card },
                  ]}
                  onPress={() => { setSelectedCategory(isSelected ? undefined : cat); setLoading(true); }}
                >
                  <Text style={[styles.categoryPillText, { color: isSelected ? theme.colors.primaryForeground : theme.colors.foreground }]}>{cat}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </>
      )}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />
        }
        ListEmptyComponent={
          <View style={[styles.empty, { backgroundColor: theme.colors.muted }]}>
            <Ionicons name="calendar-outline" size={48} color={theme.colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>No events found</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.mutedForeground }]}>
              {keyword ? "Try a different search." : "Check back later for new events."}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <EventCard
            event={item}
            onPress={() => navigation.navigate("EventDetail", { eventId: item.id })}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: staticTheme.spacing.md,
    marginBottom: staticTheme.spacing.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: staticTheme.radius.lg,
    borderWidth: 1,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 16, paddingVertical: 4 },
  categoryScroll: { paddingHorizontal: staticTheme.spacing.md, paddingBottom: staticTheme.spacing.sm, gap: 8, flexDirection: "row" },
  categoryScrollWrap: { maxHeight: 44 },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 8,
  },
  categoryPillText: { fontSize: 14, fontWeight: "600" },
  listContent: { padding: staticTheme.spacing.md, paddingBottom: 32 },
  empty: {
    padding: 32,
    borderRadius: staticTheme.radius.lg,
    alignItems: "center",
    marginTop: 24,
  },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginTop: 12 },
  emptyDesc: { fontSize: 14, marginTop: 4, textAlign: "center" },
});
