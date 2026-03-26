import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  Linking,
} from "react-native";
import Constants from "expo-constants";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../contexts/CartContext";
import type { CheckoutTotals } from "@eventpro/shared";
import { useTheme } from "../contexts/ThemeContext";
import type { Theme } from "../theme";
import { editorialCard, sectionLabel, pageTitle } from "../theme/screenStyles";

const WEB_URL = Constants.expoConfig?.extra?.webUrl ?? process.env.EXPO_PUBLIC_WEB_URL ?? "https://eventpro.com";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md, paddingBottom: theme.spacing.xl },
    summaryCardInner: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
    },
    webNoteInner: {
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      backgroundColor: theme.colors.muted,
    },
    webNoteTitle: { fontSize: 14, fontWeight: "700", color: theme.colors.foreground, marginBottom: 6 },
    webNoteBody: { fontSize: 13, lineHeight: 20, color: theme.colors.mutedForeground },
    emptyTitleWrap: { marginBottom: 8, alignItems: "center" },
    emptyDesc: { fontSize: 15, marginBottom: 24, textAlign: "center", color: theme.colors.mutedForeground, lineHeight: 22 },
    sectionLabelSpaced: { marginBottom: 12 },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowLeft: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: "600", color: theme.colors.foreground },
    itemMeta: { fontSize: 14, marginTop: 2, color: theme.colors.mutedForeground },
    removeBtn: { padding: 8 },
    removeText: { fontSize: 14, color: theme.colors.destructive },
    totals: { marginTop: 0, paddingTop: 4 },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    totalRowLast: { marginTop: 8 },
    totalLabel: { fontSize: 15, color: theme.colors.mutedForeground },
    totalValue: { fontSize: 15, color: theme.colors.foreground },
    totalLabelBold: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    totalValueBold: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    button: {
      backgroundColor: theme.colors.primary,
      paddingVertical: 16,
      paddingHorizontal: 20,
      borderRadius: theme.radius.full,
      alignItems: "center",
      marginTop: 8,
      shadowColor: "#5d3fd3",
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.35,
      shadowRadius: 20,
      elevation: 6,
    },
    buttonSecondary: {
      backgroundColor: "transparent",
      paddingVertical: 14,
      paddingHorizontal: 20,
      borderRadius: theme.radius.full,
      alignItems: "center",
      marginTop: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: theme.colors.primaryForeground, fontWeight: "800", fontSize: 16 },
    buttonSecondaryText: { color: theme.colors.foreground, fontWeight: "600", fontSize: 15 },
    guestForm: { marginTop: 16, marginBottom: 16 },
    guestLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: theme.colors.foreground },
    guestInput: { borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radius.md, padding: 14, fontSize: 16, marginBottom: 12, backgroundColor: theme.colors.card, color: theme.colors.foreground },
  });
}

export function CheckoutScreen({
  route,
  navigation,
}: {
  route: { params?: { eventId?: string } };
  navigation: any;
}) {
  const { theme } = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { api, user } = useAuth();
  const { items: cartItems, totalAmount: cartTotal, isLoading, removeItem, refreshCart, clearCart } = useCart();
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [guestInfo, setGuestInfo] = useState<{ firstName: string; lastName: string; email: string } | null>(null);
  const [guestForm, setGuestForm] = useState({ firstName: "", lastName: "", email: "" });

  const isGuest = !user;
  const subtotal = cartTotal;
  const isEmpty = cartItems.length === 0;

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    if (subtotal <= 0) {
      setTotals(null);
      return;
    }
    api.getCheckoutTotals(subtotal).then(setTotals).catch(() => setTotals(null));
  }, [api, subtotal]);

  const onRefresh = () => {
    setRefreshing(true);
    refreshCart().finally(() => setRefreshing(false));
  };

  const canProceedAsGuest = isGuest && guestInfo === null && guestForm.firstName.trim() !== "" && guestForm.lastName.trim() !== "" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestForm.email.trim());

  const handleContinueAsGuest = () => {
    if (!canProceedAsGuest) return;
    setGuestInfo({
      firstName: guestForm.firstName.trim(),
      lastName: guestForm.lastName.trim(),
      email: guestForm.email.trim(),
    });
  };

  /** Card capture uses Stripe on web; mobile opens the same checkout URL (see STITCH_DESIGN_BRIEF §12). */
  const openWebCheckout = () => {
    const base = WEB_URL.replace(/\/$/, "");
    Linking.openURL(`${base}/checkout`).catch(() => {
      Alert.alert("Could not open browser", "Open your site’s checkout in a browser to pay with a card.");
    });
  };

  if (isLoading && cartItems.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const totalAmount = totals?.total ?? subtotal;

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.content}>
        {isEmpty ? (
          <>
            <View style={styles.emptyTitleWrap}>
              <Text style={pageTitle(theme)}>Your cart is empty</Text>
            </View>
            <Text style={styles.emptyDesc}>
              Add tickets from an event to checkout.
            </Text>
            <TouchableOpacity
              style={styles.button}
              onPress={() => navigation.getParent()?.navigate("Discover")}
            >
              <Text style={styles.buttonText}>Browse events</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Text style={[sectionLabel(theme), { marginBottom: theme.spacing.md }]}>Review & pay</Text>
            <View style={[editorialCard(theme), styles.summaryCardInner]}>
              <Text style={[sectionLabel(theme), styles.sectionLabelSpaced]}>Order summary</Text>
              {cartItems.map((item) => (
                <View key={item.id} style={styles.row}>
                  <View style={styles.rowLeft}>
                    <Text style={styles.itemName}>{item.ticketTypeName}</Text>
                    <Text style={styles.itemMeta}>
                      {item.quantity} × ${Number(item.price).toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => removeItem(item.id)}
                    style={styles.removeBtn}
                  >
                    <Text style={styles.removeText}>Remove</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            {isGuest && !guestInfo ? (
              <View style={[styles.guestForm, editorialCard(theme), styles.summaryCardInner]}>
                <Text style={styles.guestLabel}>Continue as guest (no account required)</Text>
                <Text style={[styles.guestLabel, { fontSize: 12, fontWeight: "400", color: theme.colors.mutedForeground }]}>First name</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="First name"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={guestForm.firstName}
                  onChangeText={(t) => setGuestForm((f) => ({ ...f, firstName: t }))}
                />
                <Text style={[styles.guestLabel, { fontSize: 12, fontWeight: "400", color: theme.colors.mutedForeground }]}>Last name</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="Last name"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={guestForm.lastName}
                  onChangeText={(t) => setGuestForm((f) => ({ ...f, lastName: t }))}
                />
                <Text style={[styles.guestLabel, { fontSize: 12, fontWeight: "400", color: theme.colors.mutedForeground }]}>Email *</Text>
                <TextInput
                  style={styles.guestInput}
                  placeholder="you@example.com"
                  placeholderTextColor={theme.colors.mutedForeground}
                  value={guestForm.email}
                  onChangeText={(t) => setGuestForm((f) => ({ ...f, email: t }))}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={[styles.button, !canProceedAsGuest && styles.buttonDisabled]}
                  onPress={handleContinueAsGuest}
                  disabled={!canProceedAsGuest}
                >
                  <Text style={styles.buttonText}>Continue as guest</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {(user || (isGuest && guestInfo)) && totals ? (
              <View style={[styles.totals, editorialCard(theme), styles.summaryCardInner]}>
                <View style={styles.totalRow}>
                  <Text style={styles.totalLabel}>Subtotal</Text>
                  <Text style={styles.totalValue}>${totals.subtotal.toFixed(2)}</Text>
                </View>
                {totals.taxRatePercent != null && totals.taxRatePercent > 0 && (
                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Tax ({totals.taxRatePercent}%)</Text>
                    <Text style={styles.totalValue}>${totals.tax.toFixed(2)}</Text>
                  </View>
                )}
                <View style={[styles.totalRow, styles.totalRowLast]}>
                  <Text style={styles.totalLabelBold}>Total</Text>
                  <Text style={styles.totalValueBold}>${totals.total.toFixed(2)}</Text>
                </View>
              </View>
            ) : (user || (isGuest && guestInfo)) ? (
              <View style={[styles.totals, editorialCard(theme), styles.summaryCardInner]}>
                <View style={[styles.totalRow, styles.totalRowLast]}>
                  <Text style={styles.totalLabelBold}>Total</Text>
                  <Text style={styles.totalValueBold}>${totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            ) : null}
            {(user || (isGuest && guestInfo)) && (
              <>
                <View style={[editorialCard(theme), styles.webNoteInner]}>
                  <Text style={styles.webNoteTitle}>Pay with card</Text>
                  <Text style={styles.webNoteBody}>
                    Secure payment runs in your browser (Stripe). Your cart is on the server—sign in on the web with the same account to see these items, or complete checkout there.
                  </Text>
                </View>
                <TouchableOpacity style={styles.button} onPress={openWebCheckout} activeOpacity={0.9}>
                  <Text style={styles.buttonText}>Open web checkout</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonSecondary}
                  onPress={() => navigation.navigate("EventsList")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonSecondaryText}>Keep browsing events</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
