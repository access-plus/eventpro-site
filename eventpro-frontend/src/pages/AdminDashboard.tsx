import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAdminApi } from "@/hooks/useAdminApi";
import { BarChart3, Users, Calendar, Ticket, DollarSign, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { AdminStats } from "@/types/api";

const StatCard = ({
  title,
  value,
  sub,
  icon: Icon,
}: {
  title: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
}) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      {sub != null && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const adminApi = useAdminApi();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!adminApi) return;
    adminApi
      .getStats()
      .then(setStats)
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, [adminApi]);

  if (!adminApi) return null;

  const formatGrowth = (n: number) =>
    n == null || Number.isNaN(n) ? "—" : `${n >= 0 ? "+" : ""}${n.toFixed(1)}%`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <BarChart3 className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Platform overview</h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 py-12 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading stats…
        </div>
      ) : stats ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total users"
            value={stats.totalUsers.toLocaleString()}
            sub={formatGrowth(stats.userGrowth)}
            icon={Users}
          />
          <StatCard
            title="Total events"
            value={stats.totalEvents.toLocaleString()}
            sub={formatGrowth(stats.eventGrowth)}
            icon={Calendar}
          />
          <StatCard
            title="Tickets sold"
            value={stats.totalTicketsSold.toLocaleString()}
            sub={formatGrowth(stats.ticketGrowth)}
            icon={Ticket}
          />
          <StatCard
            title="Total revenue"
            value={`$${stats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
            sub={formatGrowth(stats.revenueGrowth)}
            icon={DollarSign}
          />
        </div>
      ) : (
        <p className="text-muted-foreground py-8">Failed to load stats.</p>
      )}
    </motion.div>
  );
};

export default AdminDashboard;
