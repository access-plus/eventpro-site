import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
          Set VITE_STRIPE_PUBLISHABLE_KEY in your environment to enable card payments.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Guest checkout is supported on the backend. Configure Stripe to collect payment here.
        </p>
      </CardContent>
    </Card>
  );
}

export function CheckoutPaymentForm(props: CheckoutPaymentFormProps) {
  const { clientSecret, onSuccess, onError, guestConfirm, authenticatedConfirm, isGuest } = props;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const cardMountRef = useRef<HTMLDivElement>(null);
  const cardInstanceRef = useRef<{ unmount: () => void } | null>(null);

  const key = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim?.();

  useEffect(() => {
    if (!key) {
      setError("no-key");
      return;
    }
    let cancelled = false;
    let mountTimeout: ReturnType<typeof setTimeout> | null = null;
    loadScript(STRIPE_SCRIPT_URL)
      .then(() => {
        if (cancelled || !window.Stripe) {
          setError("stripe-load");
          return;
        }
        const stripe = window.Stripe(key);
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
    };
  }, [key, clientSecret]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key || !window.Stripe || !cardInstanceRef.current) {
      onError("Payment form not ready");
      return;
    }
    setIsSubmitting(true);
    try {
      const stripe = window.Stripe(key);
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

  if (error) {
    return <StripeNotConfigured />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment</CardTitle>
        <CardDescription>Enter your card details to complete the order.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div ref={cardMountRef} className="rounded-md border border-input bg-background p-3 min-h-[40px]" />
          <Button type="submit" className="w-full" size="lg" disabled={!ready || isSubmitting}>
            {isSubmitting ? "Processing…" : "Pay now"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
