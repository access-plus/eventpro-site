import { useCallback, useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Mail,
  Calendar,
  PenLine,
  CalendarDays,
  Ticket,
  Star,
  BarChart3,
  Wallet,
  ShieldCheck,
  ShieldAlert,
  Users,
  Palette,
  TrendingUp,
  AlertCircle,
  Loader2,
  ShieldQuestion,
  Lock,
  ChevronRight,
  Key,
  Copy,
  Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { apiService } from "@/lib/api";
import type { ApiKey, CreateApiKeyResponse, OrganizerSummary, TeamMember } from "@/types/api";
import { IdentityCheckModal } from "@/components/IdentityCheckModal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const VERIFIED_CELEBRATION_KEY = "profile_verified_celebration_shown";

const Profile = () => {
  const { user, hasRole, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [summary, setSummary] = useState<OrganizerSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [identityModalOpen, setIdentityModalOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [showVerifiedCelebration, setShowVerifiedCelebration] = useState(false);
  const [riskRefreshing, setRiskRefreshing] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<CreateApiKeyResponse | null>(null);
  const [createKeyName, setCreateKeyName] = useState("");
  const [createKeySubmitting, setCreateKeySubmitting] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [teamLoading, setTeamLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "EDITOR" | "VIEWER">("EDITOR");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [brandingLogoUrl, setBrandingLogoUrl] = useState(user?.brandingLogoUrl ?? "");
  const [brandingPrimaryColor, setBrandingPrimaryColor] = useState(user?.brandingPrimaryColor ?? "");
  const [brandingHidePlatform, setBrandingHidePlatform] = useState(user?.brandingHidePlatform ?? false);
  const [brandingSaving, setBrandingSaving] = useState(false);

  const fetchSummary = useCallback(() => {
    if (!hasRole("ORGANIZER")) {
      setSummaryLoading(false);
      return;
    }
    setSummaryLoading(true);
    apiService
      .getOrganizerSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [hasRole]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const fetchApiKeys = useCallback(() => {
    if (user?.subscriptionTier !== "ENTERPRISE") return;
    setApiKeysLoading(true);
    apiService
      .listApiKeys()
      .then(setApiKeys)
      .catch(() => setApiKeys([]))
      .finally(() => setApiKeysLoading(false));
  }, [user?.subscriptionTier]);

  useEffect(() => {
    if (user?.subscriptionTier === "ENTERPRISE") fetchApiKeys();
  }, [user?.subscriptionTier, fetchApiKeys]);

  const isProOrEnterprise = user?.subscriptionTier === "PRO" || user?.subscriptionTier === "ENTERPRISE";
  const fetchTeamMembers = useCallback(() => {
    if (!isProOrEnterprise) return;
    setTeamLoading(true);
    apiService
      .listTeamMembers()
      .then(setTeamMembers)
      .catch(() => setTeamMembers([]))
      .finally(() => setTeamLoading(false));
  }, [isProOrEnterprise]);

  useEffect(() => {
    if (isProOrEnterprise) fetchTeamMembers();
  }, [isProOrEnterprise, fetchTeamMembers]);

  useEffect(() => {
    setBrandingLogoUrl(user?.brandingLogoUrl ?? "");
    setBrandingPrimaryColor(user?.brandingPrimaryColor ?? "");
    setBrandingHidePlatform(user?.brandingHidePlatform ?? false);
  }, [user?.brandingLogoUrl, user?.brandingPrimaryColor, user?.brandingHidePlatform]);

  const handleSaveBranding = useCallback(() => {
    setBrandingSaving(true);
    apiService
      .updateUser({
        brandingLogoUrl: brandingLogoUrl.trim() || null,
        brandingPrimaryColor: brandingPrimaryColor.trim() || null,
        brandingHidePlatform,
      })
      .then(() => {
        refreshUser();
        toast.success("Branding saved. It will appear on your event pages.");
      })
      .catch(() => toast.error("Failed to save branding"))
      .finally(() => setBrandingSaving(false));
  }, [brandingLogoUrl, brandingPrimaryColor, brandingHidePlatform, refreshUser]);

  const handleInviteTeamMember = useCallback(() => {
    const email = inviteEmail.trim();
    if (!email) {
      toast.error("Enter an email address");
      return;
    }
    setInviteSubmitting(true);
    apiService
      .inviteTeamMember(email, inviteRole)
      .then((member) => {
        setTeamMembers((prev) => [...prev, member]);
        setInviteEmail("");
        toast.success(`${member.email ?? email} added to your team`);
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message ?? "Failed to add team member");
      })
      .finally(() => setInviteSubmitting(false));
  }, [inviteEmail, inviteRole]);

  const handleRemoveTeamMember = useCallback(
    (userId: string) => {
      if (!confirm("Remove this team member? They will lose access to your events.")) return;
      apiService
        .removeTeamMember(userId)
        .then(() => {
          setTeamMembers((prev) => prev.filter((m) => m.userId !== userId));
          toast.success("Team member removed");
        })
        .catch(() => toast.error("Failed to remove team member"));
    },
    []
  );

  const handleUpdateTeamMemberRole = useCallback((userId: string, role: "ADMIN" | "EDITOR" | "VIEWER") => {
    apiService
      .updateTeamMemberRole(userId, role)
      .then((updated) => {
        setTeamMembers((prev) => prev.map((m) => (m.userId === userId ? updated : m)));
        toast.success("Role updated");
      })
      .catch(() => toast.error("Failed to update role"));
  }, []);

  const handleCreateApiKey = useCallback(() => {
    const name = createKeyName.trim();
    if (!name) {
      toast.error("Enter a name for the API key");
      return;
    }
    setCreateKeySubmitting(true);
    apiService
      .createApiKey(name)
      .then((result) => {
        setNewKeyResult(result);
        setCreateKeyName("");
        fetchApiKeys();
        toast.success("API key created. Copy it now — it won't be shown again.");
      })
      .catch((err: { response?: { data?: { message?: string } } }) => {
        toast.error(err?.response?.data?.message ?? "Failed to create API key");
      })
      .finally(() => setCreateKeySubmitting(false));
  }, [createKeyName, fetchApiKeys]);

  const handleCopyKey = useCallback((key: string) => {
    navigator.clipboard.writeText(key);
    toast.success("API key copied to clipboard");
  }, []);

  const handleRevokeApiKey = useCallback(
    (id: string) => {
      if (!confirm("Revoke this API key? It will stop working immediately.")) return;
      apiService
        .revokeApiKey(id)
        .then(() => {
          fetchApiKeys();
          if (newKeyResult?.id === id) setNewKeyResult(null);
          toast.success("API key revoked");
        })
        .catch(() => toast.error("Failed to revoke API key"));
    },
    [fetchApiKeys, newKeyResult?.id]
  );

  // Real-time: refetch organizer stats when window regains focus (e.g. after ticket sale in another tab)
  useEffect(() => {
    if (!hasRole("ORGANIZER")) return;
    const onFocus = () => fetchSummary();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hasRole, fetchSummary]);

  // Fetch rejection reason when REJECTED (transparency for US users)
  useEffect(() => {
    if (!hasRole("ORGANIZER") || (user?.verificationStatus ?? "NOT_STARTED") !== "REJECTED") {
      setRejectionReason(null);
      return;
    }
    apiService.getVerificationStatus().then((res) => setRejectionReason(res.lastRejectionReason ?? null)).catch(() => setRejectionReason(null));
  }, [hasRole, user?.verificationStatus]);

  // One-time Verified celebration (vibrant green glow)
  useEffect(() => {
    const isVerifiedNow = Boolean(user?.isVerified) || user?.verificationStatus === "VERIFIED";
    if (!isVerifiedNow || !hasRole("ORGANIZER")) return;
    if (sessionStorage.getItem(VERIFIED_CELEBRATION_KEY)) return;
    setShowVerifiedCelebration(true);
    const t = setTimeout(() => {
      setShowVerifiedCelebration(false);
      sessionStorage.setItem(VERIFIED_CELEBRATION_KEY, "1");
    }, 3000);
    return () => clearTimeout(t);
  }, [user?.isVerified, user?.verificationStatus, hasRole]);

  const getInitials = () => {
    if (user?.firstName && user?.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user?.email?.[0]?.toUpperCase() || "U";
  };

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const verificationStatus = user?.verificationStatus ?? "NOT_STARTED";
  const isVerified = Boolean(user?.isVerified) || verificationStatus === "VERIFIED";
  const verificationInProgress = verificationStatus === "PENDING" || verificationStatus === "IN_PROGRESS";
  const isEnterprise = user?.subscriptionTier === "ENTERPRISE";
  const isPro = user?.subscriptionTier === "PRO";
  const specialtyLabel = user?.culturalNiche
    ? `Focus: ${user.culturalNiche}`
    : hasRole("ORGANIZER")
      ? "Focus: Cultural & Community Events"
      : null;
  const riskFlagged = summary?.riskFlagged ?? false;
  const riskLevel = user?.riskLevel ?? summary?.riskLevel ?? "LOW";
  const isHighRisk = riskLevel === "HIGH";
  const payoutBalance = summary?.availableBalance ?? 0;
  const platformFeesWithheld = summary ? Number(summary.platformFeesWithheld ?? 0) : 0;

  const handleRecalculateRisk = useCallback(() => {
    if (!hasRole("ORGANIZER")) return;
    setRiskRefreshing(true);
    apiService
      .recalculateRiskScore()
      .then(() => {
        refreshUser();
        fetchSummary();
      })
      .finally(() => setRiskRefreshing(false));
  }, [hasRole, refreshUser, fetchSummary]);

  return (
    <div className="min-h-screen py-8 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -right-40 w-[28rem] h-[28rem] rounded-full bg-primary/6 blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-primary-glow/5 blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-72 h-72 rounded-full bg-accent/5 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.02] via-transparent to-transparent" />
      </div>

      <div className="container relative mx-auto px-4 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
        >
          {/* Hero tile: avatar, name, badges */}
          <Card
            className={`md:col-span-3 rounded-2xl border-0 overflow-hidden bg-gradient-to-br from-primary/15 via-primary-glow/10 to-accent/10 transition-all duration-500 ${
              showVerifiedCelebration ? "ring-4 ring-emerald-400/60 shadow-[0_0_40px_hsl(142_70%_45%_/_0.4)] animate-[pulse_1.5s_ease-in-out_2]" : ""
            }`}
          >
            <CardContent className="p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
              <div className="relative shrink-0">
                <Avatar className="h-28 w-28 ring-4 ring-primary/40 ring-offset-4 ring-offset-background shadow-lg shadow-[0_0_24px_hsl(var(--primary)_/_0.35)]">
                  <AvatarImage src={user?.profilePictureUrl} alt={displayName} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-primary-glow text-primary-foreground text-3xl">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h1 className="text-3xl sm:text-4xl font-extrabold font-heading tracking-tight text-foreground">
                  {displayName}
                </h1>
                {specialtyLabel && (
                  <p className="text-sm text-muted-foreground mt-1">{specialtyLabel}</p>
                )}
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mt-3">
                  <Badge className="bg-primary/90 text-primary-foreground border-0 shadow-[0_0_14px_hsl(var(--primary)_/_0.5)]">
                    {user?.role ?? "USER"}
                  </Badge>
                  {hasRole("ORGANIZER") ? (
                    isVerified ? (
                      <Badge className="bg-emerald-500/90 text-white border-0 shadow-[0_0_12px_hsl(142_70%_45%_/_0.5)] inline-flex items-center gap-1">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Verified
                      </Badge>
                    ) : verificationInProgress ? (
                      <Badge className="bg-amber-500/90 text-white border-0 shadow-[0_0_12px_hsl(38_92%_50%_/_0.5)] inline-flex items-center gap-1 animate-pulse ring-2 ring-amber-400/30 ring-offset-2 ring-offset-background">
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Verification in Progress
                      </Badge>
                    ) : verificationStatus === "REJECTED" ? (
                      <Badge className="bg-red-500/90 text-white border-0 shadow-[0_0_12px_hsl(0_84%_50%_/_0.5)] inline-flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Verification declined
                      </Badge>
                    ) : (
                      <Badge className="bg-amber-500/80 text-white border-0 shadow-[0_0_12px_hsl(38_92%_50%_/_0.5)] inline-flex items-center gap-1">
                        <ShieldAlert className="h-3.5 w-3.5" />
                        Pending Verification
                      </Badge>
                    )
                  ) : (
                    <Badge className="bg-emerald-400 text-white border-0 shadow-[0_0_12px_hsl(142_70%_45%_/_0.5)]">
                      {user?.status ?? "ACTIVE"}
                    </Badge>
                  )}
                </div>
                <Button
                  className="mt-4 bg-gradient-to-r from-primary to-primary-glow text-primary-foreground border-0 shadow-md hover:shadow-glow hover:scale-[1.02] transition-all"
                  onClick={() => navigate("/profile/edit")}
                >
                  <PenLine className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
                {hasRole("ORGANIZER") && !isVerified && !verificationInProgress && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 ml-0 sm:ml-2 border-amber-500/50 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
                    onClick={() => setIdentityModalOpen(true)}
                  >
                    {verificationStatus === "REJECTED" ? "Resubmit verification" : "Complete Identity Check"}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <IdentityCheckModal
            open={identityModalOpen}
            onOpenChange={setIdentityModalOpen}
            onSuccess={() => refreshUser()}
          />

          {/* Rejected state: clear reason + Resubmit (US transparency) */}
          {hasRole("ORGANIZER") && verificationStatus === "REJECTED" && (
            <Card className="md:col-span-3 rounded-xl border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">Verification declined</p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {rejectionReason
                      ? rejectionReason
                      : "We couldn’t verify your information. Common reasons: address doesn’t match ID, or document couldn’t be read. Please resubmit with correct details."}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/50 text-red-700 dark:text-red-300 hover:bg-red-500/10 shrink-0"
                  onClick={() => setIdentityModalOpen(true)}
                >
                  Resubmit verification
                </Button>
              </CardContent>
            </Card>
          )}

          {/* High risk warning */}
          {hasRole("ORGANIZER") && isHighRisk && (
            <Card className="md:col-span-3 rounded-xl border-amber-500/40 bg-amber-500/10">
              <CardContent className="p-4 flex items-center gap-3">
                <ShieldQuestion className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0" />
                <div>
                  <p className="font-medium text-amber-800 dark:text-amber-200">High risk designation</p>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    Your account has additional review requirements. Payouts may be delayed. Contact support for details.
                  </p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Info tiles */}
          <Card className="rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</p>
                <p className="font-medium truncate">{user?.email ?? "—"}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Member since</p>
                <p className="font-medium">
                  {user?.createdAt ? format(new Date(user.createdAt), "MMMM yyyy") : "—"}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <CalendarDays className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Account type</p>
                <p className="font-medium">
                  {user?.subscriptionTier === "ENTERPRISE"
                    ? "Enterprise"
                    : user?.subscriptionTier === "PRO"
                      ? "Pro"
                      : "Individual"}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payout risk + eligibility (organizers only) */}
          {hasRole("ORGANIZER") && (
            <Card className="rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Payout risk</p>
                    <p className="font-medium capitalize">{riskLevel.toLowerCase()}</p>
                    {summary?.payoutEligibility?.label && (
                      <p className="text-sm text-muted-foreground mt-0.5">{summary.payoutEligibility.label}</p>
                    )}
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculateRisk}
                  disabled={riskRefreshing}
                >
                  {riskRefreshing ? "Updating…" : "Refresh"}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Current Tier (Hybrid Pricing Model) */}
          {hasRole("ORGANIZER") && (
            <Card className="rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md md:col-span-2">
              <CardContent className="p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Current tier</p>
                {isPro || isEnterprise ? (
                  <div>
                    <p className="font-semibold text-primary">Access Plus Pro</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Lower fees · Instant payouts · White-label customization
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 text-primary p-0 h-auto font-medium"
                      onClick={() => navigate("/pricing")}
                    >
                      Manage plan <ChevronRight className="h-4 w-4 ml-0.5 inline" />
                    </Button>
                  </div>
                ) : (
                  <div>
                    <p className="font-semibold">Starter</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Standard fees · 3-day payouts
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="mt-2 text-primary border-primary/50 hover:bg-primary/10"
                      onClick={() => navigate("/pricing")}
                    >
                      Upgrade to Pro
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Data Privacy & CCPA */}
          <Card
            className="rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md cursor-pointer hover:ring-2 hover:ring-primary/20 transition-all"
            onClick={() => navigate("/privacy")}
          >
            <CardContent className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Lock className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Your Data & Privacy</p>
                <p className="font-medium text-sm">View data we collect · Request deletion</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
            </CardContent>
          </Card>

          {/* Pro/Enterprise: Team Management card with list + invite */}
          {isProOrEnterprise && (
            <Card className="md:col-span-3 rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <Users className="h-5 w-5 text-primary" />
                  Team Management
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Invite team members by email (they must have an account). They can manage your events based on their role.
                </p>
                <div className="flex flex-wrap gap-2 mb-4">
                  <Input
                    type="email"
                    placeholder="teammate@example.com"
                    className="max-w-xs"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleInviteTeamMember()}
                  />
                  <select
                    className="rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={inviteRole}
                    onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "EDITOR" | "VIEWER")}
                  >
                    <option value="VIEWER">Viewer</option>
                    <option value="EDITOR">Editor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                  <Button
                    type="button"
                    onClick={handleInviteTeamMember}
                    disabled={inviteSubmitting || !inviteEmail.trim()}
                  >
                    {inviteSubmitting ? "Adding…" : "Add member"}
                  </Button>
                </div>
                {teamLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading team…
                  </div>
                ) : teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No team members yet. Add one above.</p>
                ) : (
                  <ul className="space-y-2">
                    {teamMembers.map((m) => (
                      <li
                        key={m.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div>
                          <span className="font-medium">
                            {[m.firstName, m.lastName].filter(Boolean).join(" ") || m.email || "—"}
                          </span>
                          {m.email && <span className="text-muted-foreground text-sm ml-2">{m.email}</span>}
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {m.role}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <select
                            className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                            value={m.role}
                            onChange={(e) => handleUpdateTeamMemberRole(m.userId, e.target.value as "ADMIN" | "EDITOR" | "VIEWER")}
                          >
                            <option value="VIEWER">Viewer</option>
                            <option value="EDITOR">Editor</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveTeamMember(m.userId)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Enterprise only: White-Label (per pricing page) */}
          {isEnterprise && (
            <Card className="md:col-span-3 rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <Palette className="h-5 w-5 text-primary" />
                  White-Label Branding
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Custom logo and colors appear on your event pages. Optionally hide &quot;Powered by Access Plus&quot;.
                </p>
                <div className="space-y-4 max-w-md">
                  <div>
                    <Label htmlFor="branding-logo">Logo URL</Label>
                    <Input
                      id="branding-logo"
                      type="url"
                      placeholder="https://example.com/logo.png"
                      value={brandingLogoUrl}
                      onChange={(e) => setBrandingLogoUrl(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="branding-color">Primary color (hex)</Label>
                    <div className="flex gap-2 mt-1">
                      <input
                        id="branding-color"
                        type="color"
                        value={brandingPrimaryColor.startsWith("#") ? brandingPrimaryColor : "#6366f1"}
                        onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                        className="h-10 w-14 rounded border cursor-pointer"
                      />
                      <Input
                        placeholder="#6366f1"
                        value={brandingPrimaryColor}
                        onChange={(e) => setBrandingPrimaryColor(e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      id="branding-hide"
                      type="checkbox"
                      checked={brandingHidePlatform}
                      onChange={(e) => setBrandingHidePlatform(e.target.checked)}
                      className="rounded border-input"
                    />
                    <Label htmlFor="branding-hide" className="cursor-pointer">Hide &quot;Powered by Access Plus&quot; on my event pages</Label>
                  </div>
                  <Button type="button" onClick={handleSaveBranding} disabled={brandingSaving}>
                    {brandingSaving ? "Saving…" : "Save branding"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* API keys (Enterprise only) */}
          {isEnterprise && (
            <Card className="md:col-span-3 rounded-xl border-0 bg-white/70 dark:bg-white/10 backdrop-blur-[10px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold flex items-center gap-2 mb-1">
                  <Key className="h-5 w-5 text-primary" />
                  API keys
                </h2>
                <p className="text-sm text-muted-foreground mb-4">
                  Use API keys for programmatic access. Send the key in the <code className="rounded bg-muted px-1 text-xs">X-Api-Key</code> header.
                </p>

                {newKeyResult && (
                  <div className="mb-6 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-200 mb-2">Your new API key (copy now — it won&apos;t be shown again)</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <code className="flex-1 min-w-0 break-all rounded bg-muted px-2 py-1.5 text-sm font-mono">
                        {newKeyResult.key}
                      </code>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopyKey(newKeyResult.key)}
                      >
                        <Copy className="h-4 w-4 mr-1" />
                        Copy
                      </Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => setNewKeyResult(null)}>
                        Dismiss
                      </Button>
                    </div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 mb-4">
                  <Label htmlFor="api-key-name" className="sr-only">Key name</Label>
                  <Input
                    id="api-key-name"
                    placeholder="e.g. Production API"
                    className="max-w-xs"
                    value={createKeyName}
                    onChange={(e) => setCreateKeyName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleCreateApiKey()}
                  />
                  <Button
                    type="button"
                    onClick={handleCreateApiKey}
                    disabled={createKeySubmitting || !createKeyName.trim()}
                  >
                    {createKeySubmitting ? "Creating…" : "Create API key"}
                  </Button>
                </div>

                {apiKeysLoading ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading keys…
                  </div>
                ) : apiKeys.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No API keys yet. Create one above.</p>
                ) : (
                  <ul className="space-y-2">
                    {apiKeys.map((k) => (
                      <li
                        key={k.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-lg border bg-muted/30 px-3 py-2"
                      >
                        <div>
                          <span className="font-medium">{k.name}</span>
                          <span className="text-muted-foreground text-sm ml-2 font-mono">{k.keyPrefix}…</span>
                          <span className="text-muted-foreground text-xs ml-2">
                            {k.createdAt ? format(new Date(k.createdAt), "MMM d, yyyy") : ""}
                          </span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleRevokeApiKey(k.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Revoke
                        </Button>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          )}

          {/* Your Impact - Organizer only */}
          {hasRole("ORGANIZER") && (
            <Card className="md:col-span-3 rounded-2xl border-0 bg-white/60 dark:bg-white/5 backdrop-blur-[10px] shadow-md">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-2 h-8 rounded-full bg-gradient-to-b from-primary to-primary-glow" />
                  Your Impact
                </h2>
                {/* Payout balance (after platform fees) */}
                {!summaryLoading && (
                  <div className="mb-4 rounded-xl bg-white/80 dark:bg-white/10 px-4 py-3 border border-primary/10 flex items-center justify-between">
                    <div>
                      <span className="text-sm font-medium text-muted-foreground">
                        Available for payout{platformFeesWithheld > 0 ? " (after platform fees)" : ""}
                      </span>
                      {platformFeesWithheld > 0 && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Platform fees withheld: ${platformFeesWithheld.toFixed(2)}
                        </p>
                      )}
                    </div>
                    <span className="text-xl font-bold text-foreground">
                      ${typeof payoutBalance === "number" ? payoutBalance.toFixed(2) : "0.00"}
                    </span>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="rounded-xl bg-white/80 dark:bg-white/10 p-4 border border-primary/10">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Events Hosted</span>
                    </div>
                    {summaryLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {summary?.eventsHosted ?? 0}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white/80 dark:bg-white/10 p-4 border border-primary/10">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Ticket className="h-4 w-4 text-primary" />
                      <span className="text-sm font-medium">Tickets Sold</span>
                      {summary?.ticketsSoldTrendPercent != null && summary.ticketsSoldTrendPercent > 0 && (
                        <span className="inline-flex items-center gap-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                          <TrendingUp className="h-3.5 w-3.5" />
                          +{summary.ticketsSoldTrendPercent}% this week
                        </span>
                      )}
                    </div>
                    {summaryLoading ? (
                      <Skeleton className="h-8 w-16 mt-1" />
                    ) : (
                      <p className="text-2xl font-bold text-foreground">
                        {summary?.ticketsSold ?? 0}
                      </p>
                    )}
                  </div>
                  <div className="rounded-xl bg-white/80 dark:bg-white/10 p-4 border border-primary/10">
                    <div className="flex items-center gap-2 text-muted-foreground mb-1">
                      <Star className="h-4 w-4 text-amber-500" />
                      <span className="text-sm font-medium">Rating</span>
                    </div>
                    <p className="text-2xl font-bold text-foreground">4.9</p>
                  </div>
                </div>
                {/* Financial: balance placeholder + CTAs */}
                {summaryLoading ? (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Skeleton className="h-9 w-40" />
                    <Skeleton className="h-9 w-36" />
                  </div>
                ) : (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-primary border-primary/50 hover:bg-primary/10"
                      onClick={() => navigate("/organizer")}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      View Detailed Analytics
                    </Button>
                    {riskFlagged ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="border-amber-500/50 text-amber-700 dark:text-amber-400"
                        onClick={() => navigate("/organizer")}
                      >
                        <AlertCircle className="h-4 w-4 mr-2" />
                        Review Required
                      </Button>
                    ) : !isVerified ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        className="text-muted-foreground border-muted cursor-not-allowed"
                        onClick={() => {}}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Manage Payouts (verify first)
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-primary border-primary/50 hover:bg-primary/10"
                        onClick={() => navigate("/organizer")}
                      >
                        <Wallet className="h-4 w-4 mr-2" />
                        Manage Payouts
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Profile;
