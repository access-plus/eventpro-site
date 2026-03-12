import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import { theme } from "../theme";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Props = {
  navigation: any;
  route: { params?: { eventId?: string } };
};

export function QRScannerScreen({ navigation }: Props) {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const lastScannedRef = useRef<string | null>(null);
  const scanCooldownRef = useRef(false);

  useEffect(() => {
    if (!permission?.granted && permission?.canAskAgain) {
      requestPermission();
    }
  }, [permission?.granted, permission?.canAskAgain, requestPermission]);

  const handleBarcodeScanned = useCallback(
    ({ data }: { data: string }) => {
      const trimmed = (data || "").trim();
      if (!trimmed || scanCooldownRef.current) return;
      if (!UUID_REGEX.test(trimmed)) return;
      if (lastScannedRef.current === trimmed) return;

      lastScannedRef.current = trimmed;
      scanCooldownRef.current = true;
      setScanning(false);

      navigation.navigate("CheckIn", { scannedTicketId: trimmed });
      setTimeout(() => {
        scanCooldownRef.current = false;
        lastScannedRef.current = null;
      }, 2000);
    },
    [navigation]
  );

  if (!permission) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.message, { color: theme.colors.mutedForeground }]}>Checking camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.centered, { backgroundColor: theme.colors.background }]}>
        <Text style={[styles.message, { color: theme.colors.foreground }]}>Camera access is needed to scan ticket QR codes.</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: theme.colors.primary }]} onPress={requestPermission}>
          <Text style={[styles.buttonText, { color: theme.colors.primaryForeground }]}>Allow camera</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={scanning ? handleBarcodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />
      <View style={styles.overlay}>
        <View style={styles.frame} />
        <Text style={styles.hint}>Point the camera at the ticket QR code</Text>
      </View>
      <TouchableOpacity
        style={[styles.closeBtn, { backgroundColor: theme.colors.card }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[styles.closeBtnText, { color: theme.colors.foreground }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: "center", alignItems: "center", padding: theme.spacing.lg },
  message: { textAlign: "center", marginBottom: theme.spacing.lg },
  button: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: theme.radius.md },
  buttonText: { fontWeight: "600" },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
  },
  frame: {
    width: 240,
    height: 240,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.6)",
  },
  hint: {
    marginTop: 24,
    fontSize: 16,
    color: "#fff",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  closeBtn: {
    position: "absolute",
    bottom: 40,
    left: theme.spacing.lg,
    right: theme.spacing.lg,
    paddingVertical: 14,
    borderRadius: theme.radius.md,
    alignItems: "center",
  },
  closeBtnText: { fontSize: 16, fontWeight: "600" },
});
