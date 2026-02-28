import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Plus, Edit, CheckCircle, Clock, BarChart, Ticket, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Event, EventPulse, OrganizerInsights } from "@/types/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getEventImageUrl } from "@/lib/utils";
import { FinancialHub } from "@/components/FinancialHub";
import { TaxCenter } from "@/components/TaxCenter";
import { ExportCenter } from "@/components/ExportCenter";
import { OrganizerInsightsSection } from "@/components/OrganizerInsightsSection";
import { LiveTicketFeed } from "@/components/LiveTicketFeed";

/** Merchandise & add-ons are Pro and Enterprise only per pricing page. */
function canUseAddons(tier: string | undefined): boolean {
  const t = (tier ?? "BASIC").toUpperCase();
  return t === "PRO" || t === "ENTERPRISE";
}

const Organizer = () => {
  const { user } = useAuth();
  const showEnhance = canUseAddons(user?.subscriptionTier);
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<Event[]>([]);
  const [insights, setInsights] = useState<OrganizerInsights | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    apiService.getOrganizerInsights().then(setInsights).catch(() => setInsights(null));
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const allEvents = await apiService.getOrganizerEvents();
      setDraftEvents(allEvents.filter(e => e.status === "DRAFT"));
      setPublishedEvents(allEvents.filter(e => e.status === "PUBLISHED"));
    } catch (error: any) {
      console.error("Failed to load events:", error);
      toast.error("Failed to load events");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublish = async (eventId: string) => {
    try {
      setPublishingEventId(eventId);
      await apiService.publishEvent(eventId);
      toast.success("Event published successfully!");
      // Reload events to update lists
      await loadEvents();
    } catch (error: any) {
      console.error("Failed to publish event:", error);
      const message = error.response?.data?.message || "Failed to publish event";
      toast.error(message);
    } finally {
      setPublishingEventId(null);
    }
  };

  const pulseByEventId = new Map<string, EventPulse>(
    (insights?.eventPulses ?? []).map((p) => [p.eventId, p])
  );

  const EventCard = ({ event, isDraft = false }: { event: Event; isDraft?: boolean }) => {
    const [imgError, setImgError] = useState(false);
    const pulse = pulseByEventId.get(event.id);
    const displayUrl = getEventImageUrl(event.imageUrl);
    const showImage = event.imageUrl && displayUrl && !imgError;
    const pulseStyle =
      pulse?.velocity === "trending_up"
        ? "bg-emerald-500/90 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]"
        : pulse?.velocity === "slowing"
          ? "bg-amber-500/90 text-white shadow-[0_0_10px_rgba(245,158,11,0.4)]"
          : pulse
            ? "bg-blue-500/90 text-white shadow-[0_0_10px_rgba(59,130,246,0.4)]"
            : "";
    return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
        {showImage ? (
          <img
            src={displayUrl}
            alt={event.name}
            className="w-full h-full object-cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Calendar className="h-16 w-16 text-muted-foreground" />
          </div>
        )}
        {isDraft && (
          <Badge className="absolute top-2 right-2" variant="secondary">
            <Clock className="h-3 w-3 mr-1" />
            Draft
          </Badge>
        )}
        {!isDraft && pulse && (
          <Badge className={`absolute top-2 left-2 text-xs ${pulseStyle}`} title={pulse.label}>
            {pulse.label}
          </Badge>
        )}
      </div>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl mb-2">{event.name}</CardTitle>
            <CardDescription className="line-clamp-2">
              {event.description || "No description"}
            </CardDescription>
          </div>
        </div>
        <div className="mt-2 space-y-1 text-sm text-muted-foreground">
          <div>
            {format(new Date(event.startTime), "PPP")}
          </div>
          <div>
            {event.addressCity && event.addressState
              ? `${event.addressCity}, ${event.addressState}`
              : event.addressCity || "Location TBD"}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" className="flex-1 min-w-[100px]" asChild>
            <Link to={`/organizer/events/${event.id}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit
            </Link>
          </Button>
          <Button variant="outline" className="flex-1 min-w-[100px]" asChild>
            <Link to={`/organizer/events/${event.id}/tickets`}>
              <Ticket className="h-4 w-4 mr-2" />
              Tickets
            </Link>
          </Button>
          {showEnhance ? (
            <Button variant="outline" className="flex-1 min-w-[100px]" asChild>
              <Link to={`/organizer/events/${event.id}/enhancements`}>
                <ShoppingBag className="h-4 w-4 mr-2" />
                Enhance
              </Link>
            </Button>
          ) : (
            <Button variant="outline" className="flex-1 min-w-[100px]" asChild>
              <Link to="/pricing" title="Merchandise & add-ons require Pro or Enterprise">
                <ShoppingBag className="h-4 w-4 mr-2" />
                Enhance (Pro)
              </Link>
            </Button>
          )}
        </div>
        {isDraft && (
          <Button
            onClick={() => handlePublish(event.id)}
            disabled={publishingEventId === event.id}
            className="w-full bg-gradient-primary"
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {publishingEventId === event.id ? "Publishing..." : "Publish"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
  };

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      {/* Subtle mesh background for vibrant theme */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-primary-glow/5 blur-3xl" />
      </div>
      <div className="container relative mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                Organizer Dashboard
              </h1>
              <p className="text-muted-foreground">Welcome, {user?.firstName}</p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={loadEvents}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/organizer/events/new">
              <Button className="bg-gradient-primary">
                <Plus className="h-4 w-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Financial Hub (bento: Total Revenue, Available for Payout, Pending + Instant Payout) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <FinancialHub />
        </motion.div>

        {/* 1099-K Tax Center (Compliance Status, Document Vault, W-9) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <TaxCenter />
        </motion.div>

        {/* Data & AI Command Center: Export, Insights, Live feed */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.08 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          <ExportCenter />
          <OrganizerInsightsSection />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="mb-8"
        >
          <LiveTicketFeed />
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8"
        >
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Draft Events</p>
                  <p className="text-3xl font-bold">{draftEvents.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Published Events</p>
                  <p className="text-3xl font-bold">{publishedEvents.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Analytics</p>
                  <p className="text-sm text-muted-foreground mt-1">Coming soon</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardHeader>
          </Card>
        </motion.div>

        {/* Draft Events Section */}
        {draftEvents.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <Clock className="h-6 w-6 text-yellow-500" />
              <h2 className="text-2xl font-bold">Draft Events</h2>
              <Badge variant="secondary">{draftEvents.length}</Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {draftEvents.map((event) => (
                <EventCard key={event.id} event={event} isDraft />
              ))}
            </div>
          </motion.div>
        )}

        {/* Published Events Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h2 className="text-2xl font-bold">Published Events</h2>
            <Badge variant="secondary">{publishedEvents.length}</Badge>
          </div>
          {publishedEvents.length === 0 && draftEvents.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="mb-4">No events yet.</p>
                <Link to="/organizer/events/new">
                  <Button className="bg-gradient-primary">Create your first event</Button>
                </Link>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publishedEvents.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Organizer;
