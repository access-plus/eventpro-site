import React from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";

export function SettingsScreen({ navigation }: { navigation: any }) {
  const { logout } = useAuth();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Appearance</Text>
        <Text style={styles.sectionDesc}>
          Theme and display options. Use your device settings for dark mode.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <Text style={styles.sectionDesc}>
          Recently viewed events are stored on this device. Clear app data in system settings to reset.
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
          <Text style={styles.logoutBtnText}>Log out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24 },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "600", marginBottom: 4 },
  sectionDesc: { fontSize: 14, color: "#666", marginBottom: 8 },
  logoutBtn: {
    marginTop: 8,
    padding: 14,
    borderRadius: 8,
    backgroundColor: "#fee",
    alignItems: "center",
  },
  logoutBtnText: { fontSize: 16, fontWeight: "600", color: "#c00" },
});
