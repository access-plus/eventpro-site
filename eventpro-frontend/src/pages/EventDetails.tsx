import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Ticket, Minus, Plus, Grid3X3, User } from "lucide-react";
import { Link } from "react-router-dom";
import { apiService } from "@/lib/api";
import type { TicketType } from "@/types/api";
import { useCart } from "@/contexts/CartContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { getEventImageUrl, getPromotionalVideoEmbedUrl } from "@/lib/utils";
import { SeatingMap, generateSampleSeats, Seat } from "@/components/SeatingMap";
import { ShareActionsContainer } from "@/components/ShareActions";
import { LiveAttendanceBadge, useSimulatedViewers } from "@/components/LiveAttendanceBadge";
import { EventCard } from "@/components/EventCard";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  useEventQuery,
  useEventSeatsQuery,
  useOrganizerEventsQuery,
  useTicketTypesQuery,
} from "@/state/events";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [imgError, setImgError] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [ticketMode, setTicketMode] = useState<"general" | "seating">("general");
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactForm, setContactForm] = useState({ senderName: "", senderEmail: "", message: "" });
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactSent, setContactSent] = useState(false);
  const [addingTicketTypeId, setAddingTicketTypeId] = useState<string | null>(null);

  const eventQuery = useEventQuery(id);
  const ticketTypesQuery = useTicketTypesQuery(id);
  const seatsQuery = useEventSeatsQuery(id);
  const event = eventQuery.data ?? null;
  const ticketTypes = ticketTypesQuery.data ?? [];
  const seatResponses = seatsQuery.data ?? [];
  const isLoading = eventQuery.isLoading || ticketTypesQuery.isLoading || seatsQuery.isLoading;
  // Default to seating tab when event has reserved seating (with seats) and no GA types
  useEffect(() => {
    if (event?.reservedSeatingEnabled && seatResponses.length > 0 && ticketTypes.length === 0) {
      setTicketMode("seating");
    }
  }, [event?.reservedSeatingEnabled, seatResponses.length, ticketTypes.length]);
  const { addItem, isLoading: isCartLoading } = useCart();
  const { addRecentlyViewed } = usePreferences();
  const { isAuthenticated } = useAuth();
  const [followedOrganizerIds, setFollowedOrganizerIds] = useState<Set<string>>(new Set());
  const [followLoading, setFollowLoading] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const otherEventsQuery = useOrganizerEventsQuery(event?.userId);
  const otherEventsByOrganizer = useMemo(
    () => (otherEventsQuery.data ?? []).filter((otherEvent) => otherEvent.id !== id),
    [otherEventsQuery.data, id]
  );

  // Reserved seating: map API seats to SeatingMap Seat format
  const seatsFromApi = useMemo(() => {
    return seatResponses.map((s): Seat => ({
      id: s.id,
      section: s.section,
      row: s.row,
      number: s.seatNumber,
      price: typeof s.price === "number" ? s.price : Number(s.price),
      status: (s.status === "AVAILABLE" ? "available" : s.status === "SOLD" ? "sold" : "reserved") as Seat["status"],
      type: "standard",
    }));
  }, [seatResponses]);

  const hasReservedSeating = Boolean(event?.reservedSeatingEnabled && seatsFromApi.length > 0);
  const galleryImages = useMemo(() => {
    if (!event) return [];
    const main = event.imageUrl ? [event.imageUrl] : [];
    const extra = event.additionalImageUrls ?? [];
    return [...main, ...extra].filter(Boolean);
  }, [event?.imageUrl, event?.additionalImageUrls]);
  const showGallery = galleryImages.length > 1;
  const heroImageSrc = useMemo(() => {
    if (galleryImages.length > 0) return galleryImages[galleryIndex] ?? "";
    return event?.imageUrl ?? "";
  }, [galleryImages, galleryIndex, event?.imageUrl]);
  /** Event has reserved seating enabled but organizer hasn't created a seat map yet */
  const reservedSeatingPending = Boolean(event?.reservedSeatingEnabled && seatsFromApi.length === 0);
  const showSeatingTab = hasReservedSeating || reservedSeatingPending;
  const sampleSeats = useMemo(() => generateSampleSeats(), []);

  // Live badge: simulated viewers; ticket stats for urgency/sold copy
  const viewers = useSimulatedViewers(id ?? "", 8, 32);
  const { ticketsLeft, ticketsSold } = useMemo(() => {
    let left = 0;
    let sold = 0;
    ticketTypes.forEach((t) => {
      left += t.availableQuantity ?? 0;
      sold += (t.totalQuantity ?? 0) - (t.availableQuantity ?? 0);
    });
    if (hasReservedSeating) {
      seatsFromApi.forEach((s) => {
        if (s.status === "available") left += 1;
        else if (s.status === "sold") sold += 1;
      });
    }
    return { ticketsLeft: left, ticketsSold: sold };
  }, [ticketTypes, hasReservedSeating, seatsFromApi]);

  const minTicketPrice = useMemo(() => {
    const prices = ticketTypes.map((t) => t.price);
    if (hasReservedSeating && seatsFromApi.length) {
      seatsFromApi.forEach((s) => {
        if (s.status === "available") prices.push(s.price);
      });
    }
    if (!prices.length) return null;
    return Math.min(...prices);
  }, [ticketTypes, hasReservedSeating, seatsFromApi]);

  useEffect(() => {
    if (!id) return;
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshInventory();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [id]);

  useEffect(() => {
    if (event) {
      addRecentlyViewed(event);
    }
  }, [event?.id, addRecentlyViewed]);

  useEffect(() => {
    setQuantities((prev) => {
      const next = { ...prev };
      ticketTypes.forEach((ticketType) => {
        const selected = next[ticketType.id] ?? 0;
        const available = ticketType.availableQuantity ?? 0;
        if (selected > available) {
          next[ticketType.id] = available;
        }
      });
      return next;
    });
  }, [ticketTypes]);

  // Load followed organizers when logged in (for Follow/Unfollow button)
  useEffect(() => {
    if (!isAuthenticated || !event?.userId) return;
    apiService.getFollowing().then((list) => setFollowedOrganizerIds(new Set(list.map((o) => o.organizerId))));
  }, [isAuthenticated, event?.userId]);

  const refreshInventory = async () => {
    if (!id) return;
    try {
      await Promise.all([ticketTypesQuery.refetch(), seatsQuery.refetch()]);
    } catch (error) {
      console.error("Failed to refresh ticket inventory:", error);
    }
  };

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] || 0;
      const available = ticketTypes.find((ticket) => ticket.id === ticketTypeId)?.availableQuantity ?? 0;
      const newValue = Math.min(available, Math.max(0, current + delta));
      return { ...prev, [ticketTypeId]: newValue };
    });
  };

  const handleAddToCart = async (ticketType: TicketType) => {
    const quantity = quantities[ticketType.id] || 0;
    const available = ticketType.availableQuantity ?? 0;
    if (quantity > available) {
      toast.error(`Only ${available} ticket${available === 1 ? "" : "s"} left. Quantity adjusted.`);
      setQuantities((prev) => ({ ...prev, [ticketType.id]: available }));
      return;
    }
    const quantityToAdd = Math.min(quantity, available);
    if (quantityToAdd > 0) {
      setAddingTicketTypeId(ticketType.id);
      try {
        const added = await addItem({
          ticketTypeId: ticketType.id,
          ticketTypeName: ticketType.name,
          eventName: event?.name || "",
          eventId: event?.id || "",
          quantity: quantityToAdd,
          price: ticketType.price,
        });
        if (added) {
          setQuantities((prev) => ({ ...prev, [ticketType.id]: 0 }));
        } else {
          await refreshInventory();
        }
      } finally {
        await refreshInventory();
        setAddingTicketTypeId(null);
      }
    }
  };

  const handleSeatSelect = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  const handleAddSeatsToCart = async () => {
    if (selectedSeats.length > 0 && event) {
      const results = await Promise.all(
        selectedSeats.map((seat) =>
          addItem({
          ticketTypeId: seat.id,
          ticketTypeName: `${seat.section} - Row ${seat.row}, Seat ${seat.number}`,
          eventName: event.name,
          eventId: event.id,
          quantity: 1,
          price: seat.price,
          })
        )
      );
      setSelectedSeats([]);
      if (results.some((added) => !added)) {
        await refreshInventory();
      }
      await refreshInventory();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="h-[min(70vh,28rem)] w-full bg-muted animate-pulse" />
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 w-2/3 rounded-lg bg-muted animate-pulse" />
              <div className="h-24 rounded-xl bg-muted animate-pulse" />
              <div className="h-40 rounded-xl bg-muted animate-pulse" />
            </div>
            <div className="h-96 rounded-2xl bg-muted animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-8 text-center">
          <h2 className="text-2xl font-bold mb-2">Event not found</h2>
          <p className="text-muted-foreground mb-4">This event doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/events")}>Browse Events</Button>
        </Card>
      </div>
    );
  }

  const template = (event.eventPageTemplate ?? "DEFAULT").toUpperCase();
  const isMinimal = template === "MINIMAL";
  const isVibrant = template === "VIBRANT";
  const primaryColor = event.organizerBrandingPrimaryColor || undefined;
  const showOrganizerLogo = Boolean(event.organizerBrandingLogoUrl);
  const hidePlatformBranding = Boolean(event.organizerBrandingHidePlatform);

  // Convert hex to HSL "H S% L%" for theme --primary (so buttons/badges use organizer color)
  const primaryHsl = primaryColor && /^#[0-9A-Fa-f]{6}$/.test(primaryColor)
    ? (() => {
        const r = parseInt(primaryColor.slice(1, 3), 16) / 255;
        const g = parseInt(primaryColor.slice(3, 5), 16) / 255;
        const b = parseInt(primaryColor.slice(5, 7), 16) / 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h = 0, s = 0, l = (max + min) / 2;
        if (max !== min) {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
          else if (max === g) h = ((b - r) / d + 2) / 6;
          else h = ((r - g) / d + 4) / 6;
        }
        h = Math.round(h * 360);
        s = Math.round(s * 100);
        l = Math.round(l * 100);
        return `${h} ${s}% ${l}%`;
      })()
    : undefined;

  const brandingStyle: React.CSSProperties | undefined =
    primaryHsl ? { ["--primary"]: primaryHsl, ["--ring"]: primaryHsl } as React.CSSProperties : undefined;

  return (
    <div
      className="min-h-screen bg-background font-body"
      data-event-template={template}
      style={brandingStyle}
    >
      <section className="relative min-h-[min(72vh,36rem)] lg:min-h-[min(88vh,52rem)] w-full overflow-hidden bg-[#14052b]">
        {heroImageSrc && !imgError ? (
          <img
            src={getEventImageUrl(heroImageSrc) ?? ""}
            alt=""
            className="absolute inset-0 w-full h-full object-cover opacity-90"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="absolute inset-0 bg-muted flex items-center justify-center">
            <Ticket className="h-24 w-24 text-muted-foreground/50" />
          </div>
        )}
        <div className="absolute inset-0 editorial-gradient" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-transparent pointer-events-none" />
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8 h-full min-h-[min(72vh,36rem)] lg:min-h-[min(88vh,52rem)] flex flex-col justify-end pb-10 md:pb-16 pt-20 md:pt-28">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
            <div className="max-w-3xl">
              <div className="flex flex-wrap gap-2 mb-4">
                {(event.categoryName || event.category) && (
                  <Badge className="bg-[hsl(330_81%_75%)]/90 text-[#63033a] border-0 font-headline text-[10px] uppercase tracking-widest">
                    {event.categoryName || event.category}
                  </Badge>
                )}
                {event.status && (
                  <Badge variant="outline" className="bg-white/15 backdrop-blur-md border-white/30 text-white font-headline text-[10px] uppercase tracking-widest">
                    {event.status}
                  </Badge>
                )}
              </div>
              <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-extrabold text-white tracking-tighter leading-[1.05] mb-4">
                {event.name}
              </h1>
              {event.description && (
                <p className="text-white/85 text-base md:text-lg max-w-xl line-clamp-3 font-body">
                  {event.description}
                </p>
              )}
            </div>
            <div className="flex flex-col gap-4 w-full lg:w-auto lg:min-w-[280px]">
              <div className="rounded-2xl border border-white/15 bg-white/10 backdrop-blur-xl p-5 md:p-6 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shrink-0">
                  <Calendar className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-white/55 text-[10px] font-bold uppercase tracking-widest font-headline">Date &amp; time</p>
                  <p className="text-white font-bold font-headline">
                    {(() => {
                      const raw = event.startTime ?? event.startDateTime;
                      const d = raw ? new Date(raw) : null;
                      if (!d || Number.isNaN(d.getTime())) return "TBD";
                      return `${format(d, "MMM d, yyyy")} · ${format(d, "p")}`;
                    })()}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                size="lg"
                className="rounded-full px-10 py-6 text-lg font-headline font-bold shadow-[0_20px_40px_rgba(93,63,211,0.35)] bg-primary hover:bg-primary/90"
                onClick={() => document.getElementById("event-tickets")?.scrollIntoView({ behavior: "smooth" })}
              >
                Get tickets
                {minTicketPrice != null && ` — From $${minTicketPrice.toFixed(0)}`}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {showOrganizerLogo && (
        <div className="container mx-auto px-4 pb-4 flex justify-center">
          <img
            src={event.organizerBrandingLogoUrl!}
            alt="Organizer logo"
            className="h-10 object-contain"
          />
        </div>
      )}
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isVibrant ? "lg:gap-10" : ""}`}
        >
          {/* Event Details — template affects layout (MINIMAL: more whitespace; VIBRANT: accent) */}
          <div
            className={`lg:col-span-2 space-y-6 ${
              isMinimal ? "space-y-8 max-w-2xl" : ""
            } ${isVibrant ? "rounded-2xl p-4 md:p-6 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/5" : ""}`}
          >
            {showGallery ? (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 hide-scrollbar">
                {galleryImages.map((url, i) => (
                  <button
                    key={url + i}
                    type="button"
                    onClick={() => setGalleryIndex(i)}
                    className={`shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === galleryIndex ? "border-primary ring-2 ring-primary/30" : "border-transparent opacity-80 hover:opacity-100"
                    }`}
                  >
                    <img src={getEventImageUrl(url) ?? ""} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            <div>
              <h2 className="font-headline text-2xl md:text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-4 mb-6">
                About the experience
                <span className="h-px flex-1 bg-border" />
              </h2>
              {event.description && (
                <div className="prose prose-lg max-w-none dark:prose-invert text-muted-foreground leading-relaxed">
                  <p className="whitespace-pre-wrap">{event.description}</p>
                </div>
              )}

              {(event.venue || event.addressCity || event.addressState) && (
                <div className="flex flex-wrap gap-4 text-muted-foreground mt-6 text-sm md:text-base">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary shrink-0" />
                    <span>
                      {[event.venue, event.addressCity, event.addressState].filter(Boolean).join(", ")}
                    </span>
                  </div>
                </div>
              )}

              {/* Organizer — name, avatar, link to more events, contact */}
              {(event.userId || event.organizerFirstName || event.organizerLastName) && (
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 py-3 border-t border-b border-border/60">
                  {event.organizerProfilePictureUrl ? (
                    <img
                      src={event.organizerProfilePictureUrl}
                      alt=""
                      className="h-12 w-12 rounded-full object-cover bg-muted"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center">
                      <User className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-muted-foreground">Organized by</p>
                    {event.userId ? (
                      <Link
                        to={`/events?organizerId=${event.userId}`}
                        className="font-semibold text-foreground hover:text-primary hover:underline truncate block"
                      >
                        {[event.organizerFirstName, event.organizerLastName].filter(Boolean).join(" ") || "Organizer"}
                      </Link>
                    ) : (
                      <span className="font-semibold text-foreground truncate block">
                        {[event.organizerFirstName, event.organizerLastName].filter(Boolean).join(" ") || "Organizer"}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {isAuthenticated && event.userId && (
                      <Button
                        variant={followedOrganizerIds.has(event.userId) ? "default" : "outline"}
                        size="sm"
                        disabled={followLoading}
                        className={followedOrganizerIds.has(event.userId) ? "bg-primary text-primary-foreground" : ""}
                        onClick={async () => {
                          if (!event.userId) return;
                          setFollowLoading(true);
                          try {
                            const name = [event.organizerFirstName, event.organizerLastName].filter(Boolean).join(" ") || "this organizer";
                            if (followedOrganizerIds.has(event.userId)) {
                              await apiService.unfollowOrganizer(event.userId);
                              setFollowedOrganizerIds((s) => { const n = new Set(s); n.delete(event.userId!); return n; });
                              toast.success(`Unfollowed ${name}`);
                            } else {
                              await apiService.followOrganizer(event.userId);
                              setFollowedOrganizerIds((s) => new Set(s).add(event.userId!));
                              toast.success(`Following ${name}. See them in Following.`);
                            }
                          } finally {
                            setFollowLoading(false);
                          }
                        }}
                      >
                        {followLoading ? "…" : followedOrganizerIds.has(event.userId) ? "Followed" : "Follow"}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="border border-dashed border-input" onClick={() => { setContactDialogOpen(true); setContactSent(false); setContactForm({ senderName: "", senderEmail: "", message: "" }); }}>
                      Contact organizer
                    </Button>
                  </div>
                </div>
              )}

              {/* Contact organizer dialog */}
              <Dialog open={contactDialogOpen} onOpenChange={setContactDialogOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Contact organizer</DialogTitle>
                  </DialogHeader>
                  {contactSent ? (
                    <p className="text-muted-foreground py-4">Your message has been sent. The organizer will get back to you by email.</p>
                  ) : (
                    <form
                      className="space-y-4"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        if (!event?.id || !contactForm.senderEmail.trim() || !contactForm.message.trim()) return;
                        setContactSubmitting(true);
                        try {
                          await apiService.contactOrganizer(event.id, {
                            senderEmail: contactForm.senderEmail.trim(),
                            senderName: contactForm.senderName.trim() || undefined,
                            message: contactForm.message.trim(),
                          });
                          setContactSent(true);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setContactSubmitting(false);
                        }
                      }}
                    >
                      <div className="space-y-2">
                        <Label htmlFor="contact-name">Your name (optional)</Label>
                        <Input
                          id="contact-name"
                          value={contactForm.senderName}
                          onChange={(e) => setContactForm((f) => ({ ...f, senderName: e.target.value }))}
                          placeholder="Jane Doe"
                          maxLength={200}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-email">Your email *</Label>
                        <Input
                          id="contact-email"
                          type="email"
                          required
                          value={contactForm.senderEmail}
                          onChange={(e) => setContactForm((f) => ({ ...f, senderEmail: e.target.value }))}
                          placeholder="you@example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="contact-message">Message *</Label>
                        <textarea
                          id="contact-message"
                          required
                          value={contactForm.message}
                          onChange={(e) => setContactForm((f) => ({ ...f, message: e.target.value }))}
                          placeholder="Your message to the organizer..."
                          className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                          maxLength={2000}
                        />
                      </div>
                      <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setContactDialogOpen(false)}>Cancel</Button>
                        <Button type="submit" disabled={contactSubmitting}>{contactSubmitting ? "Sending…" : "Send message"}</Button>
                      </DialogFooter>
                    </form>
                  )}
                </DialogContent>
              </Dialog>

              {/* Promotional video (YouTube/Vimeo embed) — Basic theming, all tiers */}
              {event.promotionalVideoUrl && getPromotionalVideoEmbedUrl(event.promotionalVideoUrl) && (
                <div className="rounded-xl overflow-hidden bg-muted/50 aspect-video max-w-2xl">
                  <iframe
                    title={`Promotional video for ${event.name}`}
                    src={getPromotionalVideoEmbedUrl(event.promotionalVideoUrl)!}
                    className="w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              )}

              {/* Share — Vibrant Bento tile with tracking */}
              <div className="mt-6">
                <ShareActionsContainer
                  variant="bento"
                  url={typeof window !== "undefined" ? `${window.location.origin}/events/${event.id}` : `/events/${event.id}`}
                  title={event.name}
                  description={event.description ?? undefined}
                  eventDate={(() => {
                    const raw = event.startTime ?? event.startDateTime;
                    const d = raw ? new Date(raw) : null;
                    if (!d || Number.isNaN(d.getTime())) return undefined;
                    return format(d, "EEEE, MMM d 'at' p");
                  })()}
                />
              </div>
            </div>
          </div>

          {/* Ticket Selection */}
          <div id="event-tickets" className="space-y-4 scroll-mt-24">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <h2 className="text-2xl font-bold">Tickets</h2>
              {/* Live badge — nudge next to CTA area */}
              <LiveAttendanceBadge
                placement="details"
                variant={
                  ticketTypes.length > 0 && ticketsLeft > 0 && ticketsLeft <= 15
                    ? "urgency"
                    : ticketTypes.length > 0 && ticketsSold > 0
                      ? "sold"
                      : "viewing"
                }
                count={
                  ticketTypes.length > 0 && ticketsLeft > 0 && ticketsLeft <= 15
                    ? ticketsLeft
                    : ticketTypes.length > 0 && ticketsSold > 0
                      ? ticketsSold
                      : viewers
                }
              />
            </div>

            {/* Tabs: General Admission and/or Select Seats (when event has reserved seating) */}
            <Tabs value={ticketMode} onValueChange={(v) => setTicketMode(v as "general" | "seating")}>
              <TabsList className={ticketTypes.length > 0 && showSeatingTab ? "grid w-full grid-cols-2" : ""}>
                {(ticketTypes.length > 0 || !showSeatingTab) && (
                  <TabsTrigger value="general" className="flex items-center gap-2">
                    <Ticket className="h-4 w-4" />
                    General Admission
                  </TabsTrigger>
                )}
                {showSeatingTab && (
                  <TabsTrigger value="seating" className="flex items-center gap-2">
                    <Grid3X3 className="h-4 w-4" />
                    Select Seats
                  </TabsTrigger>
                )}
              </TabsList>

              {/* General Admission Tab */}
              <TabsContent value="general" className="space-y-4 mt-4">
                {ticketTypes.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Ticket className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No tickets available</p>
                  </Card>
                ) : (
                  ticketTypes.map((ticketType) => (
                    <Card key={ticketType.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                          <CardTitle className="text-lg">{ticketType.name}</CardTitle>
                          <Badge variant={ticketType.status === "SOLD_OUT" ? "destructive" : "secondary"}>
                            {ticketType.status === "SOLD_OUT" ? "Sold Out" : `${ticketType.availableQuantity} left`}
                          </Badge>
                        </div>
                        {ticketType.description && (
                          <CardDescription>{ticketType.description}</CardDescription>
                        )}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-2xl font-bold">
                          ${ticketType.price.toFixed(2)}
                        </div>

                        {ticketType.status !== "SOLD_OUT" && (
                          <>
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(ticketType.id, -1)}
                                  disabled={(quantities[ticketType.id] || 0) <= 0}
                                >
                                  <Minus className="h-4 w-4" />
                                </Button>
                                <span className="w-8 text-center font-medium">
                                  {quantities[ticketType.id] || 0}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  onClick={() => updateQuantity(ticketType.id, 1)}
                                  disabled={(quantities[ticketType.id] || 0) >= ticketType.availableQuantity}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <Button
                              className="w-full bg-gradient-primary"
                              disabled={
                                (quantities[ticketType.id] || 0) <= 0 ||
                                addingTicketTypeId === ticketType.id ||
                                isCartLoading
                              }
                              onClick={() => handleAddToCart(ticketType)}
                            >
                              <Ticket className="mr-2 h-4 w-4" />
                              {addingTicketTypeId === ticketType.id ? "Reserving..." : "Add to Cart"}
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Seating Map Tab - real seats when reserved seating, else sample or "coming soon" */}
              <TabsContent value="seating" className="mt-4">
                {reservedSeatingPending ? (
                  <Card className="p-6 text-center">
                    <Grid3X3 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Seat map is being set up. Check back soon.</p>
                  </Card>
                ) : (
                  <SeatingMap
                    seats={hasReservedSeating ? seatsFromApi : sampleSeats}
                    onSeatSelect={handleSeatSelect}
                    maxSeats={8}
                    venueName={event?.venue || "Main Venue"}
                  />
                )}
                
                {hasReservedSeating && selectedSeats.length > 0 && (
                  <Button
                    className="w-full mt-4 bg-gradient-primary"
                    size="lg"
                    onClick={handleAddSeatsToCart}
                  >
                    <Ticket className="mr-2 h-4 w-4" />
                    Add {selectedSeats.length} Seat{selectedSeats.length > 1 ? "s" : ""} to Cart - $
                    {selectedSeats.reduce((sum, s) => sum + s.price, 0).toFixed(2)}
                  </Button>
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* More from this organizer — full-width row */}
          {event.userId && otherEventsByOrganizer.length > 0 && (
            <div className="lg:col-span-3 mt-10 pt-8 border-t border-border/60">
              <h2 className="text-2xl font-bold mb-4">More from this organizer</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherEventsByOrganizer.slice(0, 3).map((e, index) => (
                  <EventCard key={e.id} event={e} index={index} />
                ))}
              </div>
              <div className="mt-4">
                <Link
                  to={`/events?organizerId=${event.userId}`}
                  className="text-primary font-medium hover:underline"
                >
                  View all events by this organizer →
                </Link>
              </div>
            </div>
          )}
        </motion.div>
      </div>
      {!hidePlatformBranding && (
        <p className="text-center text-muted-foreground text-sm mt-8 pb-4">
          Powered by Access Plus
        </p>
      )}
    </div>
  );
};

export default EventDetails;
