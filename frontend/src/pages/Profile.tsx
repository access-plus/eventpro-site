import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { RecentlyViewedEvents } from "@/components/RecentlyViewedEvents";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import type { Event, Order } from "@/types/api";
import { Calendar, Ticket, User as UserIcon, Mail, Phone, Shield, Edit } from "lucide-react";
import { format } from "date-fns";

const Profile = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProfileData();
  }, [user]);

  const loadProfileData = async () => {
    if (!user) return;

    try {
      if (user.role === "ORGANIZER" || user.role === "ADMIN") {
        const eventsData = await apiService.getUserEvents();
        setEvents(eventsData);
      }
      
      if (user.role === "USER" || user.role === "ADMIN") {
        const ordersData = await apiService.getUserOrders();
        setOrders(ordersData);
      }
    } catch (error) {
      console.error("Failed to load profile data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "bg-destructive";
      case "ORGANIZER":
        return "bg-primary";
      default:
        return "bg-accent";
    }
  };

  const getInitials = () => {
    const first = user.firstName?.[0] || "";
    const last = user.lastName?.[0] || "";
    return (first + last).toUpperCase() || "U";
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        {/* Profile Header */}
        <Card className="mb-8 bg-gradient-card">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src={user.profilePictureUrl} alt={`${user.firstName} ${user.lastName}`} />
                  <AvatarFallback className="text-2xl bg-gradient-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-3xl mb-2">
                    {user.firstName} {user.lastName}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge className={getRoleBadgeColor(user.role)}>
                      {user.role}
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                variant="outline"
                onClick={() => navigate("/profile/edit")}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>{user.email}</span>
            </div>
            {user.phoneNumber && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{user.phoneNumber}</span>
              </div>
            )}
            {user.createdAt && !isNaN(new Date(user.createdAt).getTime()) && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-4 w-4" />
                <span>Member since {format(new Date(user.createdAt), "PPP")}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recently Viewed Section */}
        <RecentlyViewedEvents showClearAll={true} />

        {/* Content Tabs */}
        <Tabs defaultValue={user.role === "USER" ? "tickets" : "events"} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            {(user.role === "ORGANIZER" || user.role === "ADMIN") && (
              <TabsTrigger value="events">My Events</TabsTrigger>
            )}
            {(user.role === "USER" || user.role === "ADMIN") && (
              <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            )}
          </TabsList>

          {/* Events Tab (for Organizers & Admins) */}
          {(user.role === "ORGANIZER" || user.role === "ADMIN") && (
            <TabsContent value="events">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : events.length === 0 ? (
                <Card className="p-12 text-center">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No events yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start creating events to manage them here
                  </p>
                  <Button 
                    className="bg-gradient-primary"
                    onClick={() => navigate("/events")}
                  >
                    Create Event
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {events.map((event) => (
                    <Card key={event.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>{event.name}</CardTitle>
                            {event.description && (
                              <CardDescription>{event.description}</CardDescription>
                            )}
                          </div>
                          <Badge>{event.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {format(new Date(event.startDateTime), "PPP")}
                          </div>
                          {event.venue && (
                            <div className="flex items-center gap-1">
                              <span>📍</span>
                              {event.venue}
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* Tickets Tab (for Users & Admins) */}
          {(user.role === "USER" || user.role === "ADMIN") && (
            <TabsContent value="tickets">
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                </div>
              ) : orders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-xl font-semibold mb-2">No tickets yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start exploring events and book your first ticket
                  </p>
                  <Button 
                    className="bg-gradient-primary"
                    onClick={() => navigate("/events")}
                  >
                    Browse Events
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <Card key={order.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle>Order #{order.id.slice(0, 8)}</CardTitle>
                            <CardDescription>
                              {format(new Date(order.createdAt), "PPP")}
                            </CardDescription>
                          </div>
                          <Badge>{order.status}</Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Total Amount</span>
                            <span className="font-semibold">${order.totalAmount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Tickets</span>
                            <span className="font-semibold">{order.tickets.length}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Profile;
