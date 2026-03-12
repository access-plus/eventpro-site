import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import type { CheckInResult } from "@eventpro/shared";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  route?: { params?: { eventId?: string; scannedTicketId?: string } };
  navigation?: any;
};

export function CheckInScreen({ route, navigation }: Props) {
  const { api } = useAuth();
  const eventId = route?.params?.eventId;
  const scannedTicketId = route?.params?.scannedTicketId;
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

  const performCheckIn = useCallback(
    async (id: string) => {
      const trimmed = id.trim();
      if (!UUID_REGEX.test(trimmed)) return;
      setLoading(true);
      setLastResult(null);
      try {
        const result = await api.checkInTicket(trimmed);
        setLastResult(result);
        setTicketId("");
        if (result.alreadyCheckedIn) {
          Alert.alert("Already checked in", `${result.attendeeName} – ${result.ticketName}`);
        } else {
          Alert.alert("Checked in", `${result.attendeeName} – ${result.ticketName}`);
        }
      } catch (err: unknown) {
        const msg =
          (err as { response?: { data?: { message?: string } } })?.response?.data?.message ??
          "Check-in failed";
        Alert.alert("Check-in failed", msg);
      } finally {
        setLoading(false);
      }
    },
    [api]
  );

  useFocusEffect(
    useCallback(() => {
      if (scannedTicketId) {
        performCheckIn(scannedTicketId);
        navigation.setParams({ scannedTicketId: undefined });
      }
    }, [scannedTicketId, navigation, performCheckIn])
  );

  const handleCheckIn = async () => {
    const trimmed = ticketId.trim();
    if (!trimmed) {
      Alert.alert("Error", "Enter or scan a ticket ID");
      return;
    }
    if (!UUID_REGEX.test(trimmed)) {
      Alert.alert("Invalid ID", "Ticket ID should be a UUID (from the QR code).");
      return;
    }
    await performCheckIn(trimmed);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <TouchableOpacity
        style={[styles.scanButton, { backgroundColor: theme.colors.primary }]}
        onPress={() => navigation.navigate("QRScanner", { eventId })}
        disabled={loading}
      >
        <Ionicons name="scan-outline" size={28} color={theme.colors.primaryForeground} />
        <Text style={styles.scanButtonText}>Scan QR code</Text>
        <Text style={styles.scanButtonHint}>Use camera to scan ticket</Text>
      </TouchableOpacity>

      <View style={styles.divider}>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
        <Text style={[styles.dividerText, { color: theme.colors.mutedForeground }]}>or enter ID</Text>
        <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Ticket ID (from QR code)</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste ticket ID"
          placeholderTextColor={theme.colors.mutedForeground}
          value={ticketId}
          onChangeText={setTicketId}
          editable={!loading}
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleCheckIn}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={theme.colors.primaryForeground} />
          ) : (
            <Text style={styles.buttonText}>Check in</Text>
          )}
        </TouchableOpacity>
      </View>

      {lastResult && (
        <View style={[styles.resultCard, lastResult.alreadyCheckedIn && styles.resultCardWarning]}>
          <Text style={styles.resultName}>{lastResult.attendeeName}</Text>
          <Text style={styles.resultTicket}>{lastResult.ticketName}</Text>
          {lastResult.alreadyCheckedIn && (
            <Text style={styles.resultBadge}>Already checked in</Text>
          )}
        </View>
      )}

      <Text style={styles.hint}>
        Scan the attendee's ticket QR code with your device camera, then paste the ticket ID here. Or use the web Check-in App for in-browser camera scanning.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  content: { padding: theme.spacing.md, paddingBottom: 40 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8, color: theme.colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.background,
    color: theme.colors.foreground,
  },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { fontSize: 16, fontWeight: "600", color: theme.colors.primaryForeground },
  resultCard: {
    backgroundColor: theme.colors.success + "20",
    borderRadius: theme.radius.lg,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.success,
  },
  resultCardWarning: {
    backgroundColor: "#fffbeb",
    borderLeftColor: "#f59e0b",
  },
  resultName: { fontSize: 17, fontWeight: "600", color: theme.colors.foreground },
  resultTicket: { fontSize: 14, marginTop: 2, color: theme.colors.mutedForeground },
  resultBadge: { fontSize: 12, marginTop: 4, color: "#b45309" },
  hint: { fontSize: 13, lineHeight: 20, color: theme.colors.mutedForeground },
  scanButton: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: theme.radius.lg,
    marginBottom: 20,
  },
  scanButtonText: { fontSize: 18, fontWeight: "700", color: theme.colors.primaryForeground, marginTop: 8 },
  scanButtonHint: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 2 },
  divider: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { marginHorizontal: 12, fontSize: 13 },
});
