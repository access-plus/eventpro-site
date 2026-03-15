import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Image,
  Alert,
} from "react-native";
import Constants from "expo-constants";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import type { OrganizerSummary } from "@eventpro/shared";
import { useTheme } from "../contexts/ThemeContext";
import { lightTheme } from "../theme";
import { uploadProfilePicture as uploadProfilePictureMobile } from "../lib/mobileApi";

const WEB_URL = Constants.expoConfig?.extra?.webUrl ?? process.env.EXPO_PUBLIC_WEB_URL ?? "http://localhost:5173";

function formatMemberSince(createdAt: string | undefined): string {
  if (!createdAt) return "—";
  const d = new Date(createdAt);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

function accountTypeLabel(tier: string | undefined): string {
  if (tier === "ENTERPRISE") return "Enterprise";
  if (tier === "PRO") return "Pro";
  return "Individual";
}

export function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, api, logout, hasRole, refreshUser } = useAuth();
  const { theme } = useTheme();
  const [summary, setSummary] = useState<OrganizerSummary | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isOrganizer = hasRole("ORGANIZER");
  const verificationStatus = user?.verificationStatus ?? "NOT_STARTED";
  const isVerified = Boolean(user?.isVerified) || verificationStatus === "VERIFIED";
  const verificationInProgress = verificationStatus === "PENDING" || verificationStatus === "IN_PROGRESS";
  const isPro = user?.subscriptionTier === "PRO";
  const isEnterprise = user?.subscriptionTier === "ENTERPRISE";
  const isProOrEnterprise = isPro || isEnterprise;
  const riskLevel = user?.riskLevel ?? summary?.riskLevel ?? "LOW";
  const isHighRisk = riskLevel === "HIGH";
  const payoutBalance = summary ? Number(summary.availableBalance) || 0 : 0;
  const platformFeesWithheld = summary ? Number(summary.platformFeesWithheld ?? 0) : 0;
  const riskFlagged = summary?.riskFlagged ?? false;

  const fetchSummary = useCallback(() => {
    if (!isOrganizer) {
      setSummaryLoading(false);
      return;
    }
    setSummaryLoading(true);
    api
      .getOrganizerSummary()
      .then(setSummary)
      .catch(() => setSummary(null))
      .finally(() => setSummaryLoading(false));
  }, [api, isOrganizer]);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  useEffect(() => {
    if (!isOrganizer || verificationStatus !== "REJECTED") {
      setRejectionReason(null);
      return;
    }
    api.getVerificationStatus().then((res) => setRejectionReason(res.lastRejectionReason ?? null)).catch(() => setRejectionReason(null));
  }, [api, isOrganizer, verificationStatus]);

  const openWeb = (path: string) => {
    Linking.openURL(`${WEB_URL}${path}`).catch(() => {});
  };

  const goToOrganizer = () => {
    navigation.getParent()?.navigate("Organizer");
  };

  const getInitials = () => {
    if (user?.firstName && user?.lastName) return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    return user?.email?.[0]?.toUpperCase() ?? "U";
  };

  const handleChangePhoto = useCallback(async () => {
    if (uploadingPhoto) return;
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow access to your photos to set a profile picture.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets?.[0]?.uri) return;
    setUploadingPhoto(true);
    try {
      const asset = result.assets[0];
      await uploadProfilePictureMobile({
        uri: asset.uri,
        type: asset.mimeType ?? "image/jpeg",
        name: asset.fileName ?? "profile.jpg",
      });
      await refreshUser();
    } catch (e) {
      Alert.alert("Upload failed", "Could not update profile picture. Try again.");
    } finally {
      setUploadingPhoto(false);
    }
  }, [refreshUser, uploadingPhoto]);

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(" ") || "User";
  const specialtyLabel = user?.culturalNiche
    ? `Focus: ${user.culturalNiche}`
    : isOrganizer
      ? "Focus: Cultural & Community Events"
      : null;

  // Guest view: same as web – browse first, sign in only when needed
  if (!user) {
    return (
      <View style={[styles.guestContainer, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.guestCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.guestIconWrap, { backgroundColor: theme.colors.primary + "20" }]}>
            <Ionicons name="person-outline" size={48} color={theme.colors.primary} />
          </View>
          <Text style={[styles.guestTitle, { color: theme.colors.foreground }]}>Welcome to EventPro</Text>
          <Text style={[styles.guestSubtitle, { color: theme.colors.mutedForeground }]}>
            Sign in to get tickets, follow organizers, and manage your orders.
          </Text>
          <TouchableOpacity
            style={[styles.guestButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => (navigation as any).getParent()?.getParent()?.navigate("Auth", { screen: "Login" })}
          >
            <Text style={[styles.guestButtonText, { color: theme.colors.primaryForeground }]}>Sign in</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.guestButtonOutline, { borderColor: theme.colors.primary }]}
            onPress={() => (navigation as any).getParent()?.getParent()?.navigate("Auth", { screen: "SignUp" })}
          >
            <Text style={[styles.guestButtonOutlineText, { color: theme.colors.primary }]}>Create account</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Hero card */}
      <View style={[styles.heroCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.heroRow}>
          <TouchableOpacity
            onPress={handleChangePhoto}
            disabled={uploadingPhoto}
            style={[styles.avatarWrap, { backgroundColor: theme.colors.primary + "30" }]}
            activeOpacity={0.8}
          >
            {user?.profilePictureUrl ? (
              <Image key={user.profilePictureUrl} source={{ uri: user.profilePictureUrl }} style={styles.avatarImage} />
            ) : (
              <Text style={[styles.avatarText, { color: theme.colors.primary }]}>{getInitials()}</Text>
            )}
            {uploadingPhoto ? (
              <View style={styles.avatarOverlay}>
                <ActivityIndicator size="small" color="#fff" />
              </View>
            ) : (
              <View style={styles.avatarBadge}>
                <Ionicons name="camera" size={16} color={theme.colors.primaryForeground} />
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.heroMain}>
            <Text style={[styles.heroName, { color: theme.colors.foreground }]}>{displayName}</Text>
            {specialtyLabel ? (
              <Text style={[styles.specialty, { color: theme.colors.mutedForeground }]}>{specialtyLabel}</Text>
            ) : null}
            <View style={styles.badges}>
              <View style={[styles.badge, { backgroundColor: theme.colors.primary }]}>
                <Text style={[styles.badgeText, { color: theme.colors.primaryForeground }]}>{user?.role ?? "USER"}</Text>
              </View>
              {isOrganizer &&
                (isVerified ? (
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Ionicons name="shield-checkmark" size={14} color="#fff" />
                    <Text style={[styles.badgeText, { color: "#fff" }]}>Verified</Text>
                  </View>
                ) : verificationInProgress ? (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <ActivityIndicator size="small" color="#fff" />
                    <Text style={[styles.badgeText, { color: "#fff" }]}>In progress</Text>
                  </View>
                ) : verificationStatus === "REJECTED" ? (
                  <View style={[styles.badge, styles.badgeDanger]}>
                    <Ionicons name="shield-alert" size={14} color="#fff" />
                    <Text style={[styles.badgeText, { color: "#fff" }]}>Declined</Text>
                  </View>
                ) : (
                  <View style={[styles.badge, styles.badgeWarning]}>
                    <Ionicons name="shield-outline" size={14} color="#fff" />
                    <Text style={[styles.badgeText, { color: "#fff" }]}>Pending verification</Text>
                  </View>
                ))}
            </View>
            <View style={styles.heroActions}>
              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }]}
                onPress={() => navigation.navigate("ProfileEdit")}
              >
                <Ionicons name="pencil" size={18} color={theme.colors.primaryForeground} />
                <Text style={[styles.primaryBtnText, { color: theme.colors.primaryForeground }]}>Edit profile</Text>
              </TouchableOpacity>
              {isOrganizer && !isVerified && !verificationInProgress && (
                <TouchableOpacity
                  style={[styles.outlineBtn, { borderColor: theme.colors.warning }]}
                  onPress={() => openWeb("/profile")}
                >
                  <Text style={[styles.outlineBtnText, { color: theme.colors.warning }]}>
                    {verificationStatus === "REJECTED" ? "Resubmit verification" : "Complete Identity Check"}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* Rejection card */}
      {isOrganizer && verificationStatus === "REJECTED" && (
        <View style={[styles.alertCard, styles.alertDanger]}>
          <Text style={styles.alertTitle}>Verification declined</Text>
          <Text style={styles.alertDesc}>
            {(user?.rejectionReason ?? rejectionReason) || "We couldn’t verify your information. Please resubmit with correct details on the web."}
          </Text>
          <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.destructive }]} onPress={() => openWeb("/profile")}>
            <Text style={[styles.outlineBtnText, { color: theme.colors.destructive }]}>Resubmit on web</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* High risk */}
      {isOrganizer && isHighRisk && (
        <View style={[styles.alertCard, styles.alertWarning]}>
          <Ionicons name="warning" size={22} color={theme.colors.warning} />
          <View style={styles.alertText}>
            <Text style={styles.alertTitle}>High risk designation</Text>
            <Text style={styles.alertDesc}>Payouts may be delayed. Contact support for details.</Text>
          </View>
        </View>
      )}

      {/* Info tiles */}
      <View style={styles.tiles}>
        <View style={[styles.tile, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.tileIcon, { backgroundColor: theme.colors.primary + "20" }]}>
            <Ionicons name="mail" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.tileContent}>
            <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>Email</Text>
            <Text style={[styles.tileValue, { color: theme.colors.foreground }]} numberOfLines={1}>{user?.email ?? "—"}</Text>
          </View>
        </View>
        <View style={[styles.tile, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.tileIcon, { backgroundColor: theme.colors.primary + "20" }]}>
            <Ionicons name="calendar" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.tileContent}>
            <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>Member since</Text>
            <Text style={[styles.tileValue, { color: theme.colors.foreground }]}>{formatMemberSince(user?.createdAt)}</Text>
          </View>
        </View>
        <View style={[styles.tile, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={[styles.tileIcon, { backgroundColor: theme.colors.primary + "20" }]}>
            <Ionicons name="person" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.tileContent}>
            <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>Account type</Text>
            <Text style={[styles.tileValue, { color: theme.colors.foreground }]}>{accountTypeLabel(user?.subscriptionTier)}</Text>
          </View>
        </View>
      </View>

      {/* Payout risk (organizer) */}
      {isOrganizer && (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.cardRow}>
            <View style={[styles.tileIcon, { backgroundColor: theme.colors.primary + "20" }]}>
              <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
            </View>
            <View style={styles.tileContent}>
              <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>Payout risk</Text>
              <Text style={[styles.tileValue, { color: theme.colors.foreground }]}>{riskLevel.charAt(0) + riskLevel.slice(1).toLowerCase()}</Text>
              {summary?.payoutEligibility?.label ? (
                <Text style={[styles.tileHint, { color: theme.colors.mutedForeground }]}>{summary.payoutEligibility.label}</Text>
              ) : null}
            </View>
            <TouchableOpacity style={[styles.outlineBtnSmall, { borderColor: theme.colors.border }]} onPress={() => openWeb("/profile")}>
              <Text style={[styles.outlineBtnText, { color: theme.colors.foreground }]}>Refresh (web)</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Current tier (organizer) */}
      {isOrganizer && (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>Current tier</Text>
          {isProOrEnterprise ? (
            <>
              <Text style={[styles.tierName, { color: theme.colors.primary }]}>Access Plus Pro</Text>
              <Text style={[styles.tierDesc, { color: theme.colors.mutedForeground }]}>Lower fees · Instant payouts · White-label</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Pricing")}>
                <Text style={[styles.linkPrimary, { color: theme.colors.primary }]}>Manage plan →</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={[styles.tierName, { color: theme.colors.foreground }]}>Starter</Text>
              <Text style={[styles.tierDesc, { color: theme.colors.mutedForeground }]}>Standard fees · 3-day payouts</Text>
              <TouchableOpacity style={[styles.primaryBtnSmall, { backgroundColor: theme.colors.primary }]} onPress={() => navigation.navigate("Pricing")}>
                <Text style={[styles.primaryBtnText, { color: theme.colors.primaryForeground }]}>Upgrade to Pro</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Data & Privacy */}
      <TouchableOpacity style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]} onPress={() => openWeb("/privacy")}>
        <View style={styles.cardRow}>
          <View style={[styles.tileIcon, { backgroundColor: theme.colors.primary + "20" }]}>
            <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
          </View>
          <View style={styles.tileContent}>
            <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>Your Data & Privacy</Text>
            <Text style={[styles.tileValue, { color: theme.colors.foreground }]}>View data we collect · Request deletion</Text>
          </View>
          <Ionicons name="open-outline" size={20} color={theme.colors.mutedForeground} />
        </View>
      </TouchableOpacity>

      {/* Team Management (Pro/Enterprise) */}
      {isProOrEnterprise && (
        <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
          <View style={styles.sectionHeader}>
            <Ionicons name="people" size={22} color={theme.colors.primary} />
            <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Team Management</Text>
          </View>
          <Text style={[styles.sectionDesc, { color: theme.colors.mutedForeground }]}>Invite team members and manage roles on the web app.</Text>
          <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.border }]} onPress={() => openWeb("/profile")}>
            <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>Manage on web</Text>
            <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
          </TouchableOpacity>
        </View>
      )}

      {/* Enterprise: White-Label & API keys */}
      {isEnterprise && (
        <>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="color-palette" size={22} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>White-Label Branding</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: theme.colors.mutedForeground }]}>Custom logo and colors on your event pages.</Text>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.border }]} onPress={() => openWeb("/profile")}>
              <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>Manage on web</Text>
              <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
          <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="key" size={22} color={theme.colors.primary} />
              <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>API keys</Text>
            </View>
            <Text style={[styles.sectionDesc, { color: theme.colors.mutedForeground }]}>Programmatic access. Create and revoke keys on the web.</Text>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.border }]} onPress={() => openWeb("/profile")}>
              <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>Manage on web</Text>
              <Ionicons name="open-outline" size={18} color={theme.colors.primary} />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Your Impact (organizer) */}
      {isOrganizer && (
        <View style={[styles.card, styles.impactCard, { backgroundColor: theme.colors.card, borderColor: theme.colors.primary + "30" }]}>
          <View style={[styles.impactAccent, { backgroundColor: theme.colors.primary }]} />
          <Text style={[styles.sectionTitle, { color: theme.colors.foreground }]}>Your Impact</Text>
          {!summaryLoading && (
            <View style={[styles.impactBalance, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
              <Text style={[styles.tileLabel, { color: theme.colors.mutedForeground }]}>
                Available for payout{platformFeesWithheld > 0 ? " (after platform fees)" : ""}
              </Text>
              {platformFeesWithheld > 0 && (
                <Text style={[styles.tileHint, { color: theme.colors.mutedForeground }]}>Platform fees withheld: ${platformFeesWithheld.toFixed(2)}</Text>
              )}
              <Text style={[styles.impactBalanceValue, { color: theme.colors.foreground }]}>${payoutBalance.toFixed(2)}</Text>
            </View>
          )}
          <View style={styles.impactStats}>
            <View style={[styles.statBox, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
              <Ionicons name="calendar" size={18} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Events hosted</Text>
              <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{summaryLoading ? "—" : (summary?.eventsHosted ?? 0)}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
              <Ionicons name="ticket" size={18} color={theme.colors.primary} />
              <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Tickets sold</Text>
              <Text style={[styles.statValue, { color: theme.colors.foreground }]}>{summaryLoading ? "—" : (summary?.ticketsSold ?? 0)}</Text>
            </View>
            <View style={[styles.statBox, { backgroundColor: theme.colors.muted, borderColor: theme.colors.border }]}>
              <Ionicons name="star" size={18} color={theme.colors.warning} />
              <Text style={[styles.statLabel, { color: theme.colors.mutedForeground }]}>Rating</Text>
              <Text style={[styles.statValue, { color: theme.colors.foreground }]}>4.9</Text>
            </View>
          </View>
          <View style={styles.impactActions}>
            <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.primary }]} onPress={goToOrganizer}>
              <Ionicons name="bar-chart" size={18} color={theme.colors.primary} />
              <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>View Detailed Analytics</Text>
            </TouchableOpacity>
            {riskFlagged ? (
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.warning }]} disabled>
                <Ionicons name="alert-circle" size={18} color={theme.colors.warning} />
                <Text style={[styles.outlineBtnText, { color: theme.colors.warning }]}>Review Required</Text>
              </TouchableOpacity>
            ) : !isVerified ? (
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.muted }]} disabled>
                <Ionicons name="wallet-outline" size={18} color={theme.colors.mutedForeground} />
                <Text style={[styles.outlineBtnText, { color: theme.colors.mutedForeground }]}>Manage Payouts (verify first)</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[styles.outlineBtn, { borderColor: theme.colors.primary }]} onPress={goToOrganizer}>
                <Ionicons name="wallet-outline" size={18} color={theme.colors.primary} />
                <Text style={[styles.outlineBtnText, { color: theme.colors.primary }]}>Manage Payouts</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      )}

      {/* Menu links */}
      <View style={styles.menu}>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("ProfileEdit")}>
          <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
          <Text style={[styles.linkText, { color: theme.colors.primary }]}>Edit profile</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("Settings")}>
          <Ionicons name="settings-outline" size={22} color={theme.colors.foreground} />
          <Text style={[styles.linkText, { color: theme.colors.foreground }]}>Settings</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("OrderHistory")}>
          <Ionicons name="receipt-outline" size={22} color={theme.colors.foreground} />
          <Text style={[styles.linkText, { color: theme.colors.foreground }]}>Order history</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("Following")}>
          <Ionicons name="heart-outline" size={22} color={theme.colors.foreground} />
          <Text style={[styles.linkText, { color: theme.colors.foreground }]}>Following</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => navigation.navigate("Pricing")}>
          <Ionicons name="pricetag-outline" size={22} color={theme.colors.foreground} />
          <Text style={[styles.linkText, { color: theme.colors.foreground }]}>Pricing</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.linkRow, { borderBottomColor: theme.colors.border }]} onPress={() => logout()}>
          <Ionicons name="log-out-outline" size={22} color={theme.colors.mutedForeground} />
          <Text style={[styles.logoutText, { color: theme.colors.mutedForeground }]}>Sign out</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: lightTheme.spacing.md, paddingBottom: 32 },
  heroCard: {
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    padding: lightTheme.spacing.lg,
    marginBottom: lightTheme.spacing.md,
  },
  heroRow: { flexDirection: "row", alignItems: "flex-start", gap: 16 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", overflow: "hidden" },
  avatarImage: { width: 72, height: 72, borderRadius: 36 },
  avatarText: { fontSize: 24, fontWeight: "700" },
  avatarOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 36,
  },
  avatarBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: lightTheme.colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  heroMain: { flex: 1 },
  heroName: { fontSize: 22, fontWeight: "700", marginBottom: 4 },
  specialty: { fontSize: 14, marginBottom: 8 },
  badges: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  badge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 6, borderRadius: lightTheme.radius.sm },
  badgeText: { fontSize: 12, fontWeight: "600" },
  badgeSuccess: { backgroundColor: lightTheme.colors.success },
  badgeWarning: { backgroundColor: lightTheme.colors.warning },
  badgeDanger: { backgroundColor: lightTheme.colors.destructive },
  heroActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 10, paddingHorizontal: 16, borderRadius: lightTheme.radius.md },
  primaryBtnText: { fontSize: 15, fontWeight: "600" },
  outlineBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: lightTheme.radius.md, borderWidth: 1 },
  outlineBtnText: { fontSize: 14, fontWeight: "600" },
  outlineBtnSmall: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: lightTheme.radius.sm, borderWidth: 1 },
  primaryBtnSmall: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: lightTheme.radius.md, alignSelf: "flex-start" },
  alertCard: { padding: 16, borderRadius: lightTheme.radius.lg, marginBottom: 12 },
  alertTitle: { fontSize: 15, fontWeight: "600", marginBottom: 4 },
  alertDesc: { fontSize: 14, marginBottom: 12 },
  alertText: { flex: 1 },
  alertDanger: { backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca" },
  alertWarning: { flexDirection: "row", gap: 12, backgroundColor: "#fffbeb", borderWidth: 1, borderColor: "#fde68a" },
  tiles: { gap: 10, marginBottom: 12 },
  tile: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: lightTheme.radius.lg, borderWidth: 1, marginBottom: 10 },
  tileIcon: { width: 40, height: 40, borderRadius: lightTheme.radius.md, justifyContent: "center", alignItems: "center", marginRight: 12 },
  tileContent: { flex: 1, minWidth: 0 },
  tileLabel: { fontSize: 11, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  tileValue: { fontSize: 15, fontWeight: "600" },
  tileHint: { fontSize: 12, marginTop: 2 },
  card: { padding: 16, borderRadius: lightTheme.radius.lg, borderWidth: 1, marginBottom: 12 },
  cardRow: { flexDirection: "row", alignItems: "center" },
  tierName: { fontSize: 17, fontWeight: "700", marginBottom: 4 },
  tierDesc: { fontSize: 14, marginBottom: 8 },
  linkPrimary: { fontSize: 14, fontWeight: "600" },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  sectionTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  sectionDesc: { fontSize: 14, marginBottom: 12, color: lightTheme.colors.mutedForeground },
  impactCard: { position: "relative", overflow: "hidden", paddingLeft: 20 },
  impactAccent: { position: "absolute", left: 0, top: 0, bottom: 0, width: 4 },
  impactBalance: { padding: 14, borderRadius: lightTheme.radius.md, borderWidth: 1, marginBottom: 16 },
  impactBalanceValue: { fontSize: 22, fontWeight: "800", marginTop: 4 },
  impactStats: { flexDirection: "row", gap: 10, marginBottom: 16 },
  statBox: { flex: 1, padding: 12, borderRadius: lightTheme.radius.md, borderWidth: 1 },
  statLabel: { fontSize: 11, marginTop: 4 },
  statValue: { fontSize: 18, fontWeight: "700", marginTop: 2 },
  impactActions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  menu: { marginTop: 8 },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    gap: 12,
  },
  linkText: { flex: 1, fontSize: 16 },
  logoutText: { flex: 1, fontSize: 16 },
  guestContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: lightTheme.spacing.lg },
  guestCard: { width: "100%", maxWidth: 360, padding: 28, borderRadius: lightTheme.radius.lg, borderWidth: 1, alignItems: "center" },
  guestIconWrap: { width: 88, height: 88, borderRadius: 44, justifyContent: "center", alignItems: "center", marginBottom: 20 },
  guestTitle: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  guestSubtitle: { fontSize: 15, textAlign: "center", marginBottom: 24, lineHeight: 22 },
  guestButton: { width: "100%", paddingVertical: 14, borderRadius: lightTheme.radius.md, alignItems: "center", marginBottom: 12 },
  guestButtonText: { fontSize: 16, fontWeight: "600" },
  guestButtonOutline: { width: "100%", paddingVertical: 14, borderRadius: lightTheme.radius.md, borderWidth: 2, alignItems: "center" },
  guestButtonOutlineText: { fontSize: 16, fontWeight: "600" },
});
