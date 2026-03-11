import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

/**
 * Stripe redirects here after subscription checkout. We sync tier/role from Stripe
 * and redirect to Profile so the user sees their updated plan without any extra click.
 */
const SubscriptionReturn = () => {
  const { refreshUser } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"syncing" | "done" | "error">("syncing");

  useEffect(() => {
    let cancelled = false;
    apiService
      .syncSubscriptionFromStripe()
      .then(({ message }) => {
        if (cancelled) return;
        setStatus("done");
        refreshUser();
        if (message.toLowerCase().includes("synced") || message.toLowerCase().includes("tier=")) {
          toast.success("Subscription updated. You now have organizer access.");
        } else {
          toast.info(message);
        }
        navigate("/profile", { replace: true });
      })
      .catch(() => {
        if (cancelled) return;
        setStatus("error");
        toast.error("Could not sync subscription. Your payment may still have gone through.");
        navigate("/profile", { replace: true });
      });
    return () => {
      cancelled = true;
    };
  }, [refreshUser, navigate]);

  return (
    <div className="min-h-[40vh] flex flex-col items-center justify-center gap-4 p-6">
      {status === "syncing" && (
        <>
          <Loader2 className="h-10 w-10 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Setting up your account…</p>
        </>
      )}
      {status === "done" && (
        <p className="text-muted-foreground">Redirecting to your profile…</p>
      )}
      {status === "error" && (
        <p className="text-muted-foreground">Redirecting to your profile…</p>
      )}
    </div>
  );
};

export default SubscriptionReturn;
