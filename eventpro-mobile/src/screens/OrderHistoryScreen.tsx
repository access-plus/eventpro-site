import React, { useEffect, useState, useMemo, useLayoutEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
  Dimensions,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import { getEventIdFromOrderLineItem, type Order, type Event } from "@eventpro/shared";
import type { Theme } from "../theme";
import { Ionicons } from "@expo/vector-icons";
type OrderWithMeta = Order & {
  _dateLabel?: string;
  _event?: Event;
  _eventDate?: Date;
};

function normalizeOrder(raw: Record<string, unknown>): OrderWithMeta {
  const totalAmount =
    typeof raw.totalAmount === "number"
      ? raw.totalAmount
      : typeof (raw as any).amount === "number"
        ? (raw as any).amount / 100
        : 0;
  const tickets = Array.isArray(raw.tickets) ? raw.tickets : Array.isArray((raw as any).orderItems) ? (raw as any).orderItems : [];
  const createdAt = (raw.createdAt ?? (raw as any).orderDate) as string | undefined;
  let dateLabel = "—";
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) dateLabel = d.toLocaleDateString(undefined, { dateStyle: "long" });
  }
  return {
    id: String(raw.id ?? ""),
    userId: String((raw as any).userId ?? ""),
    totalAmount,
    status: ((raw.status as Order["status"]) ?? "COMPLETED") as string,
    createdAt: createdAt ?? "",
    tickets,
    _dateLabel: dateLabel,
  } as OrderWithMeta;
}

function getStatusLabel(status: string) {
  const u = (status || "").toUpperCase();
  if (u === "PAID" || u === "SUCCESS" || u === "FULFILLED") return "Paid";
  switch (status) {
    case "COMPLETED": return "Confirmed";
    case "PENDING": return "Pending";
    case "CANCELLED": return "Cancelled";
    case "REFUNDED": return "Refunded";
    default: return status;
  }
}

function isPaidOrCompletedStatus(status: string): boolean {
  const u = (status || "").toUpperCase();
  return u === "COMPLETED" || u === "PAID" || u === "SUCCESS" || u === "FULFILLED";
}

function getStatusColor(status: string) {
  if (isPaidOrCompletedStatus(status)) return "#15803d";
  switch (status) {
    case "PENDING": return "#d97706";
    case "CANCELLED": return "#dc2626";
    case "REFUNDED": return "#6b7280";
    default: return "#6b7280";
  }
}

function getEventImageUrl(event: Event | undefined): string | undefined {
  if (!event) return undefined;
  const url = (event as any).imageUrl ?? (event as any).coverImageUrl;
  return typeof url === "string" ? url : undefined;
}

function daysUntilEvent(d: Date): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  return Math.round((t.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
}

/** Stitch-style order reference for receipts (not the raw UUID). */
function formatOrderDisplayId(orderId: string): string {
  const compact = orderId.replace(/-/g, "").slice(0, 6).toUpperCase();
  return compact.length >= 5 ? `XP-${compact}` : `XP-${orderId.slice(0, 8).toUpperCase()}`;
}

const SCREEN_W = Dimensions.get("window").width;
const ACTIVE_CARD_W = Math.min(SCREEN_W * 0.88, 360);

export function OrderHistoryScreen({ navigation }: { navigation: any }) {
  const { api, user } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ").trim() || user?.email?.split("@")[0] || "Member";

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginRight: 4 }}>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate("Search")}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Search events"
          >
            <Ionicons name="search-outline" size={24} color={theme.colors.foreground} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => navigation.getParent()?.navigate("Profile", { screen: "ProfileHome" })}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Profile"
          >
            <View
              style={{
                width: 34,
                height: 34,
                borderRadius: 17,
                backgroundColor: theme.colors.primary + "33",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 12, fontWeight: "800", color: theme.colors.primary }}>
                {displayName.slice(0, 2).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      ),
    });
  }, [navigation, theme.colors.foreground, theme.colors.primary, displayName]);
  const [orders, setOrders] = useState<OrderWithMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyFilter, setHistoryFilter] = useState<"all" | "past">("all");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getOrders(1, 50);
        const rawList = Array.isArray(data) ? data : [];
        const normalized = rawList.map((o) => normalizeOrder(o as unknown as Record<string, unknown>)) as OrderWithMeta[];

        const eventIds = new Set<string>();
        normalized.forEach((o) => {
          (o.tickets ?? []).forEach((t) => {
            const eid = getEventIdFromOrderLineItem(t);
            if (eid) eventIds.add(eid);
          });
        });
        const eventsMap: Record<string, Event> = {};
        await Promise.all(
          Array.from(eventIds).map(async (id) => {
            try {
              const ev = await api.getEvent(id);
              if (!cancelled) eventsMap[id] = ev;
            } catch {
              // ignore
            }
          })
        );

        normalized.forEach((o) => {
          const firstEventId = getEventIdFromOrderLineItem((o.tickets ?? [])[0]);
          const event = firstEventId ? eventsMap[firstEventId] : undefined;
          o._event = event;
          if (event?.startTime) {
            const d = new Date(event.startTime);
            o._eventDate = Number.isNaN(d.getTime()) ? undefined : d;
          }
        });

        if (!cancelled) setOrders(normalized);
      } catch {
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [api]);

  const { upcoming, past } = useMemo(() => {
    const now = new Date();
    const up: OrderWithMeta[] = [];
    const pa: OrderWithMeta[] = [];
    orders.forEach((o) => {
      if (o._eventDate && o._eventDate >= now) up.push(o);
      else pa.push(o);
    });
    up.sort((a, b) => (a._eventDate && b._eventDate ? a._eventDate.getTime() - b._eventDate.getTime() : 0));
    pa.sort((a, b) => (a._eventDate && b._eventDate ? b._eventDate.getTime() - a._eventDate.getTime() : 0));
    return { upcoming: up, past: pa };
  }, [orders]);

  const historyOrders = useMemo(() => {
    if (historyFilter === "past") return past;
    const sorted = [...orders].sort((a, b) => {
      const ca = new Date(a.createdAt).getTime();
      const cb = new Date(b.createdAt).getTime();
      return cb - ca;
    });
    return sorted;
  }, [orders, past, historyFilter]);

  const onViewTicket = (order: OrderWithMeta) => {
    navigation.navigate("OrderDetail", {
      orderId: order.id,
      eventName: order._event?.name,
    });
  };

  const onPressOrder = (order: OrderWithMeta) => {
    if (order._event?.id) {
      navigation.getParent()?.navigate("Discover", { screen: "EventDetail", params: { eventId: order._event.id } });
    }
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  /** Tickets-first (Stitch my_tickets): no duplicate profile block — use Profile tab. */
  if (orders.length === 0) {
    return (
      <ScrollView
        style={[styles.container, { backgroundColor: theme.colors.background }]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.ticketsHero}>
          <Text style={[styles.ticketsHeroTitle, { color: theme.colors.foreground }]}>My tickets</Text>
          <Text style={[styles.ticketsHeroSub, { color: theme.colors.mutedForeground }]}>
            Purchases and QR codes live here. Open your wallet when you are at the venue.
          </Text>
          <TouchableOpacity
            style={[styles.walletLinkRow, { backgroundColor: theme.colors.primary + "18" }]}
            onPress={() => navigation.navigate("MyWallet")}
            activeOpacity={0.85}
          >
            <Ionicons name="wallet-outline" size={22} color={theme.colors.primary} />
            <Text style={[styles.walletLinkText, { color: theme.colors.primary }]}>Open My Wallet</Text>
            <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
        <View style={[styles.emptyCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.emptyIconWrap, { backgroundColor: theme.colors.muted }]}>
            <Ionicons name="ticket-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.emptyTitle, { color: theme.colors.foreground }]}>No orders yet</Text>
          <Text style={[styles.emptyText, { color: theme.colors.mutedForeground }]}>
            Your order history will appear here after your first purchase. Discover events and grab your tickets.
          </Text>
          <TouchableOpacity
            style={[styles.emptyButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.getParent()?.navigate("Discover")}
            activeOpacity={0.8}
          >
            <Ionicons name="ticket-outline" size={20} color={theme.colors.primaryForeground} />
            <Text style={[styles.emptyButtonText, { color: theme.colors.primaryForeground }]}>Find Your Next Experience</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  }

  const activeBadge = (order: OrderWithMeta) => {
    if (!order._eventDate) return null;
    const du = daysUntilEvent(order._eventDate);
    if (du === 0) return "TONIGHT";
    if (du > 0 && du <= 14) return `IN ${du} DAY${du === 1 ? "" : "S"}`;
    return null;
  };

  const renderOrderCard = (order: OrderWithMeta, isFeatured: boolean, cardWidth?: number) => {
    const event = order._event;
    const eventDate = order._eventDate;
    const eventImageUrl = getEventImageUrl(event);
    const orderDateLabel = order._dateLabel ?? "—";
    const eventDateLabel = eventDate
      ? eventDate.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" })
      : null;
    const ticketCount = order.tickets?.length ?? 0;

    return (
      <TouchableOpacity
        style={[
          styles.card,
          { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
          isFeatured && styles.cardFeatured,
          cardWidth != null ? { width: cardWidth } : null,
        ]}
        onPress={() => onPressOrder(order)}
        activeOpacity={0.8}
      >
        <View style={[styles.cardImageWrap, isFeatured && styles.cardImageWrapFeatured]}>
          {eventImageUrl ? (
            <Image source={{ uri: eventImageUrl }} style={styles.cardImage} resizeMode="cover" />
          ) : (
            <View style={[styles.cardImagePlaceholder, { backgroundColor: theme.colors.muted }]}>
              <Ionicons name="ticket-outline" size={40} color={theme.colors.primary} />
            </View>
          )}
        </View>
        <View style={styles.cardBody}>
          <View style={styles.cardRow}>
            <Text style={[styles.orderId, { color: theme.colors.mutedForeground }]}>
              {formatOrderDisplayId(order.id)}
            </Text>
            <View style={[styles.badge, { backgroundColor: getStatusColor(order.status) }]}>
              <Text style={styles.badgeText}>{getStatusLabel(order.status)}</Text>
            </View>
          </View>
          <Text style={[styles.eventName, { color: theme.colors.foreground }]} numberOfLines={2}>
            {event?.name ?? "Event"}
          </Text>
          {eventDateLabel ? (
            <View style={styles.metaRow}>
              <Ionicons name="calendar-outline" size={14} color={theme.colors.primary} />
              <Text style={[styles.eventDate, { color: theme.colors.foreground }]}>{eventDateLabel}</Text>
            </View>
          ) : null}
          <Text style={[styles.orderDate, { color: theme.colors.mutedForeground }]}>
            Ordered {orderDateLabel}
          </Text>
          <View style={styles.cardFooter}>
            <View style={styles.amountRow}>
              <Ionicons name="cash-outline" size={16} color={theme.colors.primary} />
              <Text style={[styles.amount, { color: theme.colors.foreground }]}>
                ${Number(order.totalAmount ?? 0).toFixed(2)}
              </Text>
            </View>
            <Text style={[styles.ticketCount, { color: theme.colors.mutedForeground }]}>
              {ticketCount} ticket{ticketCount !== 1 ? "s" : ""}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.viewTicketBtn, { backgroundColor: theme.colors.primary }]}
            onPress={(e) => {
              e.stopPropagation();
              onViewTicket(order);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="qr-code-outline" size={18} color={theme.colors.primaryForeground} />
            <Text style={[styles.viewTicketBtnText, { color: theme.colors.primaryForeground }]}>View Ticket</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.ticketsHero}>
        <Text style={[styles.ticketsHeroTitle, { color: theme.colors.foreground }]}>My tickets</Text>
        <Text style={[styles.ticketsHeroSub, { color: theme.colors.mutedForeground }]}>
          Upcoming events appear first. Past purchases stay in order history.
        </Text>
        <TouchableOpacity
          style={[styles.walletLinkRow, { backgroundColor: theme.colors.primary + "18" }]}
          onPress={() => navigation.navigate("MyWallet")}
          activeOpacity={0.85}
        >
          <Ionicons name="wallet-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.walletLinkText, { color: theme.colors.primary }]}>My Wallet — QR & passes</Text>
          <Ionicons name="chevron-forward" size={18} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <View style={styles.activeHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Active tickets</Text>
            <TouchableOpacity onPress={() => navigation.navigate("MyWallet")}>
              <Text style={[styles.viewWallet, { color: theme.colors.primary }]}>View Wallet</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.activeCarousel}
            decelerationRate="fast"
          >
            {upcoming.map((order) => (
              <View key={order.id} style={[styles.cardWrap, styles.carouselCardWrap]}>
                <View style={styles.activeWrap}>
                  {activeBadge(order) ? (
                    <View style={styles.tonightBadge}>
                      <Text style={styles.tonightBadgeText}>{activeBadge(order)}</Text>
                    </View>
                  ) : null}
                  {renderOrderCard(order, true, ACTIVE_CARD_W)}
                </View>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {upcoming.length === 0 && orders.length > 0 && (
        <View style={[styles.upcomingEmpty, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Ionicons name="calendar-outline" size={22} color={theme.colors.mutedForeground} />
          <Text style={[styles.upcomingEmptyText, { color: theme.colors.mutedForeground }]}>
            No upcoming events in your orders — tickets below are from past events or dates we could not load.
          </Text>
        </View>
      )}

      {historyOrders.length > 0 && (
        <View style={styles.section}>
          <View style={styles.orderHistoryHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Order history</Text>
            <View style={[styles.filterToggle, { backgroundColor: theme.colors.muted }]}>
              <TouchableOpacity
                style={[styles.filterChip, historyFilter === "all" && { backgroundColor: theme.colors.card }]}
                onPress={() => setHistoryFilter("all")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: historyFilter === "all" ? theme.colors.foreground : theme.colors.mutedForeground },
                  ]}
                >
                  ALL
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.filterChip, historyFilter === "past" && { backgroundColor: theme.colors.card }]}
                onPress={() => setHistoryFilter("past")}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: historyFilter === "past" ? theme.colors.foreground : theme.colors.mutedForeground },
                  ]}
                >
                  PAST
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          {historyOrders.map((order) => {
            const thumb = getEventImageUrl(order._event);
            const n = order.tickets?.length ?? 0;
            const statusLine = (() => {
              if (isPaidOrCompletedStatus(order.status)) {
                return { text: "PAID", color: "#15803d" };
              }
              if ((order.status || "").toUpperCase() === "PENDING") {
                return { text: "PENDING", color: "#d97706" };
              }
              if (order._eventDate) {
                return {
                  text: order._eventDate
                    .toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })
                    .toUpperCase(),
                  color: theme.colors.mutedForeground,
                };
              }
              return {
                text: getStatusLabel(order.status).toUpperCase(),
                color: theme.colors.mutedForeground,
              };
            })();
            return (
              <View key={order.id} style={styles.cardWrap}>
                <TouchableOpacity
                  style={[
                    styles.compactOrder,
                    { backgroundColor: theme.colors.card, borderColor: theme.colors.border },
                  ]}
                  onPress={() => onPressOrder(order)}
                  activeOpacity={0.85}
                >
                  {thumb ? (
                    <Image source={{ uri: thumb }} style={styles.compactThumb} resizeMode="cover" />
                  ) : (
                    <View style={[styles.compactThumb, styles.compactThumbPh, { backgroundColor: theme.colors.muted }]}>
                      <Ionicons name="image-outline" size={22} color={theme.colors.primary} />
                    </View>
                  )}
                  <View style={styles.compactLeft}>
                    <Text style={[styles.compactTitle, { color: theme.colors.foreground }]} numberOfLines={2}>
                      {order._event?.name ?? "Event"}
                    </Text>
                    <Text style={[styles.compactSub, { color: theme.colors.mutedForeground }]}>
                      {n} ticket{n !== 1 ? "s" : ""} · {formatOrderDisplayId(order.id)}
                    </Text>
                  </View>
                  <View style={styles.compactRight}>
                    <Text style={[styles.compactPrice, { color: theme.colors.foreground }]}>
                      ${Number(order.totalAmount ?? 0).toFixed(2)}
                    </Text>
                    <Text style={[styles.compactStatus, { color: statusLine.color }]}>{statusLine.text}</Text>
                  </View>
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1 },
    scrollContent: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
    centered: { flex: 1, justifyContent: "center", alignItems: "center" },
    pageSubtitle: { fontSize: 15, marginBottom: theme.spacing.lg },
    ticketsHero: { marginBottom: theme.spacing.lg },
    ticketsHeroTitle: { fontSize: 26, fontWeight: "800", marginBottom: 6 },
    ticketsHeroSub: { fontSize: 14, lineHeight: 20, marginBottom: 14 },
    walletLinkRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: theme.radius.lg,
    },
    walletLinkText: { flex: 1, fontSize: 15, fontWeight: "700" },
    upcomingEmpty: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      padding: 12,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      marginBottom: theme.spacing.lg,
    },
    upcomingEmptyText: { flex: 1, fontSize: 13, lineHeight: 18 },
    activeHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    viewWallet: { fontSize: 14, fontWeight: "700" },
    activeCarousel: {
      flexDirection: "row",
      paddingRight: theme.spacing.md,
      paddingBottom: 4,
    },
    carouselCardWrap: { marginBottom: 0, width: ACTIVE_CARD_W, marginRight: 12 },
    activeWrap: { position: "relative" },
    tonightBadge: {
      position: "absolute",
      top: 10,
      left: 10,
      zIndex: 2,
      backgroundColor: "#8B2942",
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: theme.radius.sm,
    },
    tonightBadgeText: { color: "#fff", fontSize: 10, fontWeight: "800" },
    orderHistoryHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
      flexWrap: "wrap",
      gap: 8,
    },
    filterToggle: { flexDirection: "row", borderRadius: theme.radius.md, padding: 3 },
    filterChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: theme.radius.sm },
    filterChipText: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
    compactOrder: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 12,
      padding: 12,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
    },
    compactThumb: {
      width: 56,
      height: 56,
      borderRadius: theme.radius.md,
    },
    compactThumbPh: { alignItems: "center", justifyContent: "center" },
    compactLeft: { flex: 1, minWidth: 0 },
    compactRight: { alignItems: "flex-end" },
    compactTitle: { fontSize: 16, fontWeight: "700" },
    compactSub: { fontSize: 13, marginTop: 2 },
    compactPrice: { fontSize: 16, fontWeight: "800" },
    compactStatus: { fontSize: 10, fontWeight: "800", marginTop: 4 },
    section: { marginBottom: theme.spacing.lg },
    sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
    sectionBar: { width: 4, height: 24, borderRadius: 2, marginRight: 8 },
    sectionTitle: { fontSize: 20, fontWeight: "700" },
    sectionTitlePast: { fontSize: 18, fontWeight: "600", marginBottom: 12 },
    cardWrap: { marginBottom: 16 },
    card: {
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      overflow: "hidden",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 3,
    },
    cardFeatured: {
      borderColor: theme.colors.primary,
      borderWidth: 1.5,
    },
    cardImageWrap: { height: 120, width: "100%" },
    cardImageWrapFeatured: { height: 140 },
    cardImage: { width: "100%", height: "100%" },
    cardImagePlaceholder: { width: "100%", height: "100%", justifyContent: "center", alignItems: "center" },
    cardBody: { padding: theme.spacing.md },
    cardRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
    orderId: { fontSize: 13, fontWeight: "600", fontFamily: "monospace" },
    badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: theme.radius.md },
    badgeText: { fontSize: 12, fontWeight: "600", color: "#fff" },
    eventName: { fontSize: 18, fontWeight: "600", marginBottom: 4 },
    metaRow: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 2 },
    eventDate: { fontSize: 14, fontWeight: "500" },
    orderDate: { fontSize: 12, marginBottom: 8 },
    cardFooter: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
    amountRow: { flexDirection: "row", alignItems: "center", gap: 4 },
    amount: { fontSize: 18, fontWeight: "700" },
    ticketCount: { fontSize: 14 },
    viewTicketBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderRadius: theme.radius.md,
    },
    viewTicketBtnText: { fontSize: 15, fontWeight: "600" },
    emptyCard: {
      width: "100%",
      maxWidth: 400,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      padding: theme.spacing.xl,
      alignItems: "center",
    },
    emptyIconWrap: {
      width: 80,
      height: 80,
      borderRadius: 40,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: theme.spacing.lg,
    },
    emptyTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
    emptyText: {
      fontSize: 15,
      color: theme.colors.mutedForeground,
      textAlign: "center",
      marginBottom: theme.spacing.lg,
      paddingHorizontal: theme.spacing.md,
    },
    emptyButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingVertical: 14,
      paddingHorizontal: 24,
      borderRadius: theme.radius.md,
    },
    emptyButtonText: { fontSize: 16, fontWeight: "600" },
  });
}
