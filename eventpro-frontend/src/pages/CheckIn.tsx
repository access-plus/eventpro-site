import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { apiService } from "@/lib/api";
import type { CheckInResult, Event } from "@/types/api";
import { toast } from "sonner";
import { QrCode, Loader2, CheckCircle2, XCircle, ArrowLeft, ScanLine } from "lucide-react";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function CheckIn() {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>("");
  const [ticketIdInput, setTicketIdInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const barcodeDetectorRef = useRef<InstanceType<typeof BarcodeDetector> | null>(null);
  const animationRef = useRef<number>(0);

  const isOrganizer = hasRole("ORGANIZER") || hasRole("ADMIN");

  const loadEvents = useCallback(async () => {
    try {
      const list = await apiService.getOrganizerEvents();
      setEvents(list);
      if (list.length > 0 && !selectedEventId) {
        setSelectedEventId(list[0].id);
      }
    } catch {
      toast.error("Could not load your events");
    }
  }, [selectedEventId]);

  useEffect(() => {
    if (isOrganizer) loadEvents();
  }, [isOrganizer, loadEvents]);

  const validateAndCheckIn = useCallback(
    async (ticketId: string) => {
      const trimmed = ticketId.trim();
      if (!trimmed) {
        toast.error("Enter or scan a ticket ID");
        return;
      }
      if (!UUID_REGEX.test(trimmed)) {
        toast.error("Invalid ticket ID format (expected UUID from QR code)");
        return;
      }
      setLoading(true);
      setLastResult(null);
      try {
        const result = await apiService.checkInTicket(trimmed);
        setLastResult(result);
        setTicketIdInput("");
        if (result.alreadyCheckedIn) {
          toast.info(`${result.attendeeName} – ${result.ticketName} (already checked in)`);
        } else {
          toast.success(`Checked in: ${result.attendeeName} – ${result.ticketName}`);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Check-in failed";
        toast.error(msg);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    validateAndCheckIn(ticketIdInput);
  };

  const hasBarcodeDetector =
    typeof window !== "undefined" && "BarcodeDetector" in window;

  const startCamera = useCallback(async () => {
    if (!videoRef.current || !hasBarcodeDetector) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setScanning(true);
      barcodeDetectorRef.current = new (window as unknown as { BarcodeDetector: typeof BarcodeDetector })
        .BarcodeDetector({ formats: ["qr_code"] });

      const detectLoop = async () => {
        if (!videoRef.current || !barcodeDetectorRef.current || videoRef.current.readyState < 2) {
          animationRef.current = requestAnimationFrame(detectLoop);
          return;
        }
        try {
          const barcodes = await barcodeDetectorRef.current.detect(videoRef.current);
          const qr = barcodes.find((b) => b.rawValue && UUID_REGEX.test(b.rawValue));
          if (qr?.rawValue) {
            setScanning(false);
            stopCamera();
            await validateAndCheckIn(qr.rawValue);
            return;
          }
        } catch {
          // ignore single-frame errors
        }
        animationRef.current = requestAnimationFrame(detectLoop);
      };
      detectLoop();
    } catch (err) {
      toast.error("Camera access denied or unavailable");
      setScanning(false);
    }
  }, [hasBarcodeDetector, validateAndCheckIn]);

  const stopCamera = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = 0;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setScanning(false);
  }, []);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  if (!user) {
    navigate("/login");
    return null;
  }
  if (!isOrganizer) {
    return (
      <div className="container max-w-md py-8 px-4">
        <p className="text-muted-foreground text-center">You need organizer access to use the check-in app.</p>
        <Button variant="link" className="mt-4 w-full" onClick={() => navigate("/pricing")}>
          Upgrade to Pro
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24">
      <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-background/95 px-4 py-3 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate("/organizer")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">Check-in</h1>
      </div>

      <div className="container max-w-md space-y-6 px-4 py-6">
        {events.length > 0 && (
          <Card>
            <CardHeader className="pb-2">
              <Label>Event (optional)</Label>
            </CardHeader>
            <CardContent className="pt-0">
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((ev) => (
                    <SelectItem key={ev.id} value={ev.id}>
                      {ev.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-xs text-muted-foreground">
                Ticket is validated against your events automatically.
              </p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="font-medium">Scan or enter ticket ID</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <form onSubmit={handleManualSubmit} className="space-y-3">
              <Input
                placeholder="Paste ticket ID (UUID) or scan below"
                value={ticketIdInput}
                onChange={(e) => setTicketIdInput(e.target.value)}
                disabled={loading}
                className="font-mono text-sm"
                autoComplete="off"
              />
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "Check in"
                )}
              </Button>
            </form>

            {hasBarcodeDetector && (
              <div className="space-y-2">
                <div className="relative aspect-square max-w-[280px] mx-auto overflow-hidden rounded-lg border bg-black">
                  {!scanning ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-white">
                      <ScanLine className="h-12 w-12 text-white/70" />
                      <Button type="button" variant="secondary" size="sm" onClick={startCamera}>
                        Open camera to scan QR
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        playsInline
                        muted
                        className="h-full w-full object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute bottom-2 left-1/2 -translate-x-1/2"
                        onClick={stopCamera}
                      >
                        Stop camera
                      </Button>
                    </>
                  )}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  Point the camera at the ticket QR code. Works best in Chrome on Android.
                </p>
              </div>
            )}

            {!hasBarcodeDetector && (
              <p className="text-xs text-muted-foreground text-center">
                For QR scanning, use Chrome on Android. You can paste a ticket ID from any QR app.
              </p>
            )}
          </CardContent>
        </Card>

        {lastResult && (
          <Card className={lastResult.alreadyCheckedIn ? "border-amber-500/50" : "border-green-500/50"}>
            <CardContent className="flex items-center gap-3 pt-4">
              {lastResult.alreadyCheckedIn ? (
                <XCircle className="h-10 w-10 text-amber-500 flex-shrink-0" />
              ) : (
                <CheckCircle2 className="h-10 w-10 text-green-500 flex-shrink-0" />
              )}
              <div>
                <p className="font-medium">{lastResult.attendeeName}</p>
                <p className="text-sm text-muted-foreground">{lastResult.ticketName}</p>
                {lastResult.alreadyCheckedIn && (
                  <p className="text-xs text-amber-600 dark:text-amber-400">Already checked in</p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
