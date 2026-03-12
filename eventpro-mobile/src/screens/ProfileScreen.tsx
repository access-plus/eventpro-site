import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useAuth } from "../context/AuthContext";

export function ProfileScreen({ navigation }: { navigation: any }) {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.name}>{user?.firstName} {user?.lastName}</Text>
      <Text style={styles.email}>{user?.email}</Text>
      <Text style={styles.tier}>Plan: {user?.subscriptionTier ?? "BASIC"}</Text>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("ProfileEdit")}>
        <Text style={styles.linkText}>Edit profile</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Settings")}>
        <Text style={styles.linkText}>Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("OrderHistory")}>
        <Text style={styles.linkText}>Order history</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => navigation.navigate("Pricing")}>
        <Text style={styles.linkText}>Pricing</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.logout} onPress={() => logout()}>
        <Text style={styles.logoutText}>Sign out</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24 },
  name: { fontSize: 20, fontWeight: "700", marginBottom: 4 },
  email: { fontSize: 14, color: "#666", marginBottom: 8 },
  tier: { fontSize: 14, color: "#666", marginBottom: 24 },
  link: { paddingVertical: 12 },
  linkText: { fontSize: 16, color: "#0a0a0a" },
  logout: { marginTop: 24, paddingVertical: 12 },
  logoutText: { fontSize: 16, color: "#666" },
});
