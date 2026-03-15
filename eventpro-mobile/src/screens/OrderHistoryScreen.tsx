import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../contexts/ThemeContext";
import type { Order, Event } from "@eventpro/shared";
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
  switch (status) {
    case "COMPLETED": return "Confirmed";
    case "PENDING": return "Pending";
    case "CANCELLED": return "Cancelled";
    case "REFUNDED": return "Refunded";
    default: return status;
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "COMPLETED": return "#22c55e";
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

export function OrderHistoryScreen({ navigation }: { navigation: any }) {
  const { api } = useAuth();
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const [orders, setOrders] = useState<OrderWithMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await api.getOrders(1, 50);
        const rawList = Array.isArray(data) ? data : [];
        const normalized = rawList.map((o) => normalizeOrder(o as Record<string, unknown>)) as OrderWithMeta[];

        const eventIds = new Set<string>();
        normalized.forEach((o) => {
          (o.tickets ?? []).forEach((t: any) => {
            if (t.eventId) eventIds.add(t.eventId);
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
          const firstTicket = (o.tickets ?? [])[0] as { eventId?: string } | undefined;
          const event = firstTicket?.eventId ? eventsMap[firstTicket.eventId] : undefined;
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

  if (orders.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.colors.background }]}>
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
      </View>
    );
  }

  const renderOrderCard = (order: OrderWithMeta, isFeatured: boolean) => {
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
              Order #{order.id.slice(0, 8)}
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
      <Text style={[styles.pageTitle, { color: theme.colors.foreground }]}>Order History</Text>
      <Text style={[styles.pageSubtitle, { color: theme.colors.mutedForeground }]}>
        Your tickets and order details
      </Text>

      {upcoming.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View style={[styles.sectionBar, { backgroundColor: theme.colors.primary }]} />
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Upcoming</Text>
          </View>
          {upcoming.map((order) => (
            <View key={order.id} style={styles.cardWrap}>
              {renderOrderCard(order, true)}
            </View>
          ))}
        </View>
      )}

      {past.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitlePast, { color: theme.colors.mutedForeground }]}>Past</Text>
          {past.map((order) => (
            <View key={order.id} style={styles.cardWrap}>
              {renderOrderCard(order, false)}
            </View>
          ))}
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
    pageTitle: { fontSize: 28, fontWeight: "800", marginBottom: 4 },
    pageSubtitle: { fontSize: 15, marginBottom: theme.spacing.lg },
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
    emptyContainer: { flex: 1, padding: theme.spacing.md, justifyContent: "center", alignItems: "center" },
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
