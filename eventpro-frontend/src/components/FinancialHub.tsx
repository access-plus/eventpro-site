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
import { toast } from "sonner";

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
  const [requestingPayout, setRequestingPayout] = useState(false);

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
  const platformFeesWithheld = summary ? toNumber(summary.platformFeesWithheld) : 0;
  const availableBalance = summary ? toNumber(summary.availableBalance) : 0;
  const pendingBalance = summary ? toNumber(summary.pendingBalance) : 0;
  const w9Submitted = Boolean(summary?.w9Submitted);
  const isVerified = Boolean(user?.isVerified) || user?.verificationStatus === "VERIFIED";
  const payoutsPausedByTax = totalRevenue >= 600 && !w9Submitted;
  const bankConnected = Boolean(user?.stripeConnectAccountId);
  const canPayout = isVerified && availableBalance > 0 && !payoutsPausedByTax && bankConnected;
  const [connectingBank, setConnectingBank] = useState(false);

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
        {/* Tile 1: Total Revenue (life-to-date, gross) */}
        <div className={tileBase}>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Total Revenue
          </p>
          <p className="text-xs text-muted-foreground/80 mb-2">Life-to-date (gross sales)</p>
          {loading ? (
            <Skeleton className="h-10 w-32 bg-white/10" />
          ) : (
            <>
              <p className="text-3xl font-bold font-heading tabular-nums text-foreground">
                {usdFormat.format(totalRevenue)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {platformFeesWithheld > 0 ? (
                  <>Platform fees ({summary?.platformFeeRateLabel ?? "per your plan"}): −{usdFormat.format(platformFeesWithheld)}</>
                ) : (
                  <>Platform fees: {usdFormat.format(0)} {summary?.platformFeeRateLabel && `(${summary.platformFeeRateLabel})`}</>
                )}
              </p>
            </>
          )}
        </div>

        {/* Tile 2: Available for Payout (gross minus platform fees) */}
        <div
          className={`${tileBase} ring-1 ring-primary/20 shadow-[0_0_20px_rgba(147,51,234,0.25)] dark:shadow-[0_0_24px_rgba(147,51,234,0.3)]`}
        >
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Available for Payout
          </p>
          <p className="text-xs text-muted-foreground/80 mb-2">
            {platformFeesWithheld > 0 ? "After platform fees" : "Cleared risk scoring"}
          </p>
          {loading ? (
            <Skeleton className="h-10 w-32 bg-white/10" />
          ) : (
            <p className="text-3xl font-bold font-heading tabular-nums text-foreground">
              {usdFormat.format(availableBalance)}
            </p>
          )}
        </div>

        {/* Tile 3: Pending (net from sales in last N days) */}
        <div className={tileBase}>
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-1">
            Pending
          </p>
          <p className="text-xs text-muted-foreground/80 mb-2">
            {summary?.pendingHoldDays
              ? `Last ${summary.pendingHoldDays} day hold (net from recent sales)`
              : "1–3 business day hold"}
          </p>
          {loading ? (
            <Skeleton className="h-8 w-24 bg-white/10" />
          ) : (
            <>
              <p className="text-2xl font-semibold tabular-nums text-muted-foreground">
                {usdFormat.format(pendingBalance)}
              </p>
              {pendingBalance === 0 && totalRevenue > 0 && (
                <p className="text-xs text-muted-foreground mt-1">No sales in the hold window yet</p>
              )}
            </>
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
        {!bankConnected && (
          <Button
            variant="outline"
            className="border-primary/50 text-primary hover:bg-primary/10"
            disabled={connectingBank}
            onClick={async () => {
              setConnectingBank(true);
              try {
                const base = window.location.origin;
                const { url } = await apiService.connectOnboarding(
                  `${base}/organizer`,
                  `${base}/organizer`
                );
                if (url) window.location.href = url;
                else toast.error("Could not start bank setup.");
              } catch (e: unknown) {
                const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Request failed";
                toast.error(msg);
              } finally {
                setConnectingBank(false);
              }
            }}
          >
            {connectingBank ? "Redirecting…" : "Add bank account"}
          </Button>
        )}
        {bankConnected && (
          <p className="text-sm text-muted-foreground">Bank account connected</p>
        )}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-block">
                <Button
                  disabled={!canPayout || requestingPayout}
                  className={`bg-gradient-to-r from-primary via-primary to-orange-500 text-white border-0 shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.4)] transition-all ${
                    !canPayout ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                  onClick={async () => {
                    if (!canPayout || requestingPayout || availableBalance <= 0) return;
                    setRequestingPayout(true);
                    try {
                      await apiService.requestPayout(availableBalance);
                      toast.success("Payout requested. Funds will be sent to your bank account.");
                      window.dispatchEvent(new Event("organizer-summary-invalidate"));
                      fetchFinancials();
                    } catch (e: unknown) {
                      const msg = (e as { response?: { data?: { message?: string } } })?.response?.data?.message ?? "Request failed";
                      toast.error(msg);
                    } finally {
                      setRequestingPayout(false);
                    }
                  }}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  {requestingPayout ? "Requesting…" : payoutsPausedByTax ? "Payouts Paused: Tax Info Required" : !bankConnected ? "Add bank account first" : "Instant Payout"}
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs">
              {payoutsPausedByTax
                ? "Submit your W-9 in the 1099-K Tax Center to resume payouts (required at $600+ gross payments)."
                : !isVerified
                  ? "Complete Identity Check in Profile to unlock instant payouts."
                  : !bankConnected
                    ? "Add your bank account to receive payouts."
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
