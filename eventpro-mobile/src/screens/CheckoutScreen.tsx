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
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { CartResponse, CartItemResponse, CheckoutTotals } from "@eventpro/shared";
import { theme } from "../theme";

export function CheckoutScreen({
  route,
  navigation,
}: {
  route: { params?: { eventId?: string } };
  navigation: any;
}) {
  const { api } = useAuth();
  const [cart, setCart] = useState<CartResponse | null>(null);
  const [totals, setTotals] = useState<CheckoutTotals | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [paying, setPaying] = useState(false);

  const loadCart = async () => {
    try {
      const data = await api.getCart();
      setCart(data);
      const total = data?.totalCost ?? 0;
      if (total > 0) {
        const t = await api.getCheckoutTotals(total).catch(() => null);
        setTotals(t ?? null);
      } else {
        setTotals(null);
      }
    } catch {
      setCart(null);
      setTotals(null);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadCart();
  };

  const removeItem = async (ticketId: string) => {
    try {
      await api.removeFromCart(ticketId);
      await loadCart();
    } catch (e) {
      console.error(e);
    }
  };

  const handlePay = async () => {
    const total = totals?.total ?? cart?.totalCost ?? 0;
    if (total <= 0) return;
    setPaying(true);
    try {
      const { clientSecret } = await api.createPaymentIntent(total);
      setPaying(false);
      Alert.alert(
        "Complete payment",
        "In-app card entry is coming soon. For now, complete your purchase on the EventPro website, or use the same account on web to pay for the items in your cart.",
        [{ text: "OK" }]
      );
    } catch (e) {
      setPaying(false);
      Alert.alert("Payment error", "Could not start payment. Try again.");
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  const tickets: CartItemResponse[] = cart?.tickets ?? [];
  const isEmpty = tickets.length === 0;
  const totalAmount = totals?.total ?? cart?.totalCost ?? 0;

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
            {tickets.map((item) => (
              <View key={item.id} style={styles.row}>
                <View style={styles.rowLeft}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemMeta}>
                    {item.ticketType} · {item.quantity} × ${Number(item.price).toFixed(2)}
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
            {totals ? (
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
            ) : (
              <View style={styles.totals}>
                <View style={[styles.totalRow, styles.totalRowLast]}>
                  <Text style={styles.totalLabelBold}>Total</Text>
                  <Text style={styles.totalValueBold}>${totalAmount.toFixed(2)}</Text>
                </View>
              </View>
            )}
            <TouchableOpacity
              style={[styles.button, paying && styles.buttonDisabled]}
              onPress={handlePay}
              disabled={paying}
            >
              <Text style={styles.buttonText}>
                {paying ? "Preparing…" : "Pay now"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
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
});
