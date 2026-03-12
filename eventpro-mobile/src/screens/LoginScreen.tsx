import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

export function LoginScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !password) {
      Alert.alert("Error", "Enter email and password");
      return;
    }
    setLoading(true);
    try {
      await login({ email: email.trim(), password });
    } catch (err: unknown) {
      const e = err as { code?: string; message?: string; response?: { data?: { message?: string } }; isAxiosError?: boolean };
      const isNetworkError =
        e?.code === "ERR_NETWORK" ||
        e?.code === "ECONNRESET" ||
        e?.message === "Network Error" ||
        (e?.isAxiosError && !e?.response);
      const description = isNetworkError
        ? "Cannot reach the server. On a physical device, set EXPO_PUBLIC_API_URL in eventpro-mobile/.env to your computer's IP (e.g. http://192.168.1.x:8080), then restart Expo. On simulator, use http://localhost:8080."
        : e?.response?.data?.message ?? e?.message ?? "Invalid credentials. Check your email and password.";
      Alert.alert("Login failed", description);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.iconBox}>
            <Text style={styles.iconText}>EP</Text>
          </View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Sign in to your EventPro account</Text>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
          />

          <Text style={styles.label}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              placeholder="Enter your password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              editable={!loading}
            />
            <TouchableOpacity
              style={styles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <Text style={styles.eyeText}>{showPassword ? "Hide" : "Show"}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.forgotLink}
            onPress={() => navigation.navigate("ForgotPassword")}
          >
            <Text style={styles.forgotText}>Forgot password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={theme.colors.primaryForeground} />
            ) : (
              <Text style={styles.buttonText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.verifyLink} onPress={() => navigation.navigate("Verify")}>
            <Text style={styles.forgotText}>Verify your email</Text>
          </TouchableOpacity>
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
              <Text style={styles.footerLink}>Sign up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: theme.spacing.lg, paddingVertical: 40 },
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.primary,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: theme.spacing.md,
  },
  iconText: { color: theme.colors.primaryForeground, fontSize: 18, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 4, color: theme.colors.foreground },
  subtitle: { fontSize: 14, color: theme.colors.mutedForeground, textAlign: "center", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: theme.colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    color: theme.colors.foreground,
  },
  passwordRow: { position: "relative" as const, marginBottom: 8 },
  passwordInput: { marginBottom: 0, paddingRight: 56 },
  eyeButton: { position: "absolute" as const, right: 12, top: 0, bottom: 0, justifyContent: "center" },
  eyeText: { fontSize: 14, color: theme.colors.mutedForeground },
  forgotLink: { alignSelf: "flex-end", marginBottom: 16 },
  forgotText: { fontSize: 14, color: theme.colors.primary },
  verifyLink: { alignSelf: "center", marginTop: 12 },
  button: {
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radius.md,
    padding: 16,
    alignItems: "center",
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: theme.colors.primaryForeground, fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 14, color: theme.colors.mutedForeground },
  footerLink: { fontSize: 14, color: theme.colors.primary, fontWeight: "600" },
});
