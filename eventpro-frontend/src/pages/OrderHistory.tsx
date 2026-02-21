import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiService } from "@/lib/api";
import type { Order } from "@/types/api";
import { Ticket, Calendar, DollarSign } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

// Backend may return paginated shape and orders with amount (cents) / orderItems instead of totalAmount / tickets
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

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const data = await apiService.getOrders();
      setOrders(Array.isArray(data) ? data.map((o) => normalizeOrder(o as Record<string, unknown>)) : []);
    } catch (error) {
      console.error("Failed to load orders:", error);
      setOrders([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "COMPLETED":
        return "bg-primary";
      case "PENDING":
        return "bg-accent";
      case "CANCELLED":
        return "bg-destructive";
      case "REFUNDED":
        return "bg-muted";
      default:
        return "bg-secondary";
    }
  };

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
        <h1 className="text-4xl font-bold mb-8 bg-gradient-primary bg-clip-text text-transparent">
          Order History
        </h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              Your order history will appear here after your first purchase.
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order, index) => (
              <motion.div
                key={order.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card>
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">Order #{order.id.slice(0, 8)}</CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                          <Calendar className="h-4 w-4" />
                          {(order as Order & { _dateLabel?: string })._dateLabel ?? "—"}
                        </CardDescription>
                      </div>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Ticket className="h-4 w-4" />
                        <span>{order.tickets?.length ?? 0} tickets</span>
                      </div>
                      <div className="flex items-center gap-1 font-bold text-lg">
                        <DollarSign className="h-4 w-4" />
                        {Number(order.totalAmount ?? 0).toFixed(2)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistory;
