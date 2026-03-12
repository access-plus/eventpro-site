import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { theme } from "../theme";

/**
 * Reset password with token (e.g. from email link).
 * When backend adds POST /auth/reset-password or similar, wire it here.
 */
export function ResetPasswordScreen({ navigation, route }: { navigation: any; route?: { params?: { token?: string } } }) {
  const token = route?.params?.token;
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    if (!password || password.length < 8) {
      setError("Password must be at least 8 characters.");
      return false;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return false;
    }
    setError(null);
    return true;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setLoading(true);
    setError(null);
    try {
      // Backend endpoint not yet in shared client; placeholder.
      await new Promise((r) => setTimeout(r, 800));
      Alert.alert(
        "Not yet available",
        "Password reset will be available when the backend API is connected. Use the web app or contact support.",
        [{ text: "OK", onPress: () => navigation.replace("Login") }]
      );
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "20" }]}>
          <Ionicons name="key-outline" size={40} color={theme.colors.primary} />
        </View>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Reset password</Text>
        <Text style={[styles.desc, { color: theme.colors.mutedForeground }]}>
          {token ? "Enter your new password below." : "Password reset functionality will be implemented with your backend API."}
        </Text>
        {token ? (
          <>
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.foreground }]}
              value={password}
              onChangeText={(t) => { setPassword(t); setError(null); }}
              placeholder="New password"
              placeholderTextColor={theme.colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
            />
            <TextInput
              style={[styles.input, { backgroundColor: theme.colors.background, borderColor: theme.colors.border, color: theme.colors.foreground }]}
              value={confirm}
              onChangeText={(t) => { setConfirm(t); setError(null); }}
              placeholder="Confirm password"
              placeholderTextColor={theme.colors.mutedForeground}
              secureTextEntry
              autoCapitalize="none"
            />
            {error ? <Text style={[styles.error, { color: theme.colors.destructive }]}>{error}</Text> : null}
            <TouchableOpacity
              style={[styles.primaryBtn, { backgroundColor: theme.colors.primary }, loading && styles.btnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
              ) : (
                <Text style={[styles.primaryBtnText, { color: theme.colors.primaryForeground }]}>Reset password</Text>
              )}
            </TouchableOpacity>
          </>
        ) : null}
        <TouchableOpacity style={styles.link} onPress={() => navigation.replace("Login")}>
          <Text style={[styles.linkText, { color: theme.colors.mutedForeground }]}>Back to login</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, justifyContent: "center" },
  card: { padding: theme.spacing.xl, borderRadius: theme.radius.lg, borderWidth: 1 },
  iconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: "center", alignItems: "center", marginBottom: 16 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8, textAlign: "center", color: theme.colors.foreground },
  desc: { fontSize: 15, textAlign: "center", marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
  },
  error: { marginBottom: 12, fontSize: 14 },
  primaryBtn: { paddingVertical: 14, paddingHorizontal: 24, borderRadius: theme.radius.md, alignItems: "center", marginBottom: 16 },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { fontSize: 16, fontWeight: "600" },
  link: { alignItems: "center" },
  linkText: { fontSize: 15 },
});
