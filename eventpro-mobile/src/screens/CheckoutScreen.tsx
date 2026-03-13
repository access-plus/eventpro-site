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

const WEB_URL = Constants.expoConfig?.extra?.webUrl ?? process.env.EXPO_PUBLIC_WEB_URL ?? "https://eventpro.com";

function createStyles(theme: Theme) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    centered: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.background },
    content: { padding: theme.spacing.md },
    emptyTitle: { fontSize: 20, fontWeight: "700", marginBottom: 8, textAlign: "center", color: theme.colors.foreground },
    emptyDesc: { fontSize: 15, marginBottom: 24, textAlign: "center", color: theme.colors.mutedForeground },
    sectionTitle: { fontSize: 18, fontWeight: "600", marginBottom: 12, color: theme.colors.foreground },
    row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowLeft: { flex: 1 },
    itemName: { fontSize: 16, fontWeight: "600", color: theme.colors.foreground },
    itemMeta: { fontSize: 14, marginTop: 2, color: theme.colors.mutedForeground },
    removeBtn: { padding: 8 },
    removeText: { fontSize: 14, color: theme.colors.destructive },
    totals: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: theme.colors.border },
    totalRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
    totalRowLast: { marginTop: 8 },
    totalLabel: { fontSize: 15, color: theme.colors.mutedForeground },
    totalValue: { fontSize: 15, color: theme.colors.foreground },
    totalLabelBold: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    totalValueBold: { fontSize: 17, fontWeight: "700", color: theme.colors.foreground },
    button: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: theme.radius.md, alignItems: "center", marginTop: 24 },
    buttonDisabled: { opacity: 0.7 },
    buttonText: { color: theme.colors.primaryForeground, fontWeight: "600" },
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
  const [paying, setPaying] = useState(false);
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

  const handlePay = async () => {
    const amountToCharge = totals?.total ?? subtotal;
    if (amountToCharge <= 0) return;
    const amount = Number(amountToCharge.toFixed(2));
    setPaying(true);
    try {
      if (isGuest && guestInfo) {
        const reservePayload = cartItems.map((i) => ({
          eventId: i.eventId,
          ticketType: i.ticketTypeId,
          quantity: i.quantity,
        }));
        await api.guestReserve(reservePayload);
      }
      const { clientSecret } = await api.createPaymentIntent(amount);
      setPaying(false);
      Alert.alert(
        "Complete payment",
        "In-app card entry is coming soon. Open the EventPro website in your browser to complete payment as a guest, or sign in on web to pay with your account.",
        [
          { text: "OK" },
          ...(WEB_URL ? [{ text: "Open website", onPress: () => Linking.openURL(WEB_URL + "/checkout") }] : []),
        ]
      );
    } catch (e) {
      setPaying(false);
      Alert.alert("Payment error", (e as Error)?.message ?? "Could not start payment. Try again.");
    }
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
            <Text style={styles.emptyTitle}>Your cart is empty</Text>
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
            <Text style={styles.sectionTitle}>Order summary</Text>
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
            {isGuest && !guestInfo ? (
              <View style={styles.guestForm}>
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
              <View style={styles.totals}>
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
              <View style={styles.totals}>
                <View style={[styles.totalRow, styles.totalRowLast]}>
                  <Text style={styles.totalLabelBold}>Total</Text>
                  <Text style={styles.totalValueBold}>${totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            ) : null}
            {(user || (isGuest && guestInfo)) && (
              <TouchableOpacity
                style={[styles.button, paying && styles.buttonDisabled]}
                onPress={handlePay}
                disabled={paying}
              >
                <Text style={styles.buttonText}>
                  {paying ? "Preparing…" : "Pay now"}
                </Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    </ScrollView>
  );
}
