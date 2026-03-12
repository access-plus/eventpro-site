import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  Linking,
  Image,
} from "react-native";
import Constants from "expo-constants";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import type { Event, OrganizerSummary, OrganizerInsights, RecentSale } from "@eventpro/shared";
import { theme } from "../theme";
import { canUseAddons, tierLabel } from "../lib/organizerTiers";

const USD = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });

const WEB_URL = Constants.expoConfig?.extra?.webUrl ?? process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:5173";

export function OrganizerDashboardScreen({ navigation }: { navigation: any }) {
  const { api, user } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [summary, setSummary] = useState<OrganizerSummary | null>(null);
  const [recentSales, setRecentSales] = useState<RecentSale[]>([]);
  const [insights, setInsights] = useState<OrganizerInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const [requestingPayout, setRequestingPayout] = useState(false);

  const showEnhance = canUseAddons(user?.subscriptionTier);
  const tier = tierLabel(user?.subscriptionTier);

  const load = useCallback(async () => {
    try {
      const [eventList, summaryData, sales, insightsData] = await Promise.all([
        api.getOrganizerEvents(),
        api.getOrganizerSummary().catch(() => null),
        api.getOrganizerRecentSales(10).catch(() => []),
        api.getOrganizerInsights().catch(() => null),
      ]);
      setEvents(Array.isArray(eventList) ? eventList : []);
      setSummary(summaryData ?? null);
      setRecentSales(Array.isArray(sales) ? sales : []);
      setInsights(insightsData ?? null);
    } catch {
      setEvents([]);
      setSummary(null);
      setRecentSales([]);
      setInsights(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [api]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  const handlePublish = async (eventId: string) => {
    try {
      setPublishingId(eventId);
      await api.publishEvent(eventId);
      await load();
      Alert.alert("Success", "Event published.");
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Failed to publish event.");
    } finally {
      setPublishingId(null);
    }
  };

  const openCreateEvent = () => {
    Linking.openURL(`${WEB_URL}/organizer/events/new`).catch(() => {});
  };

  const openWebOrganizer = (path = "/organizer") => {
    Linking.openURL(`${WEB_URL}${path}`).catch(() => {});
  };

  const handleRequestPayout = async () => {
    if (!summary) return;
    const available = Number(summary.availableBalance) || 0;
    if (available <= 0) return;
    setRequestingPayout(true);
    try {
      await api.requestPayout(available);
      Alert.alert("Success", "Payout requested. You will be notified when it is processed.");
      load();
    } catch (e: any) {
      Alert.alert("Error", e?.response?.data?.message ?? "Request failed");
    } finally {
      setRequestingPayout(false);
    }
  };

  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  if (!isOrganizer) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.mutedForeground }]}>
          Organizer access required. Use the web app to create events.
        </Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const draftEvents = events.filter((e) => e.status === "DRAFT");
  const publishedEvents = events.filter((e) => e.status === "PUBLISHED");
  const totalRevenue = summary ? Number(summary.totalRevenue) || 0 : 0;
  const availableBalance = summary ? Number(summary.availableBalance) || 0 : 0;
  const pendingBalance = summary ? Number(summary.pendingBalance) || 0 : 0;
  const platformFeesWithheld = summary ? Number(summary.platformFeesWithheld) || 0 : 0;
  const w9Submitted = Boolean(summary?.w9Submitted);
  const isVerified = Boolean(user?.isVerified) || user?.verificationStatus === "VERIFIED";
  const payoutsPausedByTax = totalRevenue >= 600 && !w9Submitted;
  const canPayout = isVerified && availableBalance > 0 && !payoutsPausedByTax;

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerIconWrap, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="calendar" size={24} color={theme.colors.primaryForeground} />
          </View>
          <View>
            <Text style={[styles.headerTitle, { color: theme.colors.foreground }]}>Organizer Dashboard</Text>
            <Text style={[styles.headerSubtitle, { color: theme.colors.mutedForeground }]}>Welcome, {user?.firstName ?? "Organizer"}</Text>
          </View>
        </View>
      </View>

      {/* Plan & verification */}
      <View style={[styles.tierCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.tierRow, styles.tierRowFirst]}>
          <Text style={[styles.tierLabel, { color: theme.colors.mutedForeground }]}>Plan</Text>
          <Text style={[styles.tierValue, { color: theme.colors.foreground }]}>{tier}</Text>
        </View>
        <View style={[styles.tierRow, { borderTopColor: theme.colors.border }]}>
          <Text style={[styles.tierLabel, { color: theme.colors.mutedForeground }]}>Verification</Text>
          <View style={styles.tierRowRight}>
            {isVerified ? (
              <Ionicons name="checkmark-circle" size={20} color={theme.colors.success} />
            ) : (
              <Ionicons name="alert-circle-outline" size={20} color={theme.colors.warning} />
            )}
            <Text style={[styles.tierValue, { color: theme.colors.foreground }]}>{isVerified ? "Verified" : "Complete on web"}</Text>
          </View>
        </View>
      </View>

      {/* Check-in shortcut */}
      <TouchableOpacity
        style={[styles.checkInShortcut, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("CheckIn")}
      >
        <Ionicons name="scan-outline" size={28} color={theme.colors.primaryForeground} />
        <View style={styles.checkInShortcutText}>
          <Text style={styles.checkInShortcutTitle}>Check-in tickets</Text>
          <Text style={styles.checkInShortcutHint}>Scan QR codes at the door</Text>
        </View>
        <Ionicons name="chevron-forward" size={24} color={theme.colors.primaryForeground} />
      </TouchableOpacity>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={openCreateEvent}
        >
          <Ionicons name="add-circle-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.actionBtnText, { color: theme.colors.primary }]}>Create event</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Ionicons name="refresh" size={22} color={theme.colors.foreground} />
          <Text style={[styles.actionBtnText, { color: theme.colors.foreground }]}>Refresh</Text>
        </TouchableOpacity>
      </View>

      {/* Financial Hub – vibrant modern cards */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.financialHubIconWrap, { backgroundColor: theme.colors.primary + "22" }]}>
            <Ionicons name="wallet" size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.financialHubTitle, { color: theme.colors.foreground }]}>Financial Hub</Text>
        </View>
        <View style={styles.financialCardsRow}>
          <View style={[styles.financialCard, styles.financialCardRevenue]}>
            <View style={[styles.financialCardAccent, { backgroundColor: theme.colors.success }]} />
            <View style={styles.financialCardContent}>
              <Ionicons name="trending-up" size={20} color={theme.colors.success} />
              <Text style={[styles.financialCardLabel, { color: theme.colors.mutedForeground }]}>Total Revenue</Text>
              <Text style={[styles.financialCardHint, { color: theme.colors.mutedForeground }]}>Life-to-date</Text>
              <Text style={[styles.financialCardValue, { color: theme.colors.foreground }]}>{USD.format(totalRevenue)}</Text>
              {platformFeesWithheld > 0 && (
                <Text style={[styles.financialCardSub, { color: theme.colors.mutedForeground }]}>Fees: −{USD.format(platformFeesWithheld)}</Text>
              )}
            </View>
          </View>
          <View style={[styles.financialCard, styles.financialCardAvailable]}>
            <View style={[styles.financialCardAccent, { backgroundColor: theme.colors.primary }]} />
            <View style={styles.financialCardContent}>
              <Ionicons name="cash" size={20} color={theme.colors.primary} />
              <Text style={[styles.financialCardLabel, { color: theme.colors.mutedForeground }]}>Available</Text>
              <Text style={[styles.financialCardHint, { color: theme.colors.mutedForeground }]}>For payout</Text>
              <Text style={[styles.financialCardValue, { color: theme.colors.primary }]}>{USD.format(availableBalance)}</Text>
            </View>
          </View>
          <View style={[styles.financialCard, styles.financialCardPending]}>
            <View style={[styles.financialCardAccent, { backgroundColor: theme.colors.mutedForeground }]} />
            <View style={styles.financialCardContent}>
              <Ionicons name="time" size={20} color={theme.colors.mutedForeground} />
              <Text style={[styles.financialCardLabel, { color: theme.colors.mutedForeground }]}>Pending</Text>
              <Text style={[styles.financialCardHint, { color: theme.colors.mutedForeground }]}>1–3 days</Text>
              <Text style={[styles.financialCardValue, { color: theme.colors.foreground }]}>{USD.format(pendingBalance)}</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={[
            styles.instantPayoutBtn,
            {
              backgroundColor: canPayout ? theme.colors.primary : theme.colors.muted,
              shadowColor: canPayout ? theme.colors.primary : "transparent",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: canPayout ? 0.35 : 0,
              shadowRadius: 12,
              elevation: canPayout ? 6 : 0,
            },
          ]}
          onPress={handleRequestPayout}
          disabled={!canPayout || requestingPayout}
        >
          {requestingPayout ? (
            <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
          ) : (
            <>
              <Ionicons name="flash" size={22} color={theme.colors.primaryForeground} />
              <Text style={[styles.instantPayoutText, { color: theme.colors.primaryForeground }]}>
                {payoutsPausedByTax ? "Complete W-9 on web" : "Instant Payout"}
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* AI Insights & Top Cultural Interests – same as web */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={[styles.financialHubIconWrap, { backgroundColor: theme.colors.primary + "22" }]}>
            <Ionicons name="sparkles" size={22} color={theme.colors.primary} />
          </View>
          <Text style={[styles.financialHubTitle, { color: theme.colors.foreground }]}>AI Insights</Text>
        </View>
        <View style={[styles.insightCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary + "30" }]}>
          <Text style={[styles.insightLabel, { color: theme.colors.primary }]}>AI Insight</Text>
          <Text style={[styles.insightText, { color: theme.colors.foreground }]}>
            {insights?.aiInsight?.trim() || "Create and publish events to see AI-powered tips here."}
          </Text>
        </View>
        <View style={[styles.culturalCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.culturalTitle, { color: theme.colors.foreground }]}>Top Cultural Interests</Text>
          {(insights?.topCulturalInterests?.length ?? 0) === 0 ? (
            <Text style={[styles.culturalEmpty, { color: theme.colors.mutedForeground }]}>No attendee data yet. Sales will populate this by category.</Text>
          ) : (
            (() => {
              const total = insights!.topCulturalInterests.reduce((s, c) => s + c.count, 0);
              return insights!.topCulturalInterests.slice(0, 6).map((c, i) => {
                const pct = total > 0 ? (c.count / total) * 100 : 0;
                return (
                  <View key={c.name} style={[styles.culturalRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                    <Text style={[styles.culturalName, { color: theme.colors.foreground }]} numberOfLines={1}>{c.name}</Text>
                    <View style={[styles.culturalBarBg, { backgroundColor: theme.colors.muted }]}>
                      <View style={[styles.culturalBarFill, { width: `${pct}%`, backgroundColor: theme.colors.primary }]} />
                    </View>
                    <Text style={[styles.culturalCount, { color: theme.colors.mutedForeground }]}>{c.count} ({pct.toFixed(0)}%)</Text>
                  </View>
                );
              });
            })()
          )}
        </View>
      </View>

      {/* 1099-K Tax Center – same as web */}
      <View style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border, borderRadius: theme.radius.lg, borderWidth: 1, padding: theme.spacing.md }]}>
        <View style={styles.sectionHeader}>
          <Ionicons name="document-text-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>1099-K & W-9</Text>
        </View>
        <Text style={[styles.taxDesc, { color: theme.colors.mutedForeground }]}>
          {w9Submitted ? "W-9 on file. Manage documents on the web." : totalRevenue >= 600 ? "W-9 required at $600+ gross. Submit on web to resume payouts." : "Submit W-9 on the web when required."}
        </Text>
        <TouchableOpacity style={[styles.webLinkBtn, { borderColor: theme.colors.border }]} onPress={() => openWebOrganizer("/organizer")}>
          <Text style={[styles.webLinkBtnText, { color: theme.colors.primary }]}>Manage on web</Text>
          <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Export & Insights – same as web */}
      <TouchableOpacity
        style={[styles.webSectionCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
        onPress={() => openWebOrganizer("/organizer")}
      >
        <Ionicons name="download-outline" size={24} color={theme.colors.primary} />
        <View style={styles.webSectionText}>
          <Text style={[styles.webSectionTitle, { color: theme.colors.foreground }]}>Export & insights</Text>
          <Text style={[styles.webSectionHint, { color: theme.colors.mutedForeground }]}>Export attendees, check-in list, and view analytics on the web app.</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
      </TouchableOpacity>

      {/* Recent sales (Live ticket feed) – same as web */}
      {recentSales.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="receipt-outline" size={20} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Recent sales</Text>
          </View>
          <View style={[styles.recentSalesCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            {recentSales.slice(0, 5).map((sale, i) => (
              <View key={`${sale.orderId}-${i}`} style={[styles.recentSaleRow, i > 0 && { borderTopWidth: 1, borderTopColor: theme.colors.border }]}>
                <Text style={[styles.recentSaleEvent, { color: theme.colors.foreground }]} numberOfLines={1}>{sale.eventName}</Text>
                <Text style={[styles.recentSaleDetail, { color: theme.colors.mutedForeground }]}>{sale.quantity} × {sale.ticketTypeName} – {sale.buyerName}</Text>
                <Text style={[styles.recentSaleDate, { color: theme.colors.mutedForeground }]}>{sale.soldAt ? new Date(sale.soldAt).toLocaleString() : ""}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Stats – same as web (Draft, Published, Analytics coming soon) */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="time-outline" size={24} color="#eab308" />
          <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{draftEvents.length}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Draft events</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="checkmark-circle-outline" size={24} color={theme.colors.success} />
          <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{publishedEvents.length}</Text>
          <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Published events</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="bar-chart-outline" size={24} color={theme.colors.primary} />
          <Text style={[styles.statValue, { color: theme.colors.mutedForeground }]}>—</Text>
          <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Analytics (soon)</Text>
        </View>
      </View>

      {/* Draft events */}
      {draftEvents.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="time-outline" size={20} color="#eab308" />
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Draft events</Text>
            <View style={[styles.badge, { backgroundColor: theme.colors.muted }]}>
              <Text style={[styles.badgeText, { color: theme.colors.foreground }]}>{draftEvents.length}</Text>
            </View>
          </View>
          {draftEvents.map((event) => (
            <View key={event.id} style={[styles.draftCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
              <View style={styles.draftCardRow}>
                <Ionicons name="time-outline" size={22} color="#eab308" />
                <View style={styles.eventCardMain}>
                  <Text style={[styles.eventName, { color: theme.colors.foreground }]} numberOfLines={2}>{event.name}</Text>
                  <Text style={[styles.eventMeta, { color: theme.colors.mutedForeground }]}>
                    {event.startTime ? new Date(event.startTime).toLocaleDateString() : "No date"}
                  </Text>
                </View>
              </View>
              <View style={styles.eventCardActions}>
                <TouchableOpacity
                  style={[styles.eventCardBtn, { borderColor: theme.colors.border }]}
                  onPress={() => navigation.navigate("OrganizerEventDetail", { eventId: event.id })}
                >
                  <Text style={[styles.eventCardBtnText, { color: theme.colors.foreground }]}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.publishBtn, { backgroundColor: theme.colors.primary }]}
                  onPress={() => handlePublish(event.id)}
                  disabled={publishingId === event.id}
                >
                  {publishingId === event.id ? (
                    <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
                  ) : (
                    <Text style={[styles.publishBtnText, { color: theme.colors.primaryForeground }]}>Publish</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Published events */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="checkmark-circle-outline" size={20} color={theme.colors.success} />
          <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Published events</Text>
          <View style={[styles.badge, { backgroundColor: theme.colors.muted }]}>
            <Text style={[styles.badgeText, { color: theme.colors.foreground }]}>{publishedEvents.length}</Text>
          </View>
        </View>
        {publishedEvents.length === 0 && draftEvents.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <Ionicons name="calendar-outline" size={40} color={theme.colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>No events yet</Text>
            <Text style={[styles.emptyDesc, { color: theme.colors.mutedForeground }]}>Create your first event on the web app.</Text>
            <TouchableOpacity style={[styles.emptyBtn, { backgroundColor: theme.colors.primary }]} onPress={openCreateEvent}>
              <Text style={[styles.emptyBtnText, { color: theme.colors.primaryForeground }]}>Create event (web)</Text>
            </TouchableOpacity>
          </View>
        ) : (
          publishedEvents.map((event) => {
            const imageUrl = (event as any).imageUrl ?? (event as any).coverImageUrl;
            return (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate("OrganizerEventDetail", { eventId: event.id })}
                activeOpacity={0.7}
              >
                {imageUrl ? (
                  <Image source={{ uri: imageUrl }} style={styles.eventCardThumb} resizeMode="cover" />
                ) : (
                  <View style={[styles.eventCardThumb, styles.eventCardThumbPlaceholder, { backgroundColor: theme.colors.muted }]}>
                    <Ionicons name="calendar-outline" size={24} color={theme.colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.cardText}>
                  <Text style={[styles.eventName, { color: theme.colors.foreground }]} numberOfLines={2}>{event.name}</Text>
                  <Text style={[styles.eventMeta, { color: theme.colors.mutedForeground }]}>
                    {event.startTime ? new Date(event.startTime).toLocaleDateString() : ""}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: theme.spacing.md, paddingBottom: 32 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.spacing.lg },
  message: { textAlign: "center" },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerIconWrap: { width: 48, height: 48, borderRadius: theme.radius.lg, justifyContent: "center", alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "700" },
  headerSubtitle: { fontSize: 14 },
  tierCard: { borderRadius: theme.radius.lg, borderWidth: 1, marginBottom: 16, overflow: "hidden" },
  tierRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 12, paddingHorizontal: 16, borderTopWidth: 1 },
  tierRowFirst: { borderTopWidth: 0 },
  tierRowRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  tierLabel: { fontSize: 14 },
  tierValue: { fontSize: 15, fontWeight: "600" },
  checkInShortcut: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: theme.radius.lg,
    marginBottom: 16,
  },
  checkInShortcutText: { flex: 1, marginLeft: 14 },
  checkInShortcutTitle: { fontSize: 17, fontWeight: "700", color: "#fff" },
  checkInShortcutHint: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  actionsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: theme.radius.md, borderWidth: 1 },
  actionBtnText: { fontSize: 15, fontWeight: "600" },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "600" },
  financialHubIconWrap: { width: 40, height: 40, borderRadius: theme.radius.lg, justifyContent: "center", alignItems: "center" },
  financialHubTitle: { fontSize: 18, fontWeight: "700" },
  financialCardsRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  financialCard: {
    flex: 1,
    borderRadius: theme.radius.lg,
    borderWidth: 1,
    overflow: "hidden",
    position: "relative",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  financialCardRevenue: { borderColor: theme.colors.success + "50", shadowColor: theme.colors.success },
  financialCardAvailable: { borderColor: theme.colors.primary + "50", shadowColor: theme.colors.primary },
  financialCardPending: { borderColor: theme.colors.border, shadowColor: theme.colors.mutedForeground },
  financialCardAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  financialCardContent: { padding: 12, paddingLeft: 16 },
  financialCardLabel: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  financialCardHint: { fontSize: 10, marginBottom: 4 },
  financialCardValue: { fontSize: 16, fontWeight: "800" },
  financialCardSub: { fontSize: 10, marginTop: 4 },
  instantPayoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: theme.radius.lg, marginTop: 12 },
  instantPayoutText: { fontSize: 15, fontWeight: "600" },
  insightCard: { padding: 16, borderRadius: theme.radius.lg, borderWidth: 1, marginBottom: 12 },
  insightLabel: { fontSize: 12, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 8 },
  insightText: { fontSize: 15, lineHeight: 22 },
  culturalCard: { padding: 16, borderRadius: theme.radius.lg, borderWidth: 1 },
  culturalTitle: { fontSize: 15, fontWeight: "700", marginBottom: 12 },
  culturalEmpty: { fontSize: 14 },
  culturalRow: { paddingVertical: 10 },
  culturalName: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  culturalBarBg: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 },
  culturalBarFill: { height: "100%", borderRadius: 3 },
  culturalCount: { fontSize: 12 },
  taxDesc: { fontSize: 14, marginBottom: 12 },
  webLinkBtn: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 6, paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1 },
  webLinkBtnText: { fontSize: 14, fontWeight: "600" },
  webSectionCard: { flexDirection: "row", alignItems: "center", padding: 16, borderRadius: theme.radius.lg, borderWidth: 1, marginBottom: 20 },
  webSectionText: { flex: 1, marginLeft: 12 },
  webSectionTitle: { fontSize: 16, fontWeight: "600" },
  webSectionHint: { fontSize: 13, marginTop: 2 },
  recentSalesCard: { borderRadius: theme.radius.lg, borderWidth: 1, overflow: "hidden" },
  recentSaleRow: { padding: 12 },
  recentSaleEvent: { fontSize: 15, fontWeight: "600" },
  recentSaleDetail: { fontSize: 13, marginTop: 2 },
  recentSaleDate: { fontSize: 12, marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 20 },
  statCard: { flex: 1, padding: 12, borderRadius: theme.radius.lg, borderWidth: 1, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 11, marginTop: 4, textAlign: "center" },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.sm },
  badgeText: { fontSize: 12, fontWeight: "600" },
  draftCard: { padding: 16, borderRadius: theme.radius.lg, marginBottom: 12, borderWidth: 1 },
  draftCardRow: { flexDirection: "row", alignItems: "center" },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: theme.radius.lg,
    marginBottom: 12,
    borderWidth: 1,
  },
  eventCardThumb: { width: 48, height: 48, borderRadius: theme.radius.md },
  eventCardThumbPlaceholder: { justifyContent: "center", alignItems: "center" },
  eventCardMain: { flex: 1, marginLeft: 12 },
  cardText: { flex: 1, marginLeft: 12 },
  eventName: { fontSize: 17, fontWeight: "600" },
  eventMeta: { fontSize: 13, marginTop: 4 },
  eventCardActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  eventCardBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1 },
  eventCardBtnText: { fontSize: 14, fontWeight: "600" },
  publishBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md, minWidth: 90, alignItems: "center" },
  publishBtnText: { fontSize: 14, fontWeight: "600" },
  emptyCard: { padding: 24, borderRadius: theme.radius.lg, borderWidth: 1, alignItems: "center" },
  emptyTitle: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
  emptyDesc: { fontSize: 14, marginBottom: 16, color: theme.colors.mutedForeground },
  emptyBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.radius.md },
  emptyBtnText: { fontSize: 15, fontWeight: "600" },
});
