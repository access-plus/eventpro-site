import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useRecentlyViewed } from "@/hooks/useRecentlyViewed";
import { apiService } from "@/lib/api";
import type { Event, TicketType } from "@/types/api";
import { Calendar, MapPin, Clock, Users, ShoppingCart, ArrowLeft, Plus, Minus, Ticket } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { addItem } = useCart();
  const { addRecentEvent } = useRecentlyViewed();
  const { toast } = useToast();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [ticketTypes, setTicketTypes] = useState<TicketType[]>([]);
  const [selectedTickets, setSelectedTickets] = useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  useEffect(() => {
    if (id) {
      loadEventDetails();
    }
  }, [id]);

  const loadEventDetails = async () => {
    if (!id) return;
    
    try {
      const [eventData, ticketTypesData] = await Promise.all([
        apiService.getEventById(id),
        apiService.getEventTicketTypes(id),
      ]);
      
      setEvent(eventData);
      setTicketTypes(ticketTypesData);
      
      // Track this event as recently viewed
      addRecentEvent(eventData);
    } catch (error) {
      console.error("Failed to load event details:", error);
      toast({
        title: "Error",
        description: "Failed to load event details",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTicketQuantity = (ticketTypeId: string, change: number) => {
    setSelectedTickets((prev) => {
      const currentQty = prev[ticketTypeId] || 0;
      const newQty = Math.max(0, Math.min(10, currentQty + change)); // Max 10 tickets per type
      
      if (newQty === 0) {
        const { [ticketTypeId]: _, ...rest } = prev;
        return rest;
      }
      
      return { ...prev, [ticketTypeId]: newQty };
    });
  };

  const getTotalAmount = () => {
    return Object.entries(selectedTickets).reduce((total, [ticketTypeId, quantity]) => {
      const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
      return total + (ticketType?.price || 0) * quantity;
    }, 0);
  };

  const getTotalTickets = () => {
    return Object.values(selectedTickets).reduce((sum, qty) => sum + qty, 0);
  };

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Login required",
        description: "Please log in to purchase tickets",
      });
      navigate("/login");
      return;
    }

    if (getTotalTickets() === 0) {
      toast({
        title: "No tickets selected",
        description: "Please select at least one ticket",
        variant: "destructive",
      });
      return;
    }

    setIsAddingToCart(true);
    try {
      // Add items to cart context (which handles backend API calls)
      const addPromises = Object.entries(selectedTickets).map(([ticketTypeId, quantity]) => {
        const ticketType = ticketTypes.find((t) => t.id === ticketTypeId);
        if (ticketType && event) {
          return addItem({
            ticketTypeId,
            ticketTypeName: ticketType.name,
            eventName: event.name,
            eventId: event.id,
            quantity,
            price: ticketType.price,
          });
        }
        return Promise.resolve();
      });
      
      await Promise.all(addPromises);
      setSelectedTickets({});
    } catch (error: any) {
      console.error("Failed to add to cart:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to add tickets to cart. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAddingToCart(false);
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
        <Card className="p-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Event not found</h2>
          <Button onClick={() => navigate("/events")}>Back to Events</Button>
        </Card>
      </div>
    );
  }

  const getStatusColor = (status: Event["status"]) => {
    switch (status) {
      case "PUBLISHED": return "bg-primary";
      case "DRAFT": return "bg-muted";
      case "CANCELLED": return "bg-destructive";
      case "COMPLETED": return "bg-accent";
      default: return "bg-secondary";
    }
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Back Button */}
        <Button
          variant="ghost"
          className="mb-6"
          onClick={() => navigate("/events")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Events
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            {event.imageUrl && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative h-96 rounded-xl overflow-hidden shadow-lg"
              >
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
                <Badge className={`absolute top-4 right-4 ${getStatusColor(event.status)}`}>
                  {event.status}
                </Badge>
              </motion.div>
            )}

            {/* Event Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-3xl">{event.name}</CardTitle>
                {event.description && (
                  <CardDescription className="text-base mt-2">
                    {event.description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3 text-muted-foreground">
                  <Calendar className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium text-foreground">
                      {format(new Date(event.startDateTime), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm">
                      {format(new Date(event.startDateTime), "h:mm a")} -{" "}
                      {format(new Date(event.endDateTime), "h:mm a")}
                    </p>
                  </div>
                </div>

                {event.venue && (
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <MapPin className="h-5 w-5 text-primary" />
                    <p className="font-medium text-foreground">{event.venue}</p>
                  </div>
                )}

                <Separator />

                <div>
                  <h3 className="text-lg font-semibold mb-2">About This Event</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    {event.description || "No additional information available."}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Venue Map Placeholder */}
            {event.venue && (
              <Card>
                <CardHeader>
                  <CardTitle>Venue Location</CardTitle>
                  <CardDescription>{event.venue}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-64 bg-secondary rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <MapPin className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-muted-foreground">Map integration coming soon</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Ticket Selection Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Ticket className="h-5 w-5" />
                  Select Tickets
                </CardTitle>
                <CardDescription>Choose your ticket type and quantity</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticketTypes.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">No tickets available</p>
                  </div>
                ) : (
                  <>
                    {ticketTypes.map((ticketType) => (
                      <div
                        key={ticketType.id}
                        className="p-4 border rounded-lg space-y-3"
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-semibold">{ticketType.name}</h4>
                            {ticketType.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {ticketType.description}
                              </p>
                            )}
                          </div>
                          <Badge
                            variant={ticketType.status === "ACTIVE" ? "default" : "secondary"}
                          >
                            {ticketType.status}
                          </Badge>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="text-2xl font-bold text-primary">
                            ${ticketType.price.toFixed(2)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {ticketType.availableQuantity} available
                          </span>
                        </div>

                        {ticketType.status === "ACTIVE" && ticketType.availableQuantity > 0 && (
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTicketQuantity(ticketType.id, -1)}
                              disabled={!selectedTickets[ticketType.id]}
                            >
                              <Minus className="h-4 w-4" />
                            </Button>
                            <span className="w-12 text-center font-semibold">
                              {selectedTickets[ticketType.id] || 0}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => updateTicketQuantity(ticketType.id, 1)}
                              disabled={
                                (selectedTickets[ticketType.id] || 0) >= 10 ||
                                (selectedTickets[ticketType.id] || 0) >= ticketType.availableQuantity
                              }
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    ))}

                    <Separator />

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Tickets</span>
                        <span className="font-medium">{getTotalTickets()}</span>
                      </div>
                      <div className="flex justify-between text-lg font-bold">
                        <span>Total</span>
                        <span className="text-primary">${getTotalAmount().toFixed(2)}</span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-gradient-primary"
                      size="lg"
                      onClick={handleAddToCart}
                      disabled={getTotalTickets() === 0 || isAddingToCart}
                    >
                      <ShoppingCart className="mr-2 h-5 w-5" />
                      {isAddingToCart ? "Adding..." : "Add to Cart"}
                    </Button>

                    {!isAuthenticated && (
                      <p className="text-sm text-center text-muted-foreground">
                        Please <button onClick={() => navigate("/login")} className="text-primary hover:underline">log in</button> to purchase tickets
                      </p>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
