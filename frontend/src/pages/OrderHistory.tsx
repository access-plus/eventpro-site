import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiService } from "@/lib/api";
import { format } from "date-fns";
import { Download, RefreshCw, Filter, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import type { Order } from "@/types/api";

const statusColors: Record<string, string> = {
  PENDING: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  COMPLETED: "bg-green-500/10 text-green-500 border-green-500/20",
  CANCELLED: "bg-red-500/10 text-red-500 border-red-500/20",
  REFUNDED: "bg-blue-500/10 text-blue-500 border-blue-500/20",
};

export default function OrderHistory() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["user-orders"],
    queryFn: () => apiService.getUserOrders(),
  });

  const refundMutation = useMutation({
    mutationFn: (orderId: string) => apiService.requestRefund(orderId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-orders"] });
      toast({
        title: "Refund Requested",
        description: "Your refund request has been submitted successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Refund Failed",
        description: error.response?.data?.message || "Failed to request refund",
        variant: "destructive",
      });
    },
  });

  const handleDownloadTicket = async (ticketId: string, eventName: string) => {
    try {
      const blob = await apiService.downloadTicket(ticketId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ticket-${eventName}-${ticketId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({
        title: "Ticket Downloaded",
        description: "Your ticket has been downloaded successfully.",
      });
    } catch (error: any) {
      toast({
        title: "Download Failed",
        description: error.response?.data?.message || "Failed to download ticket",
        variant: "destructive",
      });
    }
  };

  const filteredOrders = orders?.filter((order) => {
    const statusMatch = statusFilter === "all" || order.status === statusFilter;
    
    let dateMatch = true;
    if (dateFilter !== "all") {
      const orderDate = new Date(order.createdAt);
      const now = new Date();
      const daysDiff = Math.floor((now.getTime() - orderDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (dateFilter === "7days" && daysDiff > 7) dateMatch = false;
      if (dateFilter === "30days" && daysDiff > 30) dateMatch = false;
      if (dateFilter === "90days" && daysDiff > 90) dateMatch = false;
    }
    
    return statusMatch && dateMatch;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Order History</h1>
        <p className="text-muted-foreground">
          View and manage your past ticket purchases
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="PENDING">Pending</SelectItem>
              <SelectItem value="COMPLETED">Completed</SelectItem>
              <SelectItem value="CANCELLED">Cancelled</SelectItem>
              <SelectItem value="REFUNDED">Refunded</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex-1">
          <Select value={dateFilter} onValueChange={setDateFilter}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by date" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {!filteredOrders || filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground mb-4">No orders found</p>
            <Button onClick={() => (window.location.href = "/events")}>
              Browse Events
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order: Order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle className="text-xl mb-2">
                      Order #{order.id.slice(0, 8)}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(order.createdAt), "PPP 'at' p")}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Badge className={statusColors[order.status] || ""}>
                      {order.status}
                    </Badge>
                    <p className="text-2xl font-bold">
                      ${order.totalAmount.toFixed(2)}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Tickets ({order.tickets.length})</h4>
                    <div className="space-y-2">
                      {order.tickets.map((ticket) => (
                        <div
                          key={ticket.id}
                          className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-4 bg-muted/50 rounded-lg gap-4"
                        >
                          <div className="flex-1">
                            <p className="font-medium">Ticket #{ticket.id.slice(0, 8)}</p>
                            <p className="text-sm text-muted-foreground">
                              Event ID: {ticket.eventId}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Status: {ticket.status}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <p className="font-semibold">
                              ${ticket.purchasePrice.toFixed(2)}
                            </p>
                            {order.status === "COMPLETED" && ticket.status === "ACTIVE" && (
                              <Button
                                size="sm"
                                onClick={() => handleDownloadTicket(ticket.id, ticket.eventId)}
                              >
                                <Download className="h-4 w-4 mr-1" />
                                Download
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {order.status === "COMPLETED" && (
                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        onClick={() => refundMutation.mutate(order.id)}
                        disabled={refundMutation.isPending}
                      >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Request Refund
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
