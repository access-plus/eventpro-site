import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { CheckCircle, Ticket, Wallet, Smartphone } from "lucide-react";

interface PostPurchaseCelebrationProps {
  orderId: string | null;
  eventName?: string;
}

export function PostPurchaseCelebration({ orderId, eventName }: PostPurchaseCelebrationProps) {
  const navigate = useNavigate();
  const [revealed, setRevealed] = useState(false);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-background/95 backdrop-blur-sm">
      {/* Ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/2 w-[32rem] h-[32rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary-glow/15 blur-3xl" />
      </div>

      <motion.div
        className="relative z-10 w-full max-w-lg mx-auto px-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        {/* Success icon with ring */}
        <motion.div
          className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-500/20 ring-4 ring-emerald-500/30 shadow-[0_0_40px_rgba(34,197,94,0.3)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="h-12 w-12 text-emerald-500" />
        </motion.div>

        <motion.h1
          className="text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent mb-2"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          You’re in!
        </motion.h1>
        <motion.p
          className="text-muted-foreground mb-6"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Your ticket{eventName ? ` for ${eventName}` : ""} is confirmed.
          {orderId && (
            <span className="block mt-1 text-sm font-mono text-foreground/80">
              Order #{orderId.slice(0, 8).toUpperCase()}
            </span>
          )}
        </motion.p>

        {/* Ticket reveal card */}
        <motion.div
          className="rounded-2xl border border-white/10 bg-[rgba(255,255,255,0.06)] backdrop-blur-xl p-6 mb-8 shadow-[0_0_30px_rgba(147,51,234,0.2)]"
          initial={{ rotateY: -90, opacity: 0 }}
          animate={{ rotateY: 0, opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onAnimationComplete={() => setRevealed(true)}
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <Ticket className="h-8 w-8 text-primary" />
            <span className="font-semibold text-lg">Digital Ticket</span>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            We’ve sent your ticket to your email. Add it to your wallet for quick access at the door.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 h-12"
              onClick={() => window.open("https://support.apple.com/en-us/HT207945", "_blank")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Add to Apple Wallet
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/15 h-12"
              onClick={() => window.open("https://pay.google.com/about/passes/", "_blank")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Add to Google Wallet
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Wallet links open in a new tab. Your ticket was also sent by email.
          </p>
        </motion.div>

        <motion.div
          className="flex flex-col sm:flex-row gap-3 justify-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.7 }}
        >
          <Button
            variant="outline"
            className="rounded-xl"
            onClick={() => navigate("/events")}
          >
            Browse more events
          </Button>
          <Button
            className="rounded-xl bg-gradient-to-r from-primary to-primary-glow text-white"
            onClick={() => navigate("/")}
          >
            Back to home
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
}
