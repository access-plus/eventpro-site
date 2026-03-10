import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { GuestCheckoutFormBento } from "@/components/GuestCheckoutFormBento";
import { MerchandiseAddons, type MerchandiseItem } from "@/components/MerchandiseAddons";
import { CheckoutPaymentForm } from "@/components/CheckoutPaymentForm";
import { ReservationCountdown } from "@/components/ReservationCountdown";
import { SuccessTicketReveal } from "@/components/SuccessTicketReveal";
import { TicketPreview } from "@/components/TicketPreview";
import { apiService } from "@/lib/api";
import { HOW_DID_YOU_HEAR_OPTIONS } from "@/types/api";
import { Ticket, Trash2, ArrowLeft, User, LogIn, MessageCircle, Smartphone, CreditCard } from "lucide-react";
import { CommunityImpactTile } from "@/components/CommunityImpactTile";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { motion } from "framer-motion";
import { toast } from "sonner";

interface SelectedMerchItem extends MerchandiseItem {
  quantity: number;
  selectedSize?: string;
}

function eventAddonsToMerchandise(addons: { id: string; name: string; description?: string; price: number; category: string; imageUrl?: string; sizes?: string[]; isPopular?: boolean }[]): MerchandiseItem[] {
  return addons.map((a) => ({
    id: a.id,
    name: a.name,
    description: a.description ?? "",
    price: Number(a.price),
    image: a.imageUrl,
    category: (a.category === "merchandise" || a.category === "addon" || a.category === "upgrade" ? a.category : "addon") as MerchandiseItem["category"],
    popular: a.isPopular ?? false,
    sizes: a.sizes,
  }));
}

const Checkout = () => {
  const { items, totalAmount, removeItem, clearCart } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checkoutMode, setCheckoutMode] = useState<"select" | "guest" | "login">("select");
  const [selectedMerch, setSelectedMerch] = useState<SelectedMerchItem[]>([]);
  const [addonsByEvent, setAddonsByEvent] = useState<MerchandiseItem[]>([]);
  const [donationAmount, setDonationAmount] = useState(0);
  const [donationsEnabled, setDonationsEnabled] = useState(false);
  const [guestInfo, setGuestInfo] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null>(null);
  const [paymentStep, setPaymentStep] = useState<"review" | "payment" | "success">("review");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [reservedTicketIds, setReservedTicketIds] = useState<string[] | null>(null);
  const [reservedUntil, setReservedUntil] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  const [howDidYouHear, setHowDidYouHear] = useState<string>("__");
  const [receiveTicketViaWhatsApp, setReceiveTicketViaWhatsApp] = useState(false);
  const [receiveTicketViaSMS, setReceiveTicketViaSMS] = useState(false);
  const [successEventName, setSuccessEventName] = useState<string | null>(null);
  const [successAttendeeName, setSuccessAttendeeName] = useState<string>("");
  const [successTicketType, setSuccessTicketType] = useState<string>("");
  /** Live form values for ticket preview (guest only, before submit). */
  const [previewGuest, setPreviewGuest] = useState({ firstName: "", lastName: "", email: "" });

  const eventIds = useMemo(() => [...new Set(items.map((i) => i.eventId).filter(Boolean))], [items]);

  useEffect(() => {
    if (eventIds.length === 0) {
      setAddonsByEvent([]);
      setDonationsEnabled(false);
      return;
    }
    Promise.all(eventIds.map((eventId) => apiService.getEventAddons(eventId)))
      .then((results) => {
        const merged = results.flat();
        setAddonsByEvent(eventAddonsToMerchandise(merged));
      })
      .catch(() => setAddonsByEvent([]));
    apiService
      .getEvent(eventIds[0])
      .then((event) => setDonationsEnabled(Boolean(event.donationsEnabled)))
      .catch(() => setDonationsEnabled(false));
  }, [eventIds.join(",")]);

  // For signed-in users: cart tickets are already reserved; get expiry for countdown
  useEffect(() => {
    if (!isAuthenticated || items.length === 0) return;
    apiService
      .getCart()
      .then((cart) => {
        if (cart.reservedUntil) setReservedUntil(cart.reservedUntil);
      })
      .catch(() => {});
  }, [isAuthenticated, items.length]);

  const merchTotal = selectedMerch.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const grandTotal = totalAmount + merchTotal + (donationAmount || 0);

  /** Attendee name for ticket preview: from user, guestInfo, or live preview. */
  const attendeeName =
    isAuthenticated && user
      ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
      : guestInfo
        ? `${guestInfo.firstName} ${guestInfo.lastName}`.trim()
        : `${previewGuest.firstName} ${previewGuest.lastName}`.trim();

  /** Ticket type label for preview (first item or "X tickets"). */
  const ticketLabel =
    items.length === 0
      ? "Ticket"
      : items.length === 1
        ? items[0].ticketTypeName
        : `${items.length} tickets`;

  /** Form valid: logged in, or guest info submitted, or live guest form valid (name + email). */
  const isFormValid =
    isAuthenticated ||
    !!guestInfo ||
    (previewGuest.firstName.trim() !== "" &&
      previewGuest.lastName.trim() !== "" &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(previewGuest.email));

  const handleGuestSubmit = (info: typeof guestInfo & { acceptTerms: boolean }) => {
    setGuestInfo(info);
    setCheckoutMode("select");
  };

  const handleProceedToPayment = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    setPaymentError(null);
    setIsStartingPayment(true);
    setReservedTicketIds(null);
    if (!isAuthenticated) setReservedUntil(null);
    try {
      const amount = Number(grandTotal.toFixed(2));
      if (amount <= 0) {
        setPaymentError("Order total must be greater than 0");
        toast.error("Order total must be greater than 0");
        return;
      }
      const isGuest = !isAuthenticated && !!guestInfo;
      if (isGuest && items.length > 0) {
        const reservePayload = items.map((i) => ({
          eventId: i.eventId,
          ticketType: i.ticketTypeId,
          quantity: i.quantity,
        }));
        const reserveData = await apiService.guestReserve(reservePayload);
        if (reserveData?.reservedTicketIds?.length) {
          setReservedTicketIds(reserveData.reservedTicketIds);
          if (reserveData.reservedUntil) setReservedUntil(reserveData.reservedUntil);
        }
      }
      const data = await apiService.createPaymentIntent(amount);
      const secret = data?.clientSecret ?? (data as { clientSecret?: string })?.clientSecret;
      if (!secret) {
        setPaymentError("Invalid response from server");
        toast.error("Invalid response from server");
        return;
      }
      setClientSecret(secret);
      setPaymentStep("payment");
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string }; status?: number } };
      const msg =
        ax?.response?.data?.message ??
        (err instanceof Error ? err.message : "Could not start payment");
      setPaymentError(msg);
      toast.error(msg);
    } finally {
      setIsStartingPayment(false);
    }
  };

  const buildGuestConfirm = (paymentIntentId: string) => {
    if (!guestInfo) throw new Error("Guest info required");
    return apiService.confirmGuestPayment({
      paymentIntentId,
      email: guestInfo.email,
      firstName: guestInfo.firstName,
      lastName: guestInfo.lastName,
      items: items.map((i) => ({
        eventId: i.eventId,
        ticketType: i.ticketTypeId,
        quantity: i.quantity,
      })),
      totalAmount: grandTotal,
      donationAmount: donationAmount > 0 ? Number(donationAmount.toFixed(2)) : undefined,
      reservedTicketIds: reservedTicketIds ?? undefined,
      howDidYouHear: howDidYouHear && howDidYouHear !== "__" ? howDidYouHear : undefined,
      receiveTicketViaWhatsApp: receiveTicketViaWhatsApp || undefined,
      receiveTicketViaSMS: receiveTicketViaSMS || undefined,
    });
  };

  const handlePaymentSuccess = (id: string) => {
    setSuccessEventName(items[0]?.eventName ?? null);
    setSuccessAttendeeName(
      isAuthenticated && user
        ? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim()
        : guestInfo
          ? `${guestInfo.firstName} ${guestInfo.lastName}`.trim()
          : `${previewGuest.firstName} ${previewGuest.lastName}`.trim()
    );
    setSuccessTicketType(ticketLabel);
    setOrderId(id);
    setPaymentStep("success");
    clearCart();
    toast.success("Order placed successfully");
  };

  if (items.length === 0 && paymentStep !== "success") {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4">
        <Card className="p-8 text-center max-w-md">
          <Ticket className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-4">
            Browse events and add tickets to your cart to proceed with checkout.
          </p>
          <Button onClick={() => navigate("/events")}>
            Browse Events
          </Button>
        </Card>
      </div>
    );
  }

  if (paymentStep === "success") {
    return (
      <SuccessTicketReveal
        orderId={orderId}
        eventName={successEventName ?? "Event"}
        attendeeName={successAttendeeName}
        ticketType={successTicketType}
      />
    );
  }

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      {/* Subtle background for vibrant one-page feel */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-primary-glow/5 blur-3xl" />
      </div>
      <div className="container relative mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Checkout
          </h1>
        </div>

        {/* Payment step: single centered glass card */}
        {paymentStep === "payment" && clientSecret ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto"
          >
            <div className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] backdrop-blur-[15px] shadow-[0_0_40px_rgba(147,51,234,0.15)] p-6 sm:p-8 space-y-6">
              {reservedUntil && (
                <ReservationCountdown
                  reservedUntil={reservedUntil}
                  onExpired={() => {
                    setReservedUntil(null);
                    setReservedTicketIds(null);
                    setPaymentStep("review");
                    toast.warning("Reservation expired. Tickets were released. Please try again.");
                  }}
                />
              )}
              <div className="flex items-baseline justify-between gap-4 border-b border-white/10 pb-4">
                <span className="text-sm text-muted-foreground uppercase tracking-wider">Order total</span>
                <span className="text-3xl sm:text-4xl font-bold tabular-nums tracking-tight text-foreground">
                  ${grandTotal.toFixed(2)}
                </span>
              </div>
              <CheckoutPaymentForm
                clientSecret={clientSecret}
                amount={grandTotal}
                isGuest={!isAuthenticated && !!guestInfo}
                guestConfirm={!isAuthenticated && guestInfo ? buildGuestConfirm : undefined}
                authenticatedConfirm={isAuthenticated ? (id) => apiService.confirmPayment(id) : undefined}
                onSuccess={handlePaymentSuccess}
                onError={(msg) => { setPaymentError(msg); toast.error(msg); }}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={() => { setPaymentStep("review"); setPaymentError(null); setReservedUntil(null); }}
              >
                ← Back to review
              </Button>
              {paymentError && (
                <p className="text-sm text-destructive text-center">{paymentError}</p>
              )}
            </div>
          </motion.div>
        ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - one-page vibrant */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info Section */}
            {!isAuthenticated && !guestInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {checkoutMode === "select" && (
                  <Card className="rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px]">
                    <CardHeader>
                      <CardTitle>How would you like to check out?</CardTitle>
                      <CardDescription>
                        Choose an option to continue with your purchase
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4 sm:grid-cols-2">
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={() => setCheckoutMode("guest")}
                      >
                        <User className="h-6 w-6" />
                        <span>Continue as Guest</span>
                        <span className="text-xs text-muted-foreground">
                          No account required
                        </span>
                      </Button>
                      <Button
                        variant="outline"
                        className="h-24 flex flex-col gap-2"
                        onClick={() => navigate("/login", { state: { from: { pathname: "/checkout" } } })}
                      >
                        <LogIn className="h-6 w-6" />
                        <span>Sign In</span>
                        <span className="text-xs text-muted-foreground">
                          For faster checkout
                        </span>
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {checkoutMode === "guest" && (
                  <>
                    {/* One-tap at top — same width as form */}
                    <div className="grid grid-cols-2 gap-3 mb-6">
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary/10 py-3 px-4 text-sm font-medium text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                        disabled
                        title="Enable in Stripe for one-tap checkout"
                      >
                        <CreditCard className="h-5 w-5" />
                        Apple Pay
                      </button>
                      <button
                        type="button"
                        className="flex items-center justify-center gap-2 rounded-xl border-2 border-primary/40 bg-primary/10 py-3 px-4 text-sm font-medium text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
                        disabled
                        title="Enable in Stripe for one-tap checkout"
                      >
                        <Smartphone className="h-5 w-5" />
                        Google Pay
                      </button>
                    </div>
                    <GuestCheckoutFormBento
                      onSubmit={handleGuestSubmit}
                      onLoginClick={() => navigate("/login", { state: { from: { pathname: "/checkout" } } })}
                      onFormChange={setPreviewGuest}
                    />
                  </>
                )}
              </motion.div>
            )}

            {/* Show logged in user info */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Account Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {user.firstName} {user.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Show guest info if provided */}
            {!isAuthenticated && guestInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      Guest Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-secondary flex items-center justify-center">
                          <User className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">
                            {guestInfo.firstName} {guestInfo.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{guestInfo.email}</p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setGuestInfo(null);
                          setCheckoutMode("guest");
                        }}
                      >
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Cart Items */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h2 className="text-xl font-semibold mb-4">Your Tickets</h2>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px]">
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex-1">
                          <h3 className="font-semibold">{item.ticketTypeName}</h3>
                          <p className="text-sm text-muted-foreground">{item.eventName}</p>
                          <p className="text-sm">Quantity: {item.quantity}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="font-bold">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Merchandise & Add-ons (dynamic per event) */}
            {addonsByEvent.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <MerchandiseAddons
                  items={addonsByEvent}
                  onItemsChange={setSelectedMerch}
                  eventName={items[0]?.eventName}
                />
              </motion.div>
            )}

            {/* Optional donation (Pro/Enterprise events with donations enabled) */}
            {donationsEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Card className="rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)]">
                  <CardHeader>
                    <CardTitle className="text-lg">Add a donation</CardTitle>
                    <CardDescription>Support the organizer (optional)</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {[5, 10, 25, 50].map((n) => (
                        <Button
                          key={n}
                          type="button"
                          variant={donationAmount === n ? "default" : "outline"}
                          size="sm"
                          onClick={() => setDonationAmount(n)}
                        >
                          ${n}
                        </Button>
                      ))}
                      <Button
                        type="button"
                        variant={donationAmount !== 5 && donationAmount !== 10 && donationAmount !== 25 && donationAmount !== 50 ? "default" : "outline"}
                        size="sm"
                        onClick={() => setDonationAmount(0)}
                      >
                        None
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="donation-amount" className="text-sm text-muted-foreground shrink-0">
                        Or enter amount ($):
                      </Label>
                      <Input
                        id="donation-amount"
                        type="number"
                        min={0}
                        step={1}
                        className="max-w-[120px]"
                        value={donationAmount > 0 ? donationAmount : ""}
                        onChange={(e) => setDonationAmount(Math.max(0, parseFloat(e.target.value) || 0))}
                        placeholder="0"
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Right column: Ticket Preview + Community Impact + Order Summary */}
          <div className="space-y-6">
            <CommunityImpactTile
              attendeeCount={0}
              eventName={items[0]?.eventName}
              className="w-full"
            />
            {/* Interactive Ticket Preview — reacts to form state */}
            <TicketPreview
              eventName={items[0]?.eventName ?? "Event"}
              attendeeName={attendeeName}
              ticketType={ticketLabel}
              totalAmount={grandTotal}
              isUnlocked={isFormValid}
            />
            <Card className="sticky top-24 rounded-xl border-white/10 bg-[rgba(255,255,255,0.05)] backdrop-blur-[12px]">
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your order before payment</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-muted-foreground">Tickets</h4>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.ticketTypeName} × {item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>

                {selectedMerch.length > 0 && (
                  <div className="space-y-2 pt-2 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">Add-ons</h4>
                    {selectedMerch.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>
                          {item.name}
                          {item.selectedSize && ` (${item.selectedSize})`}
                          {item.quantity > 1 && ` × ${item.quantity}`}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="border-t border-border pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tickets Subtotal</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                  {merchTotal > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Add-ons Subtotal</span>
                      <span>${merchTotal.toFixed(2)}</span>
                    </div>
                  )}
                  {donationAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Donation</span>
                      <span>${donationAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-baseline pt-2 border-t">
                    <span className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Total</span>
                    <span className="text-2xl sm:text-3xl font-bold tabular-nums tracking-tight text-foreground">
                      ${grandTotal.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* How did you hear (cultural taxonomy) */}
                <div className="space-y-2 pt-2 border-t border-border">
                  <Label className="text-sm font-medium text-muted-foreground">
                    How did you hear about this event?
                  </Label>
                  <Select value={howDidYouHear} onValueChange={setHowDidYouHear}>
                    <SelectTrigger className="rounded-lg border-primary/20 bg-background/80">
                      <SelectValue placeholder="Select (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {HOW_DID_YOU_HEAR_OPTIONS.map((opt) => (
                        <SelectItem key={opt.value || "opt"} value={opt.value === "" ? "__" : opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Receive ticket via WhatsApp / SMS */}
                <div className="space-y-3 pt-2 border-t border-border">
                  <Label className="text-sm font-medium text-muted-foreground">
                    Receive ticket via
                  </Label>
                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      <span className="text-sm">WhatsApp</span>
                    </div>
                    <Switch
                      checked={receiveTicketViaWhatsApp}
                      onCheckedChange={setReceiveTicketViaWhatsApp}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Smartphone className="h-4 w-4 text-primary" />
                      <span className="text-sm">SMS</span>
                    </div>
                    <Switch
                      checked={receiveTicketViaSMS}
                      onCheckedChange={setReceiveTicketViaSMS}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    We’ll send your digital ticket to your phone. Great for the diaspora.
                  </p>
                </div>

                {paymentStep === "review" && (
                  <>
                    {reservedUntil && (
                      <ReservationCountdown
                        reservedUntil={reservedUntil}
                        onExpired={() => {
                          setReservedUntil(null);
                          setReservedTicketIds(null);
                          toast.warning("Reservation expired. Tickets were released. Please try again.");
                        }}
                        className="mb-2"
                      />
                    )}
                    <Button
                      type="button"
                      className={
                        isFormValid
                          ? "w-full rounded-xl bg-gradient-to-r from-primary via-primary to-orange-500 text-white shadow-[0_4px_20px_rgba(147,51,234,0.4)] hover:shadow-[0_6px_28px_rgba(147,51,234,0.5),0_0_0_1px_rgba(251,146,60,0.3)] hover:scale-[1.02] transition-all duration-200 pay-button-shimmer"
                          : "w-full rounded-xl bg-muted text-muted-foreground cursor-not-allowed"
                      }
                      size="lg"
                      disabled={(!isAuthenticated && !guestInfo) || isStartingPayment}
                      onClick={(e) => handleProceedToPayment(e)}
                    >
                      {isStartingPayment ? "Starting payment…" : isFormValid ? "Proceed to Payment" : "Complete your details above"}
                    </Button>
                    {paymentError && (
                      <p className="text-sm text-destructive text-center mt-2">{paymentError}</p>
                    )}
                  </>
                )}
                {!isAuthenticated && !guestInfo && paymentStep === "review" && (
                  <p className="text-xs text-muted-foreground text-center">
                    Please provide your information above to continue
                  </p>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  By completing this purchase, you agree to our Terms of Service
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default Checkout;