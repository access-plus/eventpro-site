import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAdminApi } from "@/hooks/useAdminApi";
import { useToast } from "@/hooks/use-toast";
import { DollarSign, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import type { RevenueData } from "@/types/api";

const PERIODS = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

const AdminRevenue = () => {
  const adminApi = useAdminApi();
  const { toast } = useToast();
  const [data, setData] = useState<RevenueData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    if (!adminApi) return;
    setLoading(true);
    adminApi
      .getRevenue(period)
      .then(setData)
      .catch(() => {
        toast({ title: "Failed to load revenue", variant: "destructive" });
        setData([]);
      })
      .finally(() => setLoading(false));
  }, [adminApi, period, toast]);

  if (!adminApi) return null;

  const totalRevenue = data.reduce((s, r) => s + (r.revenue ?? 0), 0);
  const totalTickets = data.reduce((s, r) => s + (r.ticketsSold ?? 0), 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
          <DollarSign className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-bold">Revenue</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle>Revenue over time</CardTitle>
              <CardDescription>Revenue and tickets sold by date.</CardDescription>
            </div>
            <select
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
            >
              {PERIODS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading…
            </div>
          ) : data.length === 0 ? (
            <p className="text-muted-foreground py-8">No revenue data for this period.</p>
          ) : (
            <>
              <div className="flex gap-4 mb-4 text-sm">
                <span className="text-muted-foreground">
                  Total: <strong>${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}</strong>
                </span>
                <span className="text-muted-foreground">
                  Tickets: <strong>{totalTickets.toLocaleString()}</strong>
                </span>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                    <TableHead className="text-right">Tickets sold</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...data].reverse().map((r, i) => (
                    <TableRow key={r.date ?? i}>
                      <TableCell>{r.date ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        ${(r.revenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">{r.ticketsSold?.toLocaleString() ?? "—"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default AdminRevenue;
