import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, Clock, Ticket, Minus, Plus, Grid3X3 } from "lucide-react";
import { apiService } from "@/lib/api";
import type { Event, TicketType } from "@/types/api";
import { useCart } from "@/contexts/CartContext";
import { usePreferences } from "@/contexts/PreferencesContext";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { SeatingMap, generateSampleSeats, Seat } from "@/components/SeatingMap";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedSeats, setSelectedSeats] = useState<Seat[]>([]);
  const [ticketMode, setTicketMode] = useState<"general" | "seating">("general");
  const { addItem } = useCart();
  const { addRecentlyViewed } = usePreferences();

  // Generate sample seats for demo
  const sampleSeats = useMemo(() => generateSampleSeats(), []);

  useEffect(() => {
    if (id) {
      loadEventDetails();
    }
  }, [id]);

  const loadEventDetails = async () => {
    try {
      setIsLoading(true);
      const [eventData, ticketsData] = await Promise.all([
        apiService.getEvent(id!),
        apiService.getTicketTypes(id!),
      ]);
      setEvent(eventData);
      setTicketTypes(ticketsData);

      // Add to recently viewed
      addRecentlyViewed({
        id: eventData.id,
        name: eventData.name,
        imageUrl: eventData.imageUrl,
        startDateTime: eventData.startDateTime,
        venue: eventData.venue,
      });
    } catch (error) {
      console.error("Failed to load event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateQuantity = (ticketTypeId: string, delta: number) => {
    setQuantities((prev) => {
      const current = prev[ticketTypeId] || 0;
      const newValue = Math.max(0, current + delta);
      return { ...prev, [ticketTypeId]: newValue };
    });
  };

  const handleAddToCart = (ticketType: TicketType) => {
    const quantity = quantities[ticketType.id] || 0;
    if (quantity > 0) {
      addItem({
        ticketTypeId: ticketType.id,
        ticketTypeName: ticketType.name,
        eventName: event?.name || "",
        eventId: event?.id || "",
        quantity,
        price: ticketType.price,
      });
      setQuantities((prev) => ({ ...prev, [ticketType.id]: 0 }));
    }
  };

  const handleSeatSelect = (seats: Seat[]) => {
    setSelectedSeats(seats);
  };

  const handleAddSeatsToCart = () => {
    if (selectedSeats.length > 0 && event) {
      selectedSeats.forEach((seat) => {
        addItem({
          ticketTypeId: seat.id,
          ticketTypeName: `${seat.section} - Row ${seat.row}, Seat ${seat.number} (${seat.type})`,
          eventName: event.name,
          eventId: event.id,
          quantity: 1,
          price: seat.price,
        });
      });
      setSelectedSeats([]);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 lg:grid-cols-3 gap-8"
        >
          {/* Event Details */}
          <div className="lg:col-span-2 space-y-6">
            {event.imageUrl && (
              <div className="rounded-xl overflow-hidden h-64 md:h-96">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <h1 className="text-4xl font-bold">{event.name}</h1>
                <Badge className="bg-primary">{event.status}</Badge>
              </div>

              <div className="flex flex-wrap gap-4 text-muted-foreground mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  <span>{format(new Date(event.startDateTime), "PPPP")}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  <span>{format(new Date(event.startDateTime), "p")}</span>
                </div>
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    <span>{event.venue}</span>
                  </div>
                )}
              </div>

              {event.description && (
                <div className="prose prose-lg max-w-none dark:prose-invert">
                  <p>{event.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Ticket Selection */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Tickets</h2>
            </div>

            {/* Tabs for General Admission vs Seating */}
            <Tabs value={ticketMode} onValueChange={(v) => setTicketMode(v as "general" | "seating")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general" className="flex items-center gap-2">
                  <Ticket className="h-4 w-4" />
                  General Admission
                </TabsTrigger>
                <TabsTrigger value="seating" className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4" />
                  Select Seats
                </TabsTrigger>
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
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>

                            <Button
                              className="w-full bg-gradient-primary"
                              disabled={(quantities[ticketType.id] || 0) <= 0}
                              onClick={() => handleAddToCart(ticketType)}
                            >
                              <Ticket className="mr-2 h-4 w-4" />
                              Add to Cart
                            </Button>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </TabsContent>

              {/* Seating Map Tab */}
              <TabsContent value="seating" className="mt-4">
                <SeatingMap
                  seats={sampleSeats}
                  onSeatSelect={handleSeatSelect}
                  maxSeats={8}
                  venueName={event?.venue || "Main Venue"}
                />
                
                {selectedSeats.length > 0 && (
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
        </motion.div>
      </div>
    </div>
  );
};

export default EventDetails;
