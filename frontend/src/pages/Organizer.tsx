import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Calendar, TrendingUp, Users, Ticket, QrCode, CheckCircle, Clock, DollarSign, Edit } from "lucide-react";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { format } from "date-fns";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

const Organizer = () => {
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  // QR code functionality disabled - endpoint not implemented in backend
  // const [qrDialogOpen, setQrDialogOpen] = useState(false);
  // const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ["organizer-events"],
    queryFn: () => apiService.getOrganizerEvents(),
  });

  const { data: eventStats, isLoading: statsLoading } = useQuery({
    queryKey: ["event-stats", selectedEvent],
    queryFn: () => apiService.getOrganizerEventStats(selectedEvent!),
    enabled: !!selectedEvent,
  });

  const { data: attendees, isLoading: attendeesLoading } = useQuery({
    queryKey: ["event-attendees", selectedEvent],
    queryFn: () => apiService.getEventAttendees(selectedEvent!),
    enabled: !!selectedEvent,
  });

  const checkInMutation = useMutation({
    mutationFn: (ticketId: string) => apiService.checkInAttendee(ticketId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["event-attendees", selectedEvent] });
      queryClient.invalidateQueries({ queryKey: ["event-stats", selectedEvent] });
      toast.success("Attendee checked in successfully");
    },
    onError: () => {
      toast.error("Failed to check in attendee");
    },
  });

  // QR code generation endpoint not implemented in backend
  // QR codes are included in ticket PDF downloads
  // const handleGenerateQR = async (ticketId: string) => {
  //   try {
  //     const { qrCode } = await apiService.generateTicketQR(ticketId);
  //     setSelectedQR(qrCode);
  //     setQrDialogOpen(true);
  //   } catch (error) {
  //     toast.error("Failed to generate QR code");
  //   }
  // };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const currentEvent = events?.find((e: any) => e.id === selectedEvent);

  const chartConfig = {
    sales: {
      label: "Sales",
      color: "hsl(var(--primary))",
    },
  };

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-primary bg-clip-text text-transparent">
            Organizer Dashboard
          </h1>
          <p className="text-xl text-muted-foreground">
            Manage your events and track performance
          </p>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList>
            <TabsTrigger value="events">My Events</TabsTrigger>
            <TabsTrigger value="analytics" disabled={!selectedEvent}>
              Analytics
            </TabsTrigger>
            <TabsTrigger value="attendees" disabled={!selectedEvent}>
              Attendees
            </TabsTrigger>
          </TabsList>

          <TabsContent value="events" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Your Events</h2>
              <Button onClick={() => window.location.href = "/organizer/events/new"}>
                <Calendar className="mr-2 h-4 w-4" />
                Create Event
              </Button>
            </div>

            {eventsLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {events?.map((event: any) => (
                  <Card
                    key={event.id}
                    className="hover:shadow-lg transition-shadow"
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{event.name}</CardTitle>
                        <Badge variant={event.status === "PUBLISHED" ? "default" : "secondary"}>
                          {event.status}
                        </Badge>
                      </div>
                      <CardDescription>{event.venue}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(event.startDateTime), "MMM dd, yyyy")}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={() => setSelectedEvent(event.id)}
                        >
                          View Analytics
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.location.href = `/organizer/events/${event.id}/edit`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {(!events || events.length === 0) && (
                  <Card className="col-span-full">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-lg font-semibold mb-2">No events yet</p>
                      <p className="text-muted-foreground mb-4">Create your first event to get started</p>
                      <Button onClick={() => window.location.href = "/organizer/events/new"}>
                        Create Event
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {selectedEvent && currentEvent && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ← Back to Events
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{currentEvent.name}</h2>
                    <p className="text-muted-foreground">{currentEvent.venue}</p>
                  </div>
                </div>

                {statsLoading ? (
                  <div className="flex items-center justify-center h-40">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
                          <Ticket className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {eventStats?.ticketsSold || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            of {eventStats?.totalTickets || 0} available
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {formatCurrency(eventStats?.revenue || 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">Total earnings</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Checked In</CardTitle>
                          <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {eventStats?.checkedIn || 0}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {eventStats?.checkedInPercentage || 0}% of attendees
                          </p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                          <CardTitle className="text-sm font-medium">Pending</CardTitle>
                          <Clock className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">
                            {(eventStats?.ticketsSold || 0) - (eventStats?.checkedIn || 0)}
                          </div>
                          <p className="text-xs text-muted-foreground">Not checked in</p>
                        </CardContent>
                      </Card>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle>Sales Over Time</CardTitle>
                        <CardDescription>Track your ticket sales performance</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ChartContainer config={chartConfig} className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={eventStats?.salesData || []}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis
                                dataKey="date"
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                              />
                              <YAxis
                                stroke="hsl(var(--muted-foreground))"
                                fontSize={12}
                              />
                              <ChartTooltip content={<ChartTooltipContent />} />
                              <Line
                                type="monotone"
                                dataKey="sales"
                                stroke="var(--color-sales)"
                                strokeWidth={2}
                                dot={{ fill: "var(--color-sales)" }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </ChartContainer>
                      </CardContent>
                    </Card>
                  </>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="attendees" className="space-y-6">
            {selectedEvent && currentEvent && (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedEvent(null)}
                  >
                    ← Back to Events
                  </Button>
                  <div>
                    <h2 className="text-2xl font-bold">{currentEvent.name}</h2>
                    <p className="text-muted-foreground">Attendee Management</p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Attendees List</CardTitle>
                    <CardDescription>
                      Manage check-ins and view attendee details
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {attendeesLoading ? (
                      <div className="flex items-center justify-center h-40">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      <div className="rounded-md border">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Name</TableHead>
                              <TableHead>Email</TableHead>
                              <TableHead>Ticket Type</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {attendees?.map((attendee: any) => (
                              <TableRow key={attendee.ticketId}>
                                <TableCell className="font-medium">
                                  {attendee.firstName} {attendee.lastName}
                                </TableCell>
                                <TableCell>{attendee.email}</TableCell>
                                <TableCell>{attendee.ticketType}</TableCell>
                                <TableCell>
                                  {attendee.checkedIn ? (
                                    <Badge variant="default">
                                      <CheckCircle className="mr-1 h-3 w-3" />
                                      Checked In
                                    </Badge>
                                  ) : (
                                    <Badge variant="secondary">
                                      <Clock className="mr-1 h-3 w-3" />
                                      Pending
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="text-right space-x-2">
                                  {!attendee.checkedIn && (
                                    <Button
                                      size="sm"
                                      onClick={() => checkInMutation.mutate(attendee.ticketId)}
                                      disabled={checkInMutation.isPending}
                                    >
                                      Check In
                                    </Button>
                                  )}
                                  {/* QR code generation endpoint not implemented in backend */}
                                  {/* <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleGenerateQR(attendee.ticketId)}
                                  >
                                    <QrCode className="h-4 w-4" />
                                  </Button> */}
                                </TableCell>
                              </TableRow>
                            ))}
                            {(!attendees || attendees.length === 0) && (
                              <TableRow>
                                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                                  No attendees yet
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>

        {/* QR code dialog - endpoint not implemented in backend */}
        {/* <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ticket QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code to validate the ticket
              </DialogDescription>
            </DialogHeader>
            {selectedQR && (
              <div className="flex justify-center p-6">
                <img src={selectedQR} alt="Ticket QR Code" className="w-64 h-64" />
              </div>
            )}
          </DialogContent>
        </Dialog> */}
      </div>
    </div>
  );
};

export default Organizer;
