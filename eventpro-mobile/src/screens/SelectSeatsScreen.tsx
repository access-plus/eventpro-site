import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Animated,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../contexts/ThemeContext";
import type { Theme } from "../theme";
import { ReservationWarningModal } from "../components/ReservationWarningModal";
import type { SelectSeatsRouteParams } from "../navigation/types";

const BG = "#F9F5FF";
const PURPLE = "#6347D1";
const PURPLE_DEEP = "#4c1d95";
const TEXT_DARK = "#1D162E";

type SeatDef = {
  id: string;
  row: string;
  num: number;
  tier: "vip" | "standard" | "soldout";
};

const SEATS: SeatDef[] = [
  { id: "A1", row: "A", num: 1, tier: "standard" },
  { id: "A2", row: "A", num: 2, tier: "standard" },
  { id: "A3", row: "A", num: 3, tier: "vip" },
  { id: "A4", row: "A", num: 4, tier: "vip" },
  { id: "B1", row: "B", num: 1, tier: "standard" },
  { id: "B2", row: "B", num: 2, tier: "standard" },
  { id: "B3", row: "B", num: 3, tier: "standard" },
  { id: "B4", row: "B", num: 4, tier: "standard" },
  { id: "C1", row: "C", num: 1, tier: "standard" },
  { id: "C2", row: "C", num: 2, tier: "standard" },
  { id: "C3", row: "C", num: 3, tier: "soldout" },
  { id: "C4", row: "C", num: 4, tier: "soldout" },
];

function priceForSeat(s: SeatDef): number {
  if (s.tier === "vip") return 89;
  if (s.tier === "standard") return 49;
  return 0;
}

function formatTime(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export function SelectSeatsScreen({
  route,
  navigation,
}: {
  route: { params?: SelectSeatsRouteParams };
  navigation: { goBack: () => void; navigate: (name: string, params?: object) => void };
}) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const insets = useSafeAreaInsets();
  const p = route.params;
  const eventId = p?.eventId ?? "";
  const eventName = p?.eventName ?? "Neon Echoes Festival";
  const imageUrl = p?.imageUrl;
  const startTime = p?.startTime;

  const [secondsLeft, setSecondsLeft] = useState(15 * 60);
  const [selected, setSelected] = useState<Set<string>>(() => new Set(["A3", "A4"]));
  const [warnOpen, setWarnOpen] = useState(false);
  const [extendToast, setExtendToast] = useState(false);
  const warnShownRef = useRef(false);
  const toastOpacity = useRef(new Animated.Value(0)).current;

  const dateLine = useMemo(() => {
    if (!startTime) return "June 15, 2024 · 19:00";
    const d = new Date(startTime);
    if (Number.isNaN(d.getTime())) return "June 15, 2024 · 19:00";
    return `${d.toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" })} · ${d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}`;
  }, [startTime]);

  useEffect(() => {
    if (!eventId) navigation.goBack();
  }, [eventId, navigation]);

  useEffect(() => {
    if (!eventId) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(t);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [eventId]);

  useEffect(() => {
    if (!eventId) return;
    if (secondsLeft === 0) navigation.goBack();
  }, [secondsLeft, navigation, eventId]);

  useEffect(() => {
    if (!eventId) return;
    if (secondsLeft > 0 && secondsLeft <= 120 && !warnShownRef.current) {
      warnShownRef.current = true;
      setWarnOpen(true);
    }
  }, [secondsLeft, eventId]);

  const showExtendToast = useCallback(() => {
    setExtendToast(true);
    Animated.sequence([
      Animated.timing(toastOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.delay(4500),
      Animated.timing(toastOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]).start(() => setExtendToast(false));
  }, [toastOpacity]);

  const toggleSeat = (seat: SeatDef) => {
    if (seat.tier === "soldout") return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(seat.id)) next.delete(seat.id);
      else next.add(seat.id);
      return next;
    });
  };

  const selectRow = (row: string) => {
    const inRow = SEATS.filter((s) => s.row === row && s.tier !== "soldout");
    const allSelected = inRow.every((s) => selected.has(s.id));
    setSelected((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        inRow.forEach((s) => next.delete(s.id));
      } else {
        inRow.forEach((s) => next.add(s.id));
      }
      return next;
    });
  };

  const clearAll = () => setSelected(new Set());

  const selectedList = useMemo(() => {
    return SEATS.filter((s) => selected.has(s.id)).sort((a, b) => a.id.localeCompare(b.id));
  }, [selected]);

  const subtotal = useMemo(() => selectedList.reduce((sum, s) => sum + priceForSeat(s), 0), [selectedList]);
  const fees = Math.round(subtotal * 0.1204 * 100) / 100;
  const total = subtotal + fees;

  const handleKeepReservation = () => {
    setWarnOpen(false);
    setSecondsLeft((s) => s + 10 * 60);
    warnShownRef.current = false;
    showExtendToast();
  };

  const rows = ["A", "B", "C"];

  if (!eventId) {
    return <View style={{ flex: 1, backgroundColor: BG }} />;
  }

  return (
    <View style={[styles.root, { backgroundColor: BG, paddingTop: insets.top }]}>
      <ReservationWarningModal
        visible={warnOpen}
        minutesLeft={Math.max(1, Math.ceil(secondsLeft / 60))}
        onKeepReservation={handleKeepReservation}
        onCancel={() => setWarnOpen(false)}
      />

      {extendToast ? (
        <Animated.View style={[styles.toast, { opacity: toastOpacity }]}>
          <Ionicons name="checkmark-circle" size={22} color="#fff" />
          <Text style={styles.toastText}>SUCCESS Reservation extended by 10 minutes</Text>
          <TouchableOpacity onPress={() => setExtendToast(false)} hitSlop={8}>
            <Ionicons name="close" size={20} color="#fff" />
          </TouchableOpacity>
        </Animated.View>
      ) : null}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="arrow-back" size={24} color={PURPLE} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select Seats</Text>
        <TouchableOpacity hitSlop={12}>
          <Ionicons name="help-circle-outline" size={26} color={PURPLE} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scroll, { paddingBottom: 160 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.timerBanner, { backgroundColor: theme.colors.primary + "18" }]}>
          <Ionicons name="timer-outline" size={20} color={PURPLE_DEEP} />
          <Text style={styles.timerLabel}>RESERVATION EXPIRES IN: </Text>
          <Text style={styles.timerValue}>{formatTime(secondsLeft)} MIN</Text>
        </View>

        <View style={[styles.eventCard, { backgroundColor: theme.colors.primary + "14" }]}>
          {imageUrl ? (
            <Image source={{ uri: imageUrl }} style={styles.eventThumb} />
          ) : (
            <View style={[styles.eventThumb, styles.eventThumbPh]}>
              <Ionicons name="musical-notes" size={28} color={PURPLE} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.eventTitle} numberOfLines={2}>{eventName}</Text>
            <View style={styles.eventMetaRow}>
              <Ionicons name="calendar-outline" size={14} color={TEXT_DARK} />
              <Text style={styles.eventMeta}>{dateLine}</Text>
            </View>
          </View>
        </View>

        <View style={[styles.mapCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.legendRow}>
            <LegendDot color="#d8b4fe" label="Available" />
            <LegendDot color={PURPLE} label="Selected" />
            <LegendDot color="#d1d5db" label="Occupied" />
          </View>
          <Text style={styles.stageLabel}>STAGE FRONT</Text>
          <View style={styles.stageBar} />
          <View style={styles.legendRow}>
            <LegendDot color={PURPLE} label="VIP" />
            <LegendDot color="#d8b4fe" label="STANDARD" />
            <LegendDot color="#d1d5db" label="SOLD OUT" />
          </View>

          {rows.map((row) => (
            <View key={row} style={styles.rowWrap}>
              <TouchableOpacity style={styles.rowPick} onPress={() => selectRow(row)}>
                <Ionicons name="grid-outline" size={18} color={PURPLE} />
              </TouchableOpacity>
              <Text style={styles.rowLetter}>{row}</Text>
              <View style={styles.seatRow}>
                {SEATS.filter((s) => s.row === row).map((seat) => {
                  const isSel = selected.has(seat.id);
                  const sold = seat.tier === "soldout";
                  const bg = sold ? "#e5e7eb" : isSel ? PURPLE : "#ede9fe";
                  const border = isSel && !sold ? "#fff" : "transparent";
                  return (
                    <TouchableOpacity
                      key={seat.id}
                      style={[styles.seat, { backgroundColor: bg, borderWidth: isSel ? 2 : 0, borderColor: border }]}
                      onPress={() => toggleSeat(seat)}
                      disabled={sold}
                      activeOpacity={0.85}
                    >
                      <Text style={[styles.seatLabel, { color: sold ? "#9ca3af" : isSel ? "#fff" : PURPLE_DEEP }]}>
                        {seat.id}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
          <Text style={styles.hint}>Pinch to zoom or tap a seat to select</Text>
        </View>

        <View style={[styles.summaryCard, { backgroundColor: theme.colors.card }]}>
          <View style={styles.summaryHeader}>
            <Text style={styles.summaryTitle}>Selected Seats</Text>
            <TouchableOpacity style={styles.clearBtn} onPress={clearAll}>
              <Ionicons name="trash-outline" size={18} color={PURPLE} />
              <Text style={styles.clearText}>CLEAR ALL</Text>
            </TouchableOpacity>
          </View>
          {selectedList.map((s) => (
            <View key={s.id} style={styles.seatLine}>
              <View style={[styles.seatLineIcon, { backgroundColor: theme.colors.primary + "20" }]}>
                <Text style={{ fontWeight: "800", color: PURPLE, fontSize: 12 }}>{s.id}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.seatLinePlace}>Main Floor</Text>
                <Text style={styles.seatLineDetail}>ROW {s.row}, SEAT {s.num}</Text>
              </View>
              <Text style={styles.seatLinePrice}>${priceForSeat(s).toFixed(2)}</Text>
            </View>
          ))}
          <View style={[styles.priceLine, { borderTopColor: theme.colors.border }]}>
            <Text style={styles.priceMuted}>Subtotal ({selectedList.length} tickets)</Text>
            <Text style={styles.priceVal}>${subtotal.toFixed(2)}</Text>
          </View>
          <View style={styles.priceLine}>
            <Text style={styles.priceMuted}>Fees & Taxes</Text>
            <Text style={styles.priceVal}>${fees.toFixed(2)}</Text>
          </View>
          <View style={styles.priceLine}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalVal}>${total.toFixed(2)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.continueBtn, { backgroundColor: PURPLE }]}
            onPress={() => navigation.navigate("Checkout", { eventId })}
            activeOpacity={0.92}
          >
            <Ionicons name="cart-outline" size={22} color="#fff" />
            <Text style={styles.continueText}>Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={[styles.stickyConfirm, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <View>
          <Text style={styles.stickySmall}>{selectedList.length} SEATS SELECTED</Text>
          <Text style={styles.stickyBig}>Confirm ${total.toFixed(2)}</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.navigate("Checkout", { eventId })}>
          <Ionicons name="arrow-forward" size={26} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: color }} />
      <Text style={{ fontSize: 11, fontWeight: "600", color: TEXT_DARK }}>{label}</Text>
    </View>
  );
}

function createStyles(theme: Theme) {
  return StyleSheet.create({
    root: { flex: 1 },
    scroll: { paddingHorizontal: 16 },
    toast: {
      position: "absolute",
      top: Platform.OS === "ios" ? 52 : 40,
      left: 16,
      right: 16,
      zIndex: 50,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: PURPLE,
      paddingHorizontal: 14,
      paddingVertical: 12,
      borderRadius: 16,
      shadowColor: "#000",
      shadowOpacity: 0.15,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 6 },
      elevation: 6,
    },
    toastText: { flex: 1, color: "#fff", fontSize: 13, fontWeight: "700" },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    headerTitle: { fontSize: 18, fontWeight: "800", color: TEXT_DARK },
    timerBanner: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      padding: 12,
      borderRadius: 14,
      marginBottom: 12,
      gap: 6,
    },
    timerLabel: { fontSize: 12, fontWeight: "700", color: PURPLE_DEEP },
    timerValue: { fontSize: 14, fontWeight: "900", color: PURPLE_DEEP },
    eventCard: {
      flexDirection: "row",
      gap: 12,
      padding: 12,
      borderRadius: 20,
      marginBottom: 14,
      alignItems: "center",
    },
    eventThumb: { width: 64, height: 64, borderRadius: 12 },
    eventThumbPh: { backgroundColor: theme.colors.muted, justifyContent: "center", alignItems: "center" },
    eventTitle: { fontSize: 16, fontWeight: "800", color: TEXT_DARK, marginBottom: 6 },
    eventMetaRow: { flexDirection: "row", alignItems: "center", gap: 6 },
    eventMeta: { fontSize: 13, color: theme.colors.mutedForeground },
    mapCard: {
      borderRadius: 24,
      padding: 16,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: 4 },
      elevation: 2,
    },
    legendRow: { flexDirection: "row", flexWrap: "wrap", gap: 14, marginBottom: 12, justifyContent: "center" },
    stageLabel: { textAlign: "center", fontSize: 11, fontWeight: "800", color: theme.colors.mutedForeground, letterSpacing: 1 },
    stageBar: { height: 10, backgroundColor: "#e5e7eb", borderRadius: 4, marginVertical: 10 },
    rowWrap: { flexDirection: "row", alignItems: "center", marginBottom: 10, gap: 8 },
    rowPick: { width: 32, height: 32, borderRadius: 8, justifyContent: "center", alignItems: "center", backgroundColor: theme.colors.primary + "15" },
    rowLetter: { width: 20, fontWeight: "800", color: TEXT_DARK, fontSize: 15 },
    seatRow: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "flex-end" },
    seat: {
      width: 44,
      height: 44,
      borderRadius: 22,
      justifyContent: "center",
      alignItems: "center",
    },
    seatLabel: { fontSize: 10, fontWeight: "800" },
    hint: { fontSize: 11, fontStyle: "italic", color: theme.colors.mutedForeground, textAlign: "center", marginTop: 8 },
    summaryCard: {
      borderRadius: 24,
      padding: 16,
      marginBottom: 24,
      shadowColor: "#000",
      shadowOpacity: 0.06,
      shadowRadius: 12,
      elevation: 2,
    },
    summaryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 14 },
    summaryTitle: { fontSize: 18, fontWeight: "800", color: TEXT_DARK },
    clearBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
    clearText: { fontSize: 12, fontWeight: "800", color: PURPLE },
    seatLine: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
    seatLineIcon: { width: 40, height: 40, borderRadius: 20, justifyContent: "center", alignItems: "center" },
    seatLinePlace: { fontSize: 13, fontWeight: "700", color: TEXT_DARK },
    seatLineDetail: { fontSize: 12, color: theme.colors.mutedForeground },
    seatLinePrice: { fontSize: 15, fontWeight: "800", color: TEXT_DARK },
    priceLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderTopWidth: StyleSheet.hairlineWidth },
    priceMuted: { color: theme.colors.mutedForeground, fontSize: 14 },
    priceVal: { fontWeight: "600", color: TEXT_DARK },
    totalLabel: { fontWeight: "800", fontSize: 16, color: TEXT_DARK },
    totalVal: { fontSize: 22, fontWeight: "900", color: PURPLE },
    continueBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 10,
      borderRadius: 999,
      paddingVertical: 16,
      marginTop: 12,
    },
    continueText: { color: "#fff", fontSize: 17, fontWeight: "800" },
    stickyConfirm: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: PURPLE_DEEP,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 14,
      borderTopWidth: 3,
      borderTopColor: "#22c55e",
    },
    stickySmall: { color: "rgba(255,255,255,0.85)", fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
    stickyBig: { color: "#fff", fontSize: 20, fontWeight: "900" },
  });
}
