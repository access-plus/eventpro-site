import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { GuestCheckoutForm } from "@/components/GuestCheckoutForm";
import { MerchandiseAddons, sampleMerchandise, type MerchandiseItem } from "@/components/MerchandiseAddons";
import { Ticket, Trash2, ArrowLeft, User, LogIn } from "lucide-react";
import { motion } from "framer-motion";

interface SelectedMerchItem extends MerchandiseItem {
  quantity: number;
  selectedSize?: string;
}

const Checkout = () => {
  const { items, totalAmount, removeItem } = useCart();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [checkoutMode, setCheckoutMode] = useState<"select" | "guest" | "login">("select");
  const [selectedMerch, setSelectedMerch] = useState<SelectedMerchItem[]>([]);
  const [guestInfo, setGuestInfo] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  } | null>(null);

  const merchTotal = selectedMerch.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const grandTotal = totalAmount + merchTotal;

  const handleGuestSubmit = (info: typeof guestInfo & { acceptTerms: boolean }) => {
    setGuestInfo(info);
    setCheckoutMode("select");
  };

  if (items.length === 0) {
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

  return (
    <div className="min-h-screen py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Checkout
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Customer Info Section */}
            {!isAuthenticated && !guestInfo && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                {checkoutMode === "select" && (
                  <Card>
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
                  <GuestCheckoutForm
                    onSubmit={handleGuestSubmit}
                    onLoginClick={() => navigate("/login", { state: { from: { pathname: "/checkout" } } })}
                  />
                )}
              </motion.div>
            )}

            {/* Show logged in user info */}
            {isAuthenticated && user && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card>
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
                <Card>
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
                    <Card>
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

            {/* Merchandise & Add-ons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <MerchandiseAddons
                items={sampleMerchandise}
                onItemsChange={setSelectedMerch}
                eventName={items[0]?.eventName}
              />
            </motion.div>
          </div>

          {/* Order Summary */}
          <div>
            <Card className="sticky top-24">
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
                  <div className="flex justify-between font-bold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span>${grandTotal.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-primary"
                  size="lg"
                  disabled={!isAuthenticated && !guestInfo}
                >
                  Proceed to Payment
                </Button>

                {!isAuthenticated && !guestInfo && (
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
      </div>
    </div>
  );
};

export default Checkout;