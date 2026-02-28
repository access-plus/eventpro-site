import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { Ticket, Wallet, Smartphone, MessageCircle, Share2 } from "lucide-react";
import { toast } from "sonner";

const QR_BASE = "https://api.qrserver.com/v1/create-qr-code/";

export interface SuccessTicketRevealProps {
  orderId: string | null;
  eventName: string;
  attendeeName: string;
  ticketType: string;
}

export function SuccessTicketReveal({
  orderId,
  eventName,
  attendeeName,
  ticketType,
}: SuccessTicketRevealProps) {
  const navigate = useNavigate();
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/events` : "";
  const shareText = eventName
    ? `I'm going to ${eventName}! Get your ticket: ${shareUrl}`
    : `Just got my ticket! Check out events: ${shareUrl}`;

  return (
    <>
      <style>{`
        .success-qr-glow {
          animation: success-qr-pulse 2s ease-in-out infinite;
        }
        @keyframes success-qr-pulse {
          0%, 100% { box-shadow: 0 0 24px rgba(147,51,234,0.4), 0 0 48px rgba(147,51,234,0.15); }
          50% { box-shadow: 0 0 36px rgba(147,51,234,0.6), 0 0 64px rgba(147,51,234,0.25); }
        }
        .ticket-stub-success {
          mask-image: radial-gradient(circle at 0 50%, transparent 6px, black 7px);
          mask-size: 14px 100%;
          mask-repeat: repeat-x;
          -webkit-mask-image: radial-gradient(circle at 0 50%, transparent 6px, black 7px);
          -webkit-mask-size: 14px 100%;
          -webkit-mask-repeat: repeat-x;
        }
      `}</style>
      <div className="min-h-screen py-8 px-4 flex flex-col items-center justify-center">
        {/* Mesh gradient behind */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-1/4 left-1/2 w-[32rem] h-[32rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute top-1/2 -left-20 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl" />
          <div className="absolute bottom-1/4 right-0 w-96 h-96 rounded-full bg-orange-500/10 blur-3xl" />
        </div>

        <motion.div
          className="relative w-full max-w-md"
          initial={{ opacity: 0, y: 80, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{
            type: "spring",
            stiffness: 260,
            damping: 24,
            mass: 0.8,
          }}
        >
          {/* Ticket card — "arrives" with spring */}
          <div className="relative rounded-xl border-2 border-primary/40 bg-[rgba(255,255,255,0.08)] backdrop-blur-[16px] p-6 shadow-[0_0_40px_rgba(147,51,234,0.25)] overflow-hidden">
            <div className="ticket-stub-success absolute right-0 top-0 bottom-0 w-3 bg-[rgba(255,255,255,0.04)]" />

            <div className="flex items-center gap-2 mb-4">
              <Ticket className="h-6 w-6 text-primary" />
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground">
                Your ticket
              </span>
            </div>
            <h2 className="font-bold uppercase tracking-wide text-foreground text-lg mb-1 line-clamp-2">
              {eventName || "Event"}
            </h2>
            <p className="text-sm text-muted-foreground mb-4">{attendeeName || "Attendee"}</p>
            <p className="text-xs font-medium text-primary mb-6 inline-block px-2 py-1 rounded-md bg-primary/15 border border-primary/30">
              {ticketType || "Ticket"}
            </p>

            {/* QR — high-contrast glow, scan-ready */}
            <div className="success-qr-glow inline-flex p-4 rounded-2xl bg-white/95">
              {orderId ? (
                <img
                  src={`${QR_BASE}?size=200x200&data=${encodeURIComponent(orderId)}&format=svg`}
                  alt="Ticket QR code"
                  className="w-[200px] h-[200px] rounded-lg"
                />
              ) : (
                <div className="w-[200px] h-[200px] rounded-lg bg-muted flex items-center justify-center text-muted-foreground text-sm">
                  QR
                </div>
              )}
            </div>
            <p className="text-center text-sm font-medium text-emerald-600 dark:text-emerald-400 mt-3">
              Scan-ready at the door
            </p>
          </div>

          {/* Actions */}
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              className="rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/15"
              onClick={() => window.open("https://support.apple.com/en-us/HT207945", "_blank")}
            >
              <Wallet className="h-4 w-4 mr-2" />
              Apple Wallet
            </Button>
            <Button
              variant="outline"
              className="rounded-xl border-primary/30 bg-primary/5 text-primary hover:bg-primary/15"
              onClick={() => window.open("https://pay.google.com/about/passes/", "_blank")}
            >
              <Smartphone className="h-4 w-4 mr-2" />
              Google Wallet
            </Button>
          </motion.div>
          <motion.div
            className="mt-4 flex flex-wrap gap-3 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank")}
            >
              <MessageCircle className="h-4 w-4 mr-2" />
              Share on WhatsApp
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="rounded-xl"
              onClick={() => {
                navigator.clipboard.writeText(shareUrl);
                toast.success("Link copied!");
              }}
            >
              <Share2 className="h-4 w-4 mr-2" />
              Copy link
            </Button>
          </motion.div>
          <motion.div
            className="mt-8 flex flex-col sm:flex-row gap-3 justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button variant="outline" className="rounded-xl" onClick={() => navigate("/events")}>
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
    </>
  );
}
