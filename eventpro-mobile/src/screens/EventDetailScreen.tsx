import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { Event, TicketType } from "@eventpro/shared";

export function EventDetailScreen({
  route,
  navigation,
}: {
  route: { params: { eventId: string } };
  navigation: any;
}) {
  const { api } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      api.getEvent(route.params.eventId),
      api.getTicketTypes(route.params.eventId),
    ])
      .then(([eventData, tickets]) => {
        if (!cancelled) {
          setEvent(eventData);
          setTicketTypes(tickets);
          const initial: Record<string, number> = {};
          tickets.forEach((t) => (initial[t.id] = 0));
          setQuantities(initial);
        }
      })
      .catch(() => {
        if (!cancelled) setEvent(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [api, route.params.eventId]);

  const setQty = (ticketId: string, delta: number) => {
    const t = ticketTypes.find((x) => x.id === ticketId);
    if (!t) return;
    setQuantities((prev) => {
      const next = (prev[ticketId] ?? 0) + delta;
      const clamped = Math.max(0, Math.min(next, t.availableQuantity ?? t.totalQuantity));
      return { ...prev, [ticketId]: clamped };
    });
  };

  const totalTickets = Object.values(quantities).reduce((a, b) => a + b, 0);
  const canAddToCart = totalTickets > 0;

  // Backend GET /ticket-types returns id as enum name ("EARLY_BIRD", "VIP", "REGULAR"), not UUID.
  // Add-to-cart expects either id (ticket UUID) or eventIdType + ticketType (enum).
  const isUuid = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

  const handleAddToCartAndContinue = async () => {
    if (!canAddToCart || !event) return;
    setAdding(true);
    try {
      for (const t of ticketTypes) {
        const qty = quantities[t.id] ?? 0;
        if (qty > 0) {
          if (isUuid(t.id)) {
            await api.addToCart({ id: t.id, quantity: qty });
          } else {
            await api.addToCart({
              eventIdType: event.id,
              ticketType: t.id as "VIP" | "REGULAR" | "EARLY_BIRD",
              quantity: qty,
            });
          }
        }
      }
      navigation.navigate("Checkout", { eventId: event.id });
    } catch (e) {
      console.error(e);
    } finally {
      setAdding(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }
  if (!event) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>Event not found.</Text>
      </View>
    );
  }

  const imageUrl = (event as any).imageUrl ?? (event as any).coverImageUrl;
  const startTime = event.startTime ?? (event as any).startDateTime;

  return (
    <ScrollView style={styles.container}>
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.cover} resizeMode="cover" />
      ) : (
        <View style={styles.coverPlaceholder}>
          <Text style={styles.coverPlaceholderText}>No image</Text>
        </View>
      )}
      <View style={styles.content}>
        <Text style={styles.title}>{event.name}</Text>
        {event.description ? (
          <Text style={styles.desc} numberOfLines={5}>
            {event.description}
          </Text>
        ) : null}
        {startTime ? (
          <Text style={styles.meta}>
            {new Date(startTime).toLocaleString(undefined, {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </Text>
        ) : null}
        {(event as any).venue ? (
          <Text style={styles.meta}>{(event as any).venue}</Text>
        ) : null}

        <Text style={styles.sectionTitle}>Tickets</Text>
        {ticketTypes.length === 0 ? (
          <Text style={styles.muted}>No ticket types available.</Text>
        ) : (
          ticketTypes.map((t) => (
            <View key={t.id} style={styles.ticketRow}>
              <View style={styles.ticketInfo}>
                <Text style={styles.ticketName}>{t.name}</Text>
                <Text style={styles.ticketMeta}>
                  ${Number(t.price).toFixed(2)}
                  {t.availableQuantity != null && (
                    <> · {t.availableQuantity} left</>
                  )}
                </Text>
              </View>
              <View style={styles.stepper}>
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQty(t.id, -1)}
                  disabled={(quantities[t.id] ?? 0) <= 0}
                >
                  <Text style={styles.stepperText}>−</Text>
                </TouchableOpacity>
                <TextInput
                  style={styles.stepperInput}
                  value={String(quantities[t.id] ?? 0)}
                  editable={false}
                />
                <TouchableOpacity
                  style={styles.stepperBtn}
                  onPress={() => setQty(t.id, 1)}
                  disabled={(quantities[t.id] ?? 0) >= (t.availableQuantity ?? t.totalQuantity)}
                >
                  <Text style={styles.stepperText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        <TouchableOpacity
          style={[styles.button, (!canAddToCart || adding) && styles.buttonDisabled]}
          onPress={handleAddToCartAndContinue}
          disabled={!canAddToCart || adding}
        >
          <Text style={styles.buttonText}>
            {adding ? "Adding…" : canAddToCart ? "Add to cart & continue" : "Select tickets"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center" },
  error: { padding: 24, color: "#666" },
  cover: { width: "100%", height: 200, backgroundColor: "#eee" },
  coverPlaceholder: { width: "100%", height: 200, backgroundColor: "#eee", justifyContent: "center", alignItems: "center" },
  coverPlaceholderText: { color: "#999" },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  desc: { fontSize: 15, color: "#444", marginBottom: 12 },
  meta: { fontSize: 14, color: "#666", marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 12 },
  muted: { color: "#888", marginBottom: 16 },
  ticketRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  ticketInfo: { flex: 1 },
  ticketName: { fontSize: 16, fontWeight: "600" },
  ticketMeta: { fontSize: 14, color: "#666", marginTop: 2 },
  stepper: { flexDirection: "row", alignItems: "center" },
  stepperBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f0f0f0", justifyContent: "center", alignItems: "center" },
  stepperText: { fontSize: 18, fontWeight: "600", color: "#333" },
  stepperInput: { width: 40, textAlign: "center", fontSize: 16, marginHorizontal: 8 },
  button: { backgroundColor: "#0a0a0a", padding: 16, borderRadius: 8, alignItems: "center", marginTop: 24 },
  buttonDisabled: { backgroundColor: "#ccc" },
  buttonText: { color: "#fff", fontWeight: "600" },
});
