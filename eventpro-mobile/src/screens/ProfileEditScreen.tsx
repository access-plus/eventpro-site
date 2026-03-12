import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";

const CULTURAL_NICHE_OPTIONS = [
  "West African Cultural Events",
  "Cultural & Community Events",
  "Afro-Caribbean & Diaspora",
  "Diaspora & Heritage",
  "Live Music & Festivals",
  "Conference & Professional",
  "Other",
];

export function ProfileEditScreen({ navigation }: { navigation: any }) {
  const { user, refreshUser, hasRole, api } = useAuth();
  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [location, setLocation] = useState(user?.location ?? "");
  const [culturalNiche, setCulturalNiche] = useState(user?.culturalNiche ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setFirstName(user?.firstName ?? "");
    setLastName(user?.lastName ?? "");
    setPhoneNumber(user?.phoneNumber ?? "");
    setBio(user?.bio ?? "");
    setLocation(user?.location ?? "");
    setCulturalNiche(user?.culturalNiche ?? "");
  }, [user]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);
    try {
      await api.updateUser({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phoneNumber: phoneNumber || undefined,
        bio: bio || undefined,
        location: location || undefined,
        culturalNiche: culturalNiche || undefined,
      });
      await refreshUser();
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? "Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const showCulturalNiche = hasRole("ORGANIZER") || hasRole("ADMIN");

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={80}
    >
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.sectionLabel}>First name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          placeholder="First name"
          autoCapitalize="words"
        />
        <Text style={styles.sectionLabel}>Last name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          placeholder="Last name"
          autoCapitalize="words"
        />
        <Text style={styles.sectionLabel}>Phone number</Text>
        <TextInput
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Phone (optional)"
          keyboardType="phone-pad"
        />
        <Text style={styles.sectionLabel}>Bio</Text>
        <TextInput
          style={[styles.input, styles.inputMultiline]}
          value={bio}
          onChangeText={setBio}
          placeholder="Short bio (optional)"
          multiline
          numberOfLines={3}
        />
        <Text style={styles.sectionLabel}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="City, State (optional)"
        />
        {showCulturalNiche && (
          <>
            <Text style={styles.sectionLabel}>Cultural niche / focus</Text>
            <TextInput
              style={styles.input}
              value={culturalNiche}
              onChangeText={setCulturalNiche}
              placeholder="e.g. West African Cultural Events"
            />
            <Text style={styles.hint}>Helps attendees discover your events.</Text>
          </>
        )}
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
            disabled={saving}
          >
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={theme.colors.primaryForeground} />
            ) : (
              <Text style={styles.saveBtnText}>Save changes</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scroll: { flex: 1 },
  scrollContent: { padding: theme.spacing.md, paddingBottom: 32 },
  sectionLabel: { fontSize: 14, fontWeight: "600", marginBottom: 6, color: theme.colors.foreground },
  input: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: theme.colors.card,
    color: theme.colors.foreground,
  },
  inputMultiline: { minHeight: 80, textAlignVertical: "top" },
  hint: { fontSize: 12, marginBottom: 16, color: theme.colors.mutedForeground },
  error: { marginBottom: 12, color: theme.colors.destructive },
  actions: { flexDirection: "row", gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, padding: 14, borderRadius: theme.radius.md, borderWidth: 1, borderColor: theme.colors.border, alignItems: "center" },
  cancelBtnText: { fontSize: 16, color: theme.colors.foreground },
  saveBtn: { flex: 1, padding: 14, borderRadius: theme.radius.md, backgroundColor: theme.colors.primary, alignItems: "center" },
  saveBtnDisabled: { opacity: 0.7 },
  saveBtnText: { fontSize: 16, fontWeight: "600", color: theme.colors.primaryForeground },
});
