import { useCallback, useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Wallet, Zap } from "lucide-react";
import { apiService } from "@/lib/api";
import type { OrganizerSummary } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

const POLL_INTERVAL_MS = 30_000; // 30 seconds for near real-time

/** USD formatter for US market compliance (e.g. $1,234.56). */
const usdFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function toNumber(value: unknown): number {
  if (typeof value === "number" && !Number.isNaN(value)) return value;
  if (typeof value === "string") return parseFloat(value) || 0;
  return 0;
}

export function FinancialHub() {
  const { user } = useAuth();
  const [summary, setSummary] = useState<OrganizerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchFinancials = useCallback(async () => {
    try {
      const data = await apiService.getOrganizerSummary();
      setSummary(data);
    } catch {
      setSummary(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFinancials();
  }, [fetchFinancials]);

  useEffect(() => {
    const t = setInterval(fetchFinancials, POLL_INTERVAL_MS);
    return () => clearInterval(t);
  }, [fetchFinancials]);

  useEffect(() => {
    const onInvalidate = () => fetchFinancials();
    window.addEventListener("organizer-summary-invalidate", onInvalidate);
    return () => window.removeEventListener("organizer-summary-invalidate", onInvalidate);
  }, [fetchFinancials]);

  const totalRevenue = summary ? toNumber(summary.totalRevenue) : 0;
  const availableBalance = summary ? toNumber(summary.availableBalance) : 0;
  const pendingBalance = summary ? toNumber(summary.pendingBalance) : 0;
  const w9Submitted = Boolean(summary?.w9Submitted);
  const isVerified = Boolean(user?.isVerified) || user?.verificationStatus === "VERIFIED";
  const payoutsPausedByTax = totalRevenue >= 600 && !w9Submitted;
  const canPayout = isVerified && availableBalance > 0 && !payoutsPausedByTax;

  const tileBase =
    "rounded-xl border border-white/10 dark:border-white/10 bg-[rgba(255,255,255,0.05)] dark:bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px] p-5 transition-all duration-300";

  return (
    <section className="mb-8">
      <div className="flex items-center gap-2 mb-4">
        <Wallet className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold font-heading bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
          Financial Hub
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {/* Tile 1: Total Revenue (life-to-date) */}
        <div className={tileBase}>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Total Revenue
          </p>
          <p className="text-xs text-muted-foreground/80 mb-2">Life-to-date</p>
          {loading ? (
            <Skeleton className="h-10 w-32 bg-white/10" />
          ) : (
            <p className="text-3xl font-bold font-heading tabular-nums text-foreground">
              {usdFormat.format(totalRevenue)}
            </p>
          )}
        </div>

        {/* Tile 2: Available for Payout (most prominent, purple glow) */}
        <div
          className={`${tileBase} ring-1 ring-primary/20 shadow-[0_0_20px_rgba(147,51,234,0.25)] dark:shadow-[0_0_24px_rgba(147,51,234,0.3)]`}
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Available for Payout
          </p>
          <p className="text-xs text-muted-foreground/80 mb-2">Cleared risk scoring</p>
          {loading ? (
            <Skeleton className="h-10 w-32 bg-white/10" />
          ) : (
            <p className="text-3xl font-bold font-heading tabular-nums text-foreground">
              {usdFormat.format(availableBalance)}
            </p>
          )}
        </div>

        {/* Tile 3: Pending (subtle) */}
        <div className={tileBase}>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Pending
          </p>
          <p className="text-xs text-muted-foreground/80 mb-2">1–3 business day hold</p>
          {loading ? (
            <Skeleton className="h-8 w-24 bg-white/10" />
          ) : (
            <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
              {usdFormat.format(pendingBalance)}
            </p>
          )}
        </div>
      </div>

      {/* Primary action: Instant Payout */}
      <div className="rounded-xl border border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px] p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-lg bg-gradient-to-r from-primary to-primary-glow/80 flex items-center justify-center">
            <Zap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <p className="font-semibold">Instant Payout</p>
            <p className="text-sm text-muted-foreground">
              Standard payouts take 1–3 business days. Instant payouts may incur a small fee.
            </p>
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  disabled={!canPayout}
                  className={`bg-gradient-to-r from-primary via-primary to-orange-500 text-white border-0 shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.4)] transition-all ${
                    !canPayout ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={() => {
                    if (canPayout) {
                      /* Navigate to payout flow or open modal when implemented */
                    }
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {payoutsPausedByTax ? "Payouts Paused: Tax Info Required" : "Instant Payout"}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {payoutsPausedByTax
                ? "Submit your W-9 in the 1099-K Tax Center to resume payouts (required at $600+ gross payments)."
                : !isVerified
                  ? "Complete Identity Check in Profile to unlock instant payouts."
                  : availableBalance <= 0
                    ? "No funds available for payout yet."
                    : "You can request an instant payout."}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </section>
  );
}
