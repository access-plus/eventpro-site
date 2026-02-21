import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Calendar, Plus, Edit, CheckCircle, Clock, BarChart, Ticket, RefreshCw, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { apiService } from "@/lib/api";
import { Event } from "@/types/api";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { getEventImageUrl } from "@/lib/utils";

const Organizer = () => {
  const { user } = useAuth();
  const [draftEvents, setDraftEvents] = useState<Event[]>([]);
  const [publishedEvents, setPublishedEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [publishingEventId, setPublishingEventId] = useState<string | null>(null);

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    try {
      setIsLoading(true);
      const [drafts, allEvents] = await Promise.all([
        apiService.getOrganizerDraftEvents(),
        apiService.getOrganizerEvents(),
      ]);

      setDraftEvents(drafts);
      // Filter to get only published events
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

  const EventCard = ({ event, isDraft = false }: { event: Event; isDraft?: boolean }) => (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative h-48 bg-gradient-to-br from-primary/10 to-primary/5">
        {event.imageUrl ? (
          <img
            src={getEventImageUrl(event.imageUrl) ?? ""}
            alt={event.name}
            className="w-full h-full object-cover"
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
          <Button variant="outline" className="flex-1 min-w-[100px]" asChild>
            <Link to={`/organizer/events/${event.id}/enhancements`}>
              <ShoppingBag className="h-4 w-4 mr-2" />
              Enhance
            </Link>
          </Button>
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
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
