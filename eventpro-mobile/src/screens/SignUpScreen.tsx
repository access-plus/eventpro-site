import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "@eventpro/shared";

/** Extract a user-friendly message from signup API error (backend sends message + optional fields). */
function getSignUpErrorMessage(err: unknown): string {
  const e = err as {
    response?: {
      status?: number;
      statusText?: string;
      data?: {
        message?: string;
        fields?: Record<string, string>;
        detail?: string;
      };
    };
    message?: string;
  };
  const data = e?.response?.data;
  const isNetworkError =
    !e?.response &&
    (e?.message === "Network Error" ||
      (err as { code?: string })?.code === "ERR_NETWORK" ||
      (err as { code?: string })?.code === "ECONNRESET");
  if (isNetworkError) {
    return "Cannot reach the server. On a physical device, set EXPO_PUBLIC_API_URL in eventpro-mobile/.env to your computer's IP (e.g. http://192.168.1.x:8080), then restart Expo. On simulator, use http://localhost:8080.";
  }
  if (!data && !e?.message) {
    return "Sign up failed. Check your entries and try again.";
  }
  const parts: string[] = [];
  if (data?.message && typeof data.message === "string") {
    parts.push(data.message);
  }
  if (data?.fields && typeof data.fields === "object") {
    const fieldMsgs = Object.entries(data.fields)
      .map(([k, v]) => `${k}: ${v}`)
      .join("\n");
    if (fieldMsgs && !parts[0]?.includes(fieldMsgs)) parts.push(fieldMsgs);
  }
  if (parts.length > 0) return parts.join("\n\n");
  if (data?.detail) return data.detail;
  if (e?.response?.status === 409) return "An account with this email already exists.";
  if (e?.response?.statusText) return `${e.response.status} ${e.response.statusText}`;
  if (e?.message) return e.message;
  return "Sign up failed. Check your entries and try again.";
}

export function SignUpScreen({ navigation }: { navigation: { navigate: (name: string) => void } }) {
  const { signUp } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [role, setRole] = useState<UserRole>("USER");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = (): string | null => {
    if (!firstName.trim()) return "First name is required.";
    if (!lastName.trim()) return "Last name is required.";
    if (!email.trim()) return "Email is required.";
    if (password.length < 8) return "Password must be at least 8 characters.";
    if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
    if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
    if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
    if (password !== confirmPassword) return "Passwords don't match.";
    return null;
  };

  const handleSignUp = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Error", err);
      return;
    }
    setLoading(true);
    try {
      await signUp({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        role,
      });
      Alert.alert("Success", "Account created! You can now log in.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err: unknown) {
      const msg = getSignUpErrorMessage(err);
      Alert.alert("Sign up failed", msg);
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
          <Text style={styles.title}>Create an account</Text>
          <Text style={styles.subtitle}>Enter your details to get started with EventPro</Text>

          <View style={styles.row}>
            <View style={styles.half}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="John"
                value={firstName}
                onChangeText={setFirstName}
                editable={!loading}
              />
            </View>
            <View style={styles.half}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Doe"
                value={lastName}
                onChangeText={setLastName}
                editable={!loading}
              />
            </View>
          </View>

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={!loading}
          />

          <Text style={styles.label}>Phone Number (Optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="+1 (555) 000-0000"
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            keyboardType="phone-pad"
            editable={!loading}
          />

          <Text style={styles.label}>Account Type</Text>
          <View style={styles.roleRow}>
            <TouchableOpacity
              style={[styles.roleBtn, role === "USER" && styles.roleBtnActive]}
              onPress={() => setRole("USER")}
            >
              <Text style={[styles.roleBtnText, role === "USER" && styles.roleBtnTextActive]}>
                Event Attendee
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.roleBtn, role === "ORGANIZER" && styles.roleBtnActive]}
              onPress={() => setRole("ORGANIZER")}
            >
              <Text style={[styles.roleBtnText, role === "ORGANIZER" && styles.roleBtnTextActive]}>
                Event Organizer
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Create a password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            editable={!loading}
          />

          <Text style={styles.label}>Confirm Password</Text>
          <TextInput
            style={styles.input}
            placeholder="Confirm your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleSignUp}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? "Creating account..." : "Sign Up"}</Text>
          </TouchableOpacity>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
              <Text style={styles.footerLink}>Login</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  scrollContent: { padding: 24, paddingVertical: 24, paddingBottom: 40 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: "#0a0a0a",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  iconText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  title: { fontSize: 22, fontWeight: "700", textAlign: "center", marginBottom: 4 },
  subtitle: { fontSize: 14, color: "#666", textAlign: "center", marginBottom: 24 },
  label: { fontSize: 14, fontWeight: "600", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  roleBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
  },
  roleBtnActive: { backgroundColor: "#0a0a0a", borderColor: "#0a0a0a" },
  roleBtnText: { fontSize: 14, color: "#666" },
  roleBtnTextActive: { color: "#fff", fontWeight: "600" },
  button: {
    backgroundColor: "#0a0a0a",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 20 },
  footerText: { fontSize: 14, color: "#666" },
  footerLink: { fontSize: 14, color: "#0a0a0a", fontWeight: "600" },
});
