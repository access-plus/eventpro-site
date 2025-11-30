import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiService } from "@/lib/api";
import { getStripe } from "@/lib/stripe";
import { Elements } from "@stripe/react-stripe-js";
import { StripePaymentForm } from "@/components/checkout/StripePaymentForm";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { 
  Check, 
  ShoppingCart, 
  User, 
  CreditCard, 
  CheckCircle2,
  Calendar,
  MapPin,
  Ticket
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const customerSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50),
  lastName: z.string().min(1, "Last name is required").max(50),
  email: z.string().email("Invalid email address"),
  phone: z.string().min(10, "Phone number must be at least 10 digits").max(20),
});

type CustomerForm = z.infer<typeof customerSchema>;

const steps = [
  { id: 1, name: "Review Order", icon: ShoppingCart },
  { id: 2, name: "Customer Info", icon: User },
  { id: 3, name: "Payment", icon: CreditCard },
  { id: 4, name: "Confirmation", icon: CheckCircle2 },
];

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [customerData, setCustomerData] = useState<CustomerForm | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [stripePromise] = useState(() => getStripe());

  const customerForm = useForm<CustomerForm>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      firstName: user?.firstName || "",
      lastName: user?.lastName || "",
      email: user?.email || "",
      phone: user?.phoneNumber || "",
    },
  });

  // Create payment intent when moving to payment step
  useEffect(() => {
    const createPaymentIntent = async () => {
      if (currentStep === 3 && !clientSecret) {
        try {
          const { clientSecret: secret } = await apiService.createPaymentIntent(
            totalAmount
          );
          setClientSecret(secret);
        } catch (error) {
          console.error("Failed to create payment intent:", error);
          toast({
            title: "Payment setup failed",
            description: "Unable to initialize payment. Please try again.",
            variant: "destructive",
          });
          setCurrentStep(2);
        }
      }
    };

    createPaymentIntent();
  }, [currentStep, clientSecret, totalAmount, toast]);

  if (items.length === 0 && currentStep < 4) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <ShoppingCart className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-2xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-muted-foreground mb-6">
            Add some tickets to your cart before checking out
          </p>
          <Button onClick={() => navigate("/events")} className="bg-gradient-primary">
            Browse Events
          </Button>
        </Card>
      </div>
    );
  }

  const onCustomerSubmit = (data: CustomerForm) => {
    setCustomerData(data);
    setCurrentStep(3);
  };

  const onPaymentSuccess = async (paymentIntentId: string) => {
    try {
      // Confirm payment and create order in backend
      const order = await apiService.confirmPayment(paymentIntentId);
      setOrderId(order.id);
      
      // Clear cart
      clearCart();
      
      // Move to confirmation
      setCurrentStep(4);
      
      toast({
        title: "Order placed successfully!",
        description: `Order #${order.id.slice(0, 8)} has been confirmed`,
      });
    } catch (error) {
      console.error("Order creation failed:", error);
      toast({
        title: "Payment confirmation failed",
        description: "There was an error confirming your payment. Please contact support.",
        variant: "destructive",
      });
    }
  };

  const onPaymentError = (error: string) => {
    toast({
      title: "Payment failed",
      description: error,
      variant: "destructive",
    });
  };

  return (
    <div className="min-h-screen py-8 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Progress Steps */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = currentStep === step.id;
              const isCompleted = currentStep > step.id;
              
              return (
                <div key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all ${
                        isCompleted
                          ? "bg-primary border-primary text-primary-foreground"
                          : isActive
                          ? "bg-gradient-primary border-primary text-primary-foreground"
                          : "bg-background border-border text-muted-foreground"
                      }`}
                    >
                      {isCompleted ? (
                        <Check className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <span
                      className={`text-xs mt-2 font-medium hidden sm:block ${
                        isActive ? "text-foreground" : "text-muted-foreground"
                      }`}
                    >
                      {step.name}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`h-1 flex-1 mx-2 rounded transition-all ${
                        isCompleted ? "bg-primary" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <AnimatePresence mode="wait">
              {/* Step 1: Review Order */}
              {currentStep === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Review Your Order</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {items.map((item) => (
                        <div key={item.id} className="flex gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <h4 className="font-semibold">{item.eventName}</h4>
                            <p className="text-sm text-muted-foreground">
                              {item.ticketTypeName}
                            </p>
                            <p className="text-sm mt-1">
                              Quantity: <span className="font-medium">{item.quantity}</span>
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-primary">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${item.price.toFixed(2)} each
                            </p>
                          </div>
                        </div>
                      ))}
                      
                      <div className="flex justify-between pt-4">
                        <Button variant="outline" onClick={() => navigate("/events")}>
                          Continue Shopping
                        </Button>
                        <Button
                          onClick={() => setCurrentStep(2)}
                          className="bg-gradient-primary"
                        >
                          Continue to Customer Info
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 2: Customer Information */}
              {currentStep === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Customer Information</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <form onSubmit={customerForm.handleSubmit(onCustomerSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName">First Name</Label>
                            <Input
                              id="firstName"
                              {...customerForm.register("firstName")}
                              placeholder="John"
                            />
                            {customerForm.formState.errors.firstName && (
                              <p className="text-sm text-destructive">
                                {customerForm.formState.errors.firstName.message}
                              </p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName">Last Name</Label>
                            <Input
                              id="lastName"
                              {...customerForm.register("lastName")}
                              placeholder="Doe"
                            />
                            {customerForm.formState.errors.lastName && (
                              <p className="text-sm text-destructive">
                                {customerForm.formState.errors.lastName.message}
                              </p>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            {...customerForm.register("email")}
                            placeholder="john@example.com"
                          />
                          {customerForm.formState.errors.email && (
                            <p className="text-sm text-destructive">
                              {customerForm.formState.errors.email.message}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="phone">Phone Number</Label>
                          <Input
                            id="phone"
                            type="tel"
                            {...customerForm.register("phone")}
                            placeholder="+1234567890"
                          />
                          {customerForm.formState.errors.phone && (
                            <p className="text-sm text-destructive">
                              {customerForm.formState.errors.phone.message}
                            </p>
                          )}
                        </div>

                        <div className="flex justify-between pt-4">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setCurrentStep(1)}
                          >
                            Back
                          </Button>
                          <Button type="submit" className="bg-gradient-primary">
                            Continue to Payment
                          </Button>
                        </div>
                      </form>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 3: Payment */}
              {currentStep === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>Payment Details</CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Secure payment powered by Stripe
                      </p>
                    </CardHeader>
                    <CardContent>
                      {clientSecret && stripePromise ? (
                        <Elements
                          stripe={stripePromise}
                          options={{
                            clientSecret,
                            appearance: {
                              theme: "stripe",
                              variables: {
                                colorPrimary: "hsl(var(--primary))",
                                colorBackground: "hsl(var(--background))",
                                colorText: "hsl(var(--foreground))",
                                colorDanger: "hsl(var(--destructive))",
                                fontFamily: "system-ui, sans-serif",
                                borderRadius: "0.5rem",
                              },
                            },
                          }}
                        >
                          <StripePaymentForm
                            totalAmount={totalAmount}
                            onBack={() => {
                              setCurrentStep(2);
                              setClientSecret(null);
                            }}
                            onSuccess={onPaymentSuccess}
                            onError={onPaymentError}
                          />
                        </Elements>
                      ) : (
                        <div className="flex items-center justify-center py-12">
                          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Step 4: Confirmation */}
              {currentStep === 4 && (
                <motion.div
                  key="step4"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <Card className="text-center">
                    <CardContent className="pt-12 pb-12">
                      <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="h-12 w-12 text-primary" />
                      </div>
                      <h2 className="text-3xl font-bold mb-2">Order Confirmed!</h2>
                      <p className="text-muted-foreground mb-2">
                        Thank you for your purchase
                      </p>
                      {orderId && (
                        <p className="text-sm text-muted-foreground mb-8">
                          Order ID: <span className="font-mono">{orderId.slice(0, 8)}</span>
                        </p>
                      )}
                      
                      <div className="space-y-3 max-w-md mx-auto">
                        <p className="text-sm">
                          A confirmation email has been sent to <strong>{customerData?.email}</strong>
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Your tickets have been sent to your email and are available in your profile.
                        </p>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
                        <Button onClick={() => navigate("/profile")} className="bg-gradient-primary">
                          View My Tickets
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/events")}>
                          Browse More Events
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Order Summary Sidebar */}
          {currentStep < 4 && (
            <div className="lg:col-span-1">
              <Card className="sticky top-8">
                <CardHeader>
                  <CardTitle>Order Summary</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    {items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.eventName}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {item.ticketTypeName} × {item.quantity}
                          </p>
                        </div>
                        <span className="font-medium ml-2">
                          ${(item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Fee</span>
                      <span>$0.00</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total</span>
                    <span className="text-2xl font-bold text-primary">
                      ${totalAmount.toFixed(2)}
                    </span>
                  </div>

                  <div className="bg-secondary/50 p-3 rounded-lg">
                    <p className="text-xs text-muted-foreground">
                      By completing this purchase you agree to our terms and conditions
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Checkout;
