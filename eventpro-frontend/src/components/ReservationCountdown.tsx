import { useEffect, useRef, useState } from "react";
import { Clock } from "lucide-react";

interface ReservationCountdownProps {
  /** ISO-8601 timestamp when the reservation expires (tickets released back to pool). */
  reservedUntil: string;
  /** Called when the countdown reaches zero (reservation expired). */
  onExpired: () => void;
  className?: string;
}

function formatRemaining(secondsLeft: number): string {
  if (secondsLeft <= 0) return "0:00";
  const m = Math.floor(secondsLeft / 60);
  const s = secondsLeft % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ReservationCountdown({ reservedUntil, onExpired, className = "" }: ReservationCountdownProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const end = new Date(reservedUntil).getTime();
    const now = Date.now();
    return Math.max(0, Math.floor((end - now) / 1000));
  });
  const [expired, setExpired] = useState(false);
  const onExpiredCalled = useRef(false);

  useEffect(() => {
    onExpiredCalled.current = false;
    const endMs = new Date(reservedUntil).getTime();
    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.floor((endMs - now) / 1000));
      setSecondsLeft(left);
      if (left <= 0 && !onExpiredCalled.current) {
        onExpiredCalled.current = true;
        setExpired(true);
        onExpired();
      }
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [reservedUntil, onExpired]);

  if (expired || secondsLeft <= 0) {
    return (
      <div
        className={`flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-3 py-2 text-sm text-destructive ${className}`}
      >
        <Clock className="h-4 w-4 shrink-0" />
        <span>Reservation expired. Tickets have been released. Please go back and try again.</span>
      </div>
    );
  }

  return (
    <div
      className={`flex items-center gap-2 rounded-lg border border-amber-500/50 bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-200 ${className}`}
    >
      <Clock className="h-4 w-4 shrink-0" />
      <span>
        Your tickets are held for <strong>{formatRemaining(secondsLeft)}</strong>. Complete payment before they’re
        released back.
      </span>
    </div>
  );
}
