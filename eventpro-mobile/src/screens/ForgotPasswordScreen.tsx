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
} from "react-native";
import { theme } from "../theme";

export function ForgotPasswordScreen({ navigation }: { navigation: any }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validate = () => {
    const e = email.trim();
    if (!e) {
      setError("Enter your email.");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
      setError("Enter a valid email address.");
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
      // Web app uses a mock delay; no backend endpoint in shared client yet.
      await new Promise((r) => setTimeout(r, 1000));
      setSubmitted(true);
    } catch {
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Check your email</Text>
        <Text style={styles.desc}>
          We've sent password reset instructions to {email.trim()}. Check your inbox and follow the link.
        </Text>
        <TouchableOpacity style={styles.primaryBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.primaryBtnText}>Back to login</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={60}
    >
      <Text style={styles.title}>Forgot password?</Text>
      <Text style={styles.desc}>Enter your email to receive a reset link.</Text>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={(t) => { setEmail(t); setError(null); }}
        placeholder="you@example.com"
        placeholderTextColor={theme.colors.mutedForeground}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <TouchableOpacity
        style={[styles.primaryBtn, loading && styles.btnDisabled]}
        onPress={handleSubmit}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
        ) : (
          <Text style={styles.primaryBtnText}>Send reset link</Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.goBack()}>
        <Text style={styles.linkText}>Back to login</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: theme.spacing.lg, justifyContent: "center", backgroundColor: theme.colors.background },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 8, color: theme.colors.foreground },
  desc: { fontSize: 15, color: theme.colors.mutedForeground, marginBottom: 24 },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 12,
    backgroundColor: theme.colors.card,
    color: theme.colors.foreground,
  },
  error: { color: theme.colors.destructive, marginBottom: 12, fontSize: 14 },
  primaryBtn: { backgroundColor: theme.colors.primary, padding: 16, borderRadius: theme.radius.md, alignItems: "center", marginBottom: 16 },
  btnDisabled: { opacity: 0.7 },
  primaryBtnText: { color: theme.colors.primaryForeground, fontWeight: "600", fontSize: 16 },
  link: { alignItems: "center" },
  linkText: { fontSize: 15, color: theme.colors.mutedForeground },
});
