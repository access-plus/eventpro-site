import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Linking,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../contexts/CartContext";
import { useRecentlyViewed } from "../contexts/RecentlyViewedContext";
import { useTheme } from "../contexts/ThemeContext";
import type { Event, TicketType } from "@eventpro/shared";
import type { Theme } from "../theme";
import * as mobileApi from "../lib/mobileApi";
import { useSimulatedViewers } from "../hooks/useSimulatedViewers";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
    error: { padding: 24, color: theme.colors.mutedForeground },
    cover: { width: "100%", height: 200, backgroundColor: theme.colors.muted },
    coverPlaceholder: { width: "100%", height: 200, backgroundColor: theme.colors.muted, justifyContent: "center", alignItems: "center" },
    coverPlaceholderText: { color: theme.colors.mutedForeground },
    galleryThumbs: { flexGrow: 0, paddingHorizontal: theme.spacing.md, paddingVertical: 8, gap: 8 },
    galleryThumb: { width: 56, height: 56, borderRadius: 8, overflow: "hidden", marginRight: 8, borderWidth: 2, borderColor: "transparent" },
    galleryThumbActive: { borderColor: theme.colors.primary },
    galleryThumbImg: { width: "100%", height: "100%" },
    content: { padding: theme.spacing.md },
    title: { fontSize: 22, fontWeight: "700", marginBottom: 8, color: theme.colors.foreground },
    desc: { fontSize: 15, marginBottom: 12, color: theme.colors.mutedForeground },
    meta: { fontSize: 14, marginBottom: 8, color: theme.colors.mutedForeground },
    videoCta: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: theme.radius.md, alignItems: "center", marginTop: 12, marginBottom: 8 },
    videoCtaText: { fontSize: 15, fontWeight: "600" },
    organizerRow: {
      flexDirection: "row",
      alignItems: "center",
      marginTop: 16,
      marginBottom: 8,
      paddingVertical: 12,
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
    },
    organizerAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: theme.colors.muted },
    organizerAvatarPlaceholder: { justifyContent: "center", alignItems: "center" },
    organizerAvatarText: { fontSize: 16, fontWeight: "600", color: theme.colors.mutedForeground },
    organizerInfo: { marginLeft: 12, flex: 1 },
    organizerLabel: { fontSize: 12, color: theme.colors.mutedForeground, marginBottom: 2 },
    organizerName: { fontSize: 16, fontWeight: "600", color: theme.colors.foreground },
    followBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, backgroundColor: "transparent" },
    followBtnActive: { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary },
    followBtnText: { fontSize: 14, fontWeight: "600", color: theme.colors.foreground },
    followBtnTextActive: { color: theme.colors.primaryForeground },
    contactOrganizerBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, borderStyle: "dashed" },
    contactOrganizerBtnText: { fontSize: 14, fontWeight: "500", color: theme.colors.foreground },
    modalOverlay: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.5)" },
    modalContent: { width: "90%", maxWidth: 400, borderRadius: theme.radius.lg, padding: 24 },
    modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
    modalSent: { marginBottom: 20 },
    inputLabel: { fontSize: 14, fontWeight: "500", marginBottom: 6 },
    contactInput: { borderWidth: 1, borderRadius: theme.radius.md, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, marginBottom: 12 },
    contactMessageInput: { minHeight: 100, textAlignVertical: "top" },
    modalButtons: { flexDirection: "row", justifyContent: "flex-end", gap: 12, marginTop: 16 },
    modalCloseBtn: { paddingVertical: 8 },
    contactSubmitBtn: { paddingVertical: 10, paddingHorizontal: 20, borderRadius: theme.radius.md },
    contactSubmitText: { fontWeight: "600" },
    modalCancelText: { fontSize: 15 },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginTop: 20, marginBottom: 12, color: theme.colors.foreground },
    muted: { marginBottom: 16, color: theme.colors.mutedForeground },
    ticketRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    ticketInfo: { flex: 1 },
    ticketName: { fontSize: 16, fontWeight: "600", color: theme.colors.foreground },
    ticketMeta: { fontSize: 14, marginTop: 2, color: theme.colors.mutedForeground },
    stepper: { flexDirection: "row", alignItems: "center" },
    stepperBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: theme.colors.muted, justifyContent: "center", alignItems: "center" },
    stepperText: { fontSize: 18, fontWeight: "600", color: theme.colors.foreground },
    stepperInput: { width: 40, textAlign: "center", fontSize: 16, marginHorizontal: 8, color: theme.colors.foreground },
    button: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: theme.radius.md, alignItems: "center", marginTop: 24 },
    buttonDisabled: { backgroundColor: theme.colors.muted },
    buttonText: { color: theme.colors.primaryForeground, fontWeight: "600" },
    moreFromOrganizer: { marginTop: 28, paddingTop: 20, borderTopWidth: 1, borderTopColor: theme.colors.border },
    horizontalList: { marginHorizontal: -theme.spacing.md, marginTop: 12 },
    otherEventCard: { width: 140, marginLeft: theme.spacing.md, backgroundColor: theme.colors.card, borderRadius: theme.radius.md, overflow: "hidden", borderWidth: 1, borderColor: theme.colors.border },
    otherEventImage: { width: 140, height: 88, backgroundColor: theme.colors.muted },
    otherEventName: { padding: 8, fontSize: 13, fontWeight: "600", color: theme.colors.foreground },
    viewAllLink: { marginTop: 12, paddingVertical: 8 },
    viewAllLinkText: { fontSize: 14, color: theme.colors.primary, fontWeight: "500" },
    liveBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 6,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 9999,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.3)",
      backgroundColor: "rgba(0,0,0,0.25)",
      marginBottom: 12,
    },
    liveBadgeDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#22d3ee" },
    liveBadgeText: { fontSize: 12, fontWeight: "600", color: theme.colors.foreground },
  });
}

export function EventDetailScreen({
  route,
  navigation,
}: {
  route: { params: { eventId: string } };
  navigation: any;
}) {
  const { theme } = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { api, user } = useAuth();
  const { addItem: addToCart } = useCart();
  const viewers = useSimulatedViewers(route.params.eventId, 8, 32);
  const { addRecentlyViewed } = useRecentlyViewed();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [otherEventsByOrganizer, setOtherEventsByOrganizer] = useState<Event[]>([]);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [contactForm, setContactForm] = useState({ senderName: "", senderEmail: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [followedOrganizerIds, setFollowedOrganizerIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState(false);
  const [organizerProfile, setOrganizerProfile] = useState<mobileApi.OrganizerPublicProfile | null>(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
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
          if (eventData) addRecentlyViewed(eventData);
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
  }, [api, route.params.eventId, addRecentlyViewed]);

  useEffect(() => {
    if (!event?.userId || !route.params.eventId) return;
    api
      .getEvents(1, 6, undefined, event.userId)
      .then((list) => setOtherEventsByOrganizer(list.filter((e) => e.id !== route.params.eventId)))
      .catch(() => setOtherEventsByOrganizer([]));
  }, [api, event?.userId, route.params.eventId]);

  // Load followed organizers only when user is logged in (API requires auth)
  useEffect(() => {
    if (!user || !event?.userId) return;
    mobileApi
      .getFollowing()
      .then((list) => {
        const ids = new Set<string>(
          list.map((o) => String((o as { organizerId?: string }).organizerId ?? (o as { id?: string }).id ?? "")).filter(Boolean)
        );
        setFollowedOrganizerIds(ids);
      })
      .catch(() => setFollowedOrganizerIds(new Set()));
  }, [user, event?.userId]);

  // Retrieve organizer display info from their profile (name, photo)
  useEffect(() => {
    if (!event?.userId) {
      setOrganizerProfile(null);
      return;
    }
    mobileApi
      .getOrganizerPublicProfile(event.userId)
      .then(setOrganizerProfile)
      .catch(() => setOrganizerProfile(null));
  }, [event?.userId]);

  useEffect(() => {
    setGalleryIndex(0);
  }, [event?.id]);

  const organizerFirstName = organizerProfile?.firstName ?? event?.organizerFirstName ?? null;
  const organizerLastName = organizerProfile?.lastName ?? event?.organizerLastName ?? null;
  const organizerProfilePictureUrl = organizerProfile?.profilePictureUrl ?? event?.organizerProfilePictureUrl ?? null;
  const organizerDisplayName = [organizerFirstName, organizerLastName].filter(Boolean).join(" ").trim() || "Event organizer";

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
          await addToCart({
            ticketTypeId: t.id,
            ticketTypeName: t.name,
            eventName: event.name,
            eventId: event.id,
            quantity: qty,
            price: Number(t.price),
          });
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

  const mainImageUrl = (event as any).imageUrl ?? (event as any).coverImageUrl;
  const additionalUrls = (event as any).additionalImageUrls ?? [];
  const galleryImages = mainImageUrl ? [mainImageUrl, ...additionalUrls] : [...additionalUrls];
  const showGallery = galleryImages.length > 1;
  const imageUrl = galleryImages[galleryIndex] ?? mainImageUrl;
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
      {showGallery && galleryImages.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.galleryThumbs}>
          {galleryImages.map((url, i) => (
            <TouchableOpacity key={url + i} onPress={() => setGalleryIndex(i)} style={[styles.galleryThumb, i === galleryIndex && styles.galleryThumbActive]}>
              <Image source={{ uri: url }} style={styles.galleryThumbImg} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : null}
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

        {/* Live viewing badge (matches web) */}
        <View style={[styles.liveBadge, { borderColor: theme.colors.border, backgroundColor: theme.colors.muted + "99" }]}>
          <View style={styles.liveBadgeDot} />
          <Text style={[styles.liveBadgeText, { color: theme.colors.foreground }]}>{viewers} people viewing now</Text>
        </View>

        {/* Promotional video */}
        {event.promotionalVideoUrl ? (
          <TouchableOpacity
            style={[styles.videoCta, { backgroundColor: theme.colors.primary }]}
            onPress={() => Linking.openURL(event.promotionalVideoUrl!)}
          >
            <Text style={[styles.videoCtaText, { color: theme.colors.primaryForeground }]}>Watch promotional video</Text>
          </TouchableOpacity>
        ) : null}

        {/* Organizer — name and avatar (from organizer's profile when available) */}
        {(event.userId || organizerFirstName || organizerLastName) ? (
          <View style={styles.organizerRow}>
            {organizerProfilePictureUrl ? (
              <Image
                source={{ uri: organizerProfilePictureUrl }}
                style={styles.organizerAvatar}
              />
            ) : (
              <View style={[styles.organizerAvatar, styles.organizerAvatarPlaceholder]}>
                <Text style={styles.organizerAvatarText}>
                  {[organizerFirstName, organizerLastName]
                    .filter(Boolean)
                    .map((s) => (s ?? "").charAt(0))
                    .join("") || "?"}
                </Text>
              </View>
            )}
            <View style={styles.organizerInfo}>
              <Text style={styles.organizerLabel}>Organized by</Text>
              <Text style={styles.organizerName}>
                {organizerDisplayName}
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.followBtn,
                followedOrganizerIds.has(event.userId) && styles.followBtnActive,
                followLoading && styles.buttonDisabled,
              ]}
              disabled={followLoading}
              onPress={async () => {
                if (!event.userId) return;
                if (!user) {
                  (navigation as any).getParent()?.getParent()?.navigate("Auth", { screen: "Login" });
                  return;
                }
                setFollowLoading(true);
                try {
                  const organizerId = String(event.userId);
                  if (followedOrganizerIds.has(organizerId)) {
                    await mobileApi.unfollowOrganizer(organizerId);
                    setFollowedOrganizerIds((s) => { const n = new Set(s); n.delete(organizerId); return n; });
                  } else {
                    await mobileApi.followOrganizer(organizerId);
                    setFollowedOrganizerIds((s) => new Set(s).add(organizerId));
                  }
                  // Refetch to stay in sync with backend
                  const list = await mobileApi.getFollowing();
                  const ids = new Set<string>(list.map((o) => String((o as { organizerId?: string }).organizerId ?? (o as { id?: string }).id ?? "")).filter(Boolean));
                  setFollowedOrganizerIds(ids);
                } catch (e) {
                  console.warn("Follow/unfollow failed", e);
                } finally {
                  setFollowLoading(false);
                }
              }}
            >
              <Text style={[styles.followBtnText, followedOrganizerIds.has(event.userId) && styles.followBtnTextActive]}>
                {followLoading ? "…" : followedOrganizerIds.has(event.userId) ? "Followed" : "Follow"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.contactOrganizerBtn}
              onPress={() => { setContactModalVisible(true); setContactSent(false); setContactForm({ senderName: "", senderEmail: "", message: "" }); }}
            >
              <Text style={styles.contactOrganizerBtnText}>Contact organizer</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Contact organizer modal */}
        <Modal visible={contactModalVisible} animationType="slide" transparent>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.foreground }]}>Contact organizer</Text>
              {contactSent ? (
                <>
                  <Text style={[styles.modalSent, { color: theme.colors.mutedForeground }]}>
                    Your message has been sent. The organizer will get back to you by email.
                  </Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setContactModalVisible(false)}>
                    <Text style={styles.viewAllLinkText}>Close</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={[styles.inputLabel, { color: theme.colors.foreground }]}>Your name (optional)</Text>
                  <TextInput
                    style={[styles.contactInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.foreground }]}
                    value={contactForm.senderName}
                    onChangeText={(t) => setContactForm((f) => ({ ...f, senderName: t }))}
                    placeholder="Jane Doe"
                    placeholderTextColor={theme.colors.mutedForeground}
                    maxLength={200}
                  />
                  <Text style={[styles.inputLabel, { color: theme.colors.foreground }]}>Your email *</Text>
                  <TextInput
                    style={[styles.contactInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.foreground }]}
                    value={contactForm.senderEmail}
                    onChangeText={(t) => setContactForm((f) => ({ ...f, senderEmail: t }))}
                    placeholder="you@example.com"
                    placeholderTextColor={theme.colors.mutedForeground}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                  <Text style={[styles.inputLabel, { color: theme.colors.foreground }]}>Message *</Text>
                  <TextInput
                    style={[styles.contactInput, styles.contactMessageInput, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.foreground }]}
                    value={contactForm.message}
                    onChangeText={(t) => setContactForm((f) => ({ ...f, message: t }))}
                    placeholder="Your message to the organizer..."
                    placeholderTextColor={theme.colors.mutedForeground}
                    multiline
                    maxLength={2000}
                  />
                  <View style={styles.modalButtons}>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setContactModalVisible(false)}>
                      <Text style={[styles.modalCancelText, { color: theme.colors.mutedForeground }]}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.contactSubmitBtn, { backgroundColor: theme.colors.primary }]}
                      disabled={contactSubmitting || !contactForm.senderEmail.trim() || !contactForm.message.trim()}
                      onPress={async () => {
                        if (!event?.id || !contactForm.senderEmail.trim() || !contactForm.message.trim()) return;
                        setContactSubmitting(true);
                        try {
                          await api.contactOrganizer(event.id, {
                            senderEmail: contactForm.senderEmail.trim(),
                            senderName: contactForm.senderName.trim() || undefined,
                            message: contactForm.message.trim(),
                          });
                          setContactSent(true);
                        } catch (e) {
                          console.error(e);
                        } finally {
                          setContactSubmitting(false);
                        }
                      }}
                    >
                      <Text style={[styles.contactSubmitText, { color: theme.colors.primaryForeground }]}>
                        {contactSubmitting ? "Sending…" : "Send message"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </KeyboardAvoidingView>
        </Modal>

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

        {/* More from this organizer */}
        {event.userId && otherEventsByOrganizer.length > 0 ? (
          <View style={styles.moreFromOrganizer}>
            <Text style={styles.sectionTitle}>More from this organizer</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalList}>
              {otherEventsByOrganizer.slice(0, 5).map((e) => (
                <TouchableOpacity
                  key={e.id}
                  style={styles.otherEventCard}
                  onPress={() => navigation.navigate("EventDetail", { eventId: e.id })}
                >
                  <Image
                    source={{ uri: (e as any).imageUrl ?? (e as any).coverImageUrl ?? "" }}
                    style={styles.otherEventImage}
                  />
                  <Text style={styles.otherEventName} numberOfLines={2}>{e.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity
              onPress={() => navigation.navigate("EventsList", { organizerId: event.userId })}
              style={styles.viewAllLink}
            >
              <Text style={styles.viewAllLinkText}>View all events by this organizer →</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}
