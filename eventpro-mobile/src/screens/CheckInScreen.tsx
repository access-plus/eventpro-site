import React, { useState } from "react";
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
import type { CheckInResult } from "@eventpro/shared";
import { useAuth } from "../context/AuthContext";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  route?: { params?: { eventId?: string } };
  navigation?: unknown;
};

export function CheckInScreen({ route }: Props) {
  const { api } = useAuth();
  const eventId = route?.params?.eventId;
  const [ticketId, setTicketId] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CheckInResult | null>(null);

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
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.label}>Ticket ID (from QR code)</Text>
        <TextInput
          style={styles.input}
          placeholder="Paste ticket ID or scan QR"
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
            <ActivityIndicator color="#fff" />
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  content: { padding: 16, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
  },
  button: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  resultCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#10b981",
  },
  resultCardWarning: {
    backgroundColor: "#fffbeb",
    borderLeftColor: "#f59e0b",
  },
  resultName: { fontSize: 17, fontWeight: "600" },
  resultTicket: { fontSize: 14, color: "#666", marginTop: 2 },
  resultBadge: { fontSize: 12, color: "#b45309", marginTop: 4 },
  hint: { fontSize: 13, color: "#666", lineHeight: 20 },
});
