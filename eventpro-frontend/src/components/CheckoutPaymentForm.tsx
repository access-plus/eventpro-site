import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lock, ShieldCheck } from "lucide-react";
import { apiService } from "@/lib/api";

const STRIPE_SCRIPT_URL = "https://js.stripe.com/v3/";

export interface CheckoutPaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (orderId: string) => void;
  onError: (message: string) => void;
  guestConfirm?: (paymentIntentId: string) => Promise<{ id: string }>;
  authenticatedConfirm?: (paymentIntentId: string) => Promise<{ id: string }>;
  isGuest: boolean;
}

declare global {
  interface Window {
    Stripe?: (key: string) => {
      elements: (opts?: { clientSecret?: string }) => {
        create: (type: string) => { mount: (el: string | HTMLElement) => void; unmount: () => void };
        getElement: (type: string) => unknown;
      };
      confirmCardPayment: (
        clientSecret: string,
        opts: { payment_method: { card: unknown } }
      ) => Promise<{ error?: { message?: string }; paymentIntent?: { status: string; id: string } }>;
    };
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = src;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

function StripeNotConfigured() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>
          Set STRIPE_PUBLISHABLE_KEY in your backend .env (project root) to enable card payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Restart the backend after updating .env, then refresh this page.
        </p>
      </CardContent>
    </Card>
  );
}

export function CheckoutPaymentForm(props: CheckoutPaymentFormProps) {
  const { clientSecret, onSuccess, onError, guestConfirm, authenticatedConfirm, isGuest } = props;
  const [stripeKey, setStripeKey] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardMountRef = useRef<HTMLDivElement>(null);
  const cardInstanceRef = useRef<{ unmount: () => void } | null>(null);
  const stripeInstanceRef = useRef<ReturnType<NonNullable<typeof window.Stripe>> | null>(null);

  // Fetch Stripe publishable key from backend (no frontend env needed)
  useEffect(() => {
    const envKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim?.();
    if (envKey) {
      setStripeKey(envKey);
      return;
    }
    apiService
      .getPaymentConfig()
      .then((config) => {
        const k = config?.stripePublishableKey?.trim?.();
        setStripeKey(k || null);
        if (!k) setError("no-key");
      })
      .catch(() => setError("no-key"));
  }, []);

  const key = stripeKey ?? "";

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    let mountTimeout: ReturnType<typeof setTimeout> | null = null;
    loadScript(STRIPE_SCRIPT_URL)
      .then(() => {
        if (cancelled || !window.Stripe) {
          setError("stripe-load");
          return;
        }
        const stripe = window.Stripe(key);
        stripeInstanceRef.current = stripe;
        const elements = stripe.elements({ clientSecret });
        const card = elements.create("card", {
          style: { base: { fontSize: "16px", color: "hsl(var(--foreground))" } },
        });
        const mountEl = cardMountRef.current;
        const doMount = (el: HTMLDivElement) => {
          card.mount(el);
          cardInstanceRef.current = card;
          setReady(true);
        };
        if (!mountEl) {
          mountTimeout = setTimeout(() => {
            if (cancelled) return;
            const el = cardMountRef.current;
            if (el) doMount(el);
          }, 100);
        } else {
          doMount(mountEl);
        }
      })
      .catch(() => !cancelled && setError("script-load"));
    return () => {
      cancelled = true;
      if (mountTimeout) clearTimeout(mountTimeout);
      cardInstanceRef.current?.unmount?.();
      cardInstanceRef.current = null;
      stripeInstanceRef.current = null;
    };
  }, [key, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const stripe = stripeInstanceRef.current;
    if (!stripe || !cardInstanceRef.current) {
      onError("Payment form not ready");
      return;
    }
    setIsSubmitting(true);
    try {
      const { error: confirmError, paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: { card: cardInstanceRef.current },
      });
      if (confirmError) {
        onError(confirmError.message ?? "Payment failed");
        return;
      }
      if (paymentIntent?.status === "succeeded" && paymentIntent.id) {
        if (isGuest && guestConfirm) {
          const order = await guestConfirm(paymentIntent.id);
          onSuccess(order.id);
        } else if (!isGuest && authenticatedConfirm) {
          const order = await authenticatedConfirm(paymentIntent.id);
          onSuccess(order.id);
        } else {
          onSuccess(paymentIntent.id);
        }
      } else {
        onError("Payment did not succeed");
      }
    } catch (err: unknown) {
      onError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (stripeKey === null && !error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-sm text-muted-foreground">Loading payment form…</p>
        </CardContent>
      </Card>
    );
  }
  if (error || !key) {
    return <StripeNotConfigured />;
  }

  return (
    <Card className="rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px] shadow-[0_0_24px_rgba(147,51,234,0.12)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Secure Payment</CardTitle>
            <CardDescription>Enter your card details. Encrypted and PCI DSS compliant.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={cardMountRef} className="rounded-xl border border-white/20 bg-background/80 p-4 min-h-[48px]" />
          <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
            <ShieldCheck className="h-4 w-4 shrink-0" />
            <span>Card data is secured by Stripe and never stored on our servers.</span>
          </div>
          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary via-primary to-orange-500 text-white border-0 shadow-lg hover:shadow-[0_0_20px_hsl(var(--primary)_/_0.4)]"
            size="lg"
            disabled={!ready || isSubmitting}
          >
            {isSubmitting ? "Processing…" : "Pay now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
