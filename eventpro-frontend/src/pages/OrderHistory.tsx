import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { apiService } from "@/lib/api";
import { getEventImageUrl } from "@/lib/utils";
import type { Order, Event, Ticket as TicketType } from "@/types/api";
import { Ticket, Calendar, DollarSign, Download, CalendarPlus, QrCode, Check } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

type OrderWithMeta = Order & {
  _dateLabel?: string;
  _event?: Event;
  _eventDate?: Date;
};

function normalizeOrder(raw: Record<string, unknown>): Order {
  const totalAmount =
    typeof raw.totalAmount === "number"
      ? raw.totalAmount
      : typeof raw.amount === "number"
        ? raw.amount / 100
        : 0;
  const tickets = Array.isArray(raw.tickets) ? raw.tickets : Array.isArray(raw.orderItems) ? raw.orderItems : [];
  const createdAt = (raw.createdAt ?? raw.orderDate) as string | undefined;
  let dateLabel = "—";
  if (createdAt) {
    const d = new Date(createdAt);
    if (!Number.isNaN(d.getTime())) dateLabel = format(d, "PPP");
  }
  return {
    id: String(raw.id ?? ""),
    userId: String(raw.userId ?? ""),
    totalAmount,
    status: (raw.status as Order["status"]) ?? "COMPLETED",
    createdAt: createdAt ?? "",
    tickets,
    _dateLabel: dateLabel,
  } as Order & { _dateLabel?: string };
}

function getStatusLabel(status: Order["status"]) {
  switch (status) {
    case "COMPLETED":
      return "Confirmed";
    case "PENDING":
      return "Pending";
    case "CANCELLED":
      return "Cancelled";
    case "REFUNDED":
      return "Refunded";
    default:
      return status;
  }
}

function getStatusBadgeClass(status: Order["status"]) {
  switch (status) {
    case "COMPLETED":
      return "bg-emerald-400 dark:bg-emerald-400 text-white border border-emerald-300/50 shadow-[0_0_14px_hsl(142_70%_45%_/_0.7),0_0_24px_hsl(142_70%_45%_/_0.3)]";
    case "PENDING":
      return "bg-amber-400/90 text-white border border-amber-300/50";
    case "CANCELLED":
      return "bg-destructive/90 text-destructive-foreground";
    case "REFUNDED":
      return "bg-muted text-muted-foreground";
    default:
      return "bg-secondary text-secondary-foreground";
  }
}

const OrderHistory = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderWithMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTicketOrderId, setViewTicketOrderId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await apiService.getOrders();
        const normalized = (Array.isArray(data) ? data : []).map((o) =>
          normalizeOrder(o as Record<string, unknown>)
        ) as OrderWithMeta[];

        const eventIds = new Set<string>();
        normalized.forEach((o) => {
          o.tickets?.forEach((t: { eventId?: string }) => {
            if (t.eventId) eventIds.add(t.eventId);
          });
        });
        const eventsMap: Record<string, Event> = {};
        await Promise.all(
          Array.from(eventIds).map(async (id) => {
            try {
              const ev = await apiService.getEvent(id);
              if (!cancelled) eventsMap[id] = ev;
            } catch {
              // ignore
            }
          })
        );

        normalized.forEach((o) => {
          const firstTicket = o.tickets?.[0] as TicketType | undefined;
          const event = firstTicket?.eventId ? eventsMap[firstTicket.eventId] : undefined;
          o._event = event;
          if (event?.startTime) {
            const d = new Date(event.startTime);
            o._eventDate = Number.isNaN(d.getTime()) ? undefined : d;
          }
        });

        if (!cancelled) setOrders(normalized);
      } catch (error) {
        console.error("Failed to load orders:", error);
        if (!cancelled) setOrders([]);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

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

  const viewTicketOrder = viewTicketOrderId ? orders.find((o) => o.id === viewTicketOrderId) : null;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl md:text-5xl font-extrabold font-heading tracking-tight mb-2 bg-gradient-primary bg-clip-text text-transparent">
          Order History
        </h1>
        <p className="text-muted-foreground mb-8">
          Your tickets and order details
        </p>

        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden relative"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-primary/3 to-accent/8 pointer-events-none" />
            <Card className="relative p-12 text-center border-0 bg-white/70 dark:bg-white/10 backdrop-blur-md">
              <div className="mx-auto mb-6 w-28 h-28 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center ring-4 ring-primary/10">
                <Ticket className="h-14 w-14 text-primary" />
              </div>
              <h3 className="text-2xl font-bold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Your order history will appear here after your first purchase. Discover events and grab your tickets.
              </p>
              <Button
                size="lg"
                className="bg-gradient-to-r from-primary via-primary-glow/90 to-accent text-primary-foreground shadow-lg hover:shadow-glow hover:scale-105 transition-all"
                onClick={() => navigate("/events")}
              >
                <Ticket className="mr-2 h-5 w-5" />
                Find Your Next Experience
              </Button>
            </Card>
          </motion.div>
        ) : (
          <div className="relative rounded-2xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-accent/5 pointer-events-none" />
            <div className="relative space-y-10 py-2">
              {upcoming.length > 0 && (
                <section>
                  <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
                    <span className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-primary-glow" />
                    Upcoming
                  </h2>
                  <div className="space-y-4">
                    {upcoming.map((order, index) => (
                      <OrderTicketCard
                        key={order.id}
                        order={order as OrderWithMeta}
                        index={index}
                        onViewTicket={() => setViewTicketOrderId(order.id)}
                        isFeatured
                      />
                    ))}
                  </div>
                </section>
              )}
              {past.length > 0 && (
                <section>
                  <h2 className="text-xl font-semibold text-muted-foreground mb-4">Past</h2>
                  <div className="space-y-4">
                    {past.map((order, index) => (
                      <OrderTicketCard
                        key={order.id}
                        order={order as OrderWithMeta}
                        index={index}
                        onViewTicket={() => setViewTicketOrderId(order.id)}
                      />
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>
        )}
      </div>

      <Dialog open={!!viewTicketOrder} onOpenChange={(open) => !open && setViewTicketOrderId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>View Ticket</DialogTitle>
          </DialogHeader>
          {viewTicketOrder && (
            <div className="space-y-4">
              <div className="bg-muted/50 rounded-lg p-6 flex items-center justify-center min-h-[200px]">
                <div className="text-center">
                  <QrCode className="h-24 w-24 mx-auto text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">QR code placeholder</p>
                  <p className="text-xs text-muted-foreground mt-1">Show at venue</p>
                </div>
              </div>
              <p className="text-sm font-mono text-muted-foreground">
                Order #{viewTicketOrder.id.slice(0, 8)}
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

function OrderTicketCard({
  order,
  index,
  onViewTicket,
  isFeatured = false,
}: {
  order: OrderWithMeta;
  index: number;
  onViewTicket: () => void;
  isFeatured?: boolean;
}) {
  const navigate = useNavigate();
  const event = order._event;
  const eventDate = order._eventDate;
  const eventImageUrl = event?.imageUrl ? getEventImageUrl(event.imageUrl) : undefined;
  const orderDateLabel = order._dateLabel ?? "—";
  const eventDateLabel = eventDate ? format(eventDate, "EEEE, MMMM do, yyyy") : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className="group"
    >
      <Card
        className={`relative overflow-visible rounded-xl border-0 shadow-lg transition-all duration-300 cursor-pointer
          bg-white/60 dark:bg-white/5 backdrop-blur-[10px]
          hover:shadow-[0_0_30px_hsl(var(--primary)_/_0.18)]
          ${isFeatured ? "ring-1 ring-primary/20 shadow-primary/10" : ""}`}
        onClick={() => event?.id && navigate(`/events/${event.id}`)}
      >
        {/* Perforated ticket notch: circular punch-outs */}
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background z-10 border border-border/50" aria-hidden />
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-background z-10 border border-border/50" aria-hidden />

        <CardContent className="p-0 flex flex-col sm:flex-row">
          {/* Event thumbnail */}
          <div className={`relative flex-shrink-0 overflow-hidden rounded-l-lg ${isFeatured ? "w-full sm:w-48 h-36 sm:min-h-[160px]" : "w-full sm:w-40 h-32 sm:min-h-[140px]"}`}>
            {eventImageUrl ? (
              <img
                src={eventImageUrl}
                alt={event?.name ?? "Event"}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                <Ticket className="h-10 w-10 text-primary/50" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-card/50 sm:to-transparent" />
          </div>

          <div className="flex-1 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="font-mono text-sm font-semibold text-muted-foreground tabular-nums tracking-tight">
                  Order #{order.id.slice(0, 8)}
                </span>
                <Badge className={`inline-flex items-center gap-1.5 ${getStatusBadgeClass(order.status)}`}>
                  {order.status === "COMPLETED" && <Check className="h-3.5 w-3.5 shrink-0" />}
                  {getStatusLabel(order.status)}
                </Badge>
              </div>
              <h3 className="font-semibold text-lg truncate">
                {event?.name ?? "Event"}
              </h3>
              {eventDateLabel && (
                <p className="text-sm text-foreground font-medium mt-1 flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-primary" />
                  {eventDateLabel}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-0.5">
                Ordered {orderDateLabel}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-center gap-1 font-bold text-lg">
                <DollarSign className="h-4 w-4 text-primary" />
                {Number(order.totalAmount ?? 0).toFixed(2)}
              </div>
              <span className="text-sm text-muted-foreground">
                {order.tickets?.length ?? 0} ticket{(order.tickets?.length ?? 0) !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-gradient-to-r from-primary to-primary-glow text-primary-foreground border-0 shadow-md hover:shadow-glow hover:scale-105 transition-all"
                onClick={(e) => {
                  e.stopPropagation();
                  onViewTicket();
                }}
              >
                <QrCode className="h-4 w-4 mr-1.5" />
                View Ticket
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10 hover:scale-105 transition-transform"
                onClick={(e) => e.stopPropagation()}
                title="Download PDF"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-primary hover:bg-primary/10 hover:scale-105 transition-transform"
                onClick={(e) => e.stopPropagation()}
                title="Add to Calendar"
              >
                <CalendarPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export default OrderHistory;
