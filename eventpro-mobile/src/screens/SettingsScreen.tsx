import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { useNotificationPreferences } from "../contexts/NotificationPreferencesContext";
import { useRecentlyViewed } from "../contexts/RecentlyViewedContext";
import { useTheme } from "../contexts/ThemeContext";
import Constants from "expo-constants";
import { lightTheme } from "../theme";

const WEB_URL = Constants.expoConfig?.extra?.webUrl ?? process.env.EXPO_PUBLIC_WEB_URL ?? "https://eventpro.com";

export function SettingsScreen({ navigation }: { navigation: any }) {
  const { logout, api } = useAuth();
  const { theme, colorScheme, setColorScheme } = useTheme();
  const { notificationPreferences, setNotificationPreferences } = useNotificationPreferences();
  const { clearRecentlyViewed } = useRecentlyViewed();
  const [prefsLoading, setPrefsLoading] = useState(false);

  useEffect(() => {
    setPrefsLoading(true);
    api
      .getMyNotificationPreferences()
      .then((p) => setNotificationPreferences({ inAppNotifications: p.pushEnabled }))
      .catch(() => {})
      .finally(() => setPrefsLoading(false));
  }, [api]);

  const handleInAppChange = async (v: boolean) => {
    setNotificationPreferences({ inAppNotifications: v });
    try {
      await api.updateMyNotificationPreferences({ pushEnabled: v });
    } catch {
      setNotificationPreferences({ inAppNotifications: !v });
    }
  };

  const openWeb = (path: string) => {
    Linking.openURL(`${WEB_URL}${path}`).catch(() => {});
  };

  const openMail = () => {
    Linking.openURL("mailto:support@accessplus.com?subject=EventPro%20Support").catch(() => {});
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: theme.colors.foreground }]}>Settings</Text>

      {/* Account */}
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "18" }]}>
            <Ionicons name="person" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Account</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>Profile, orders & subscription</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => navigation.navigate("ProfileEdit")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Edit profile</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => navigation.navigate("OrderHistory")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Order history</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => navigation.navigate("Pricing")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Pricing & subscription</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Support & contact */}
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "18" }]}>
            <Ionicons name="help-buoy" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Support</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>Get help or contact us</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => openWeb("/help")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Help center</Text>
          <Ionicons name="open-outline" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={openMail}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Contact us (email)</Text>
          <Ionicons name="mail-outline" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => openWeb("/contact")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Contact page (web)</Text>
          <Ionicons name="open-outline" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => navigation.navigate("Privacy")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Data & privacy</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Notifications */}
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "18" }]}>
            <Ionicons name="notifications" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Notifications</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>Choose how we contact you</Text>
          </View>
        </View>
        <TouchableOpacity style={[styles.row, { borderTopColor: theme.colors.border }]} onPress={() => navigation.navigate("Notifications")}>
          <Text style={[styles.rowText, { color: theme.colors.foreground }]}>View notifications</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.mutedForeground} />
        </TouchableOpacity>
        <View style={[styles.row, { borderTopColor: theme.colors.border }]}>
          <View style={styles.switchLabel}>
            <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Order confirmations (email)</Text>
            <Text style={[styles.rowSubtext, { color: theme.colors.mutedForeground }]}>When you buy tickets</Text>
          </View>
          <Switch
            value={notificationPreferences.emailOrderConfirmations}
            onValueChange={(v) => setNotificationPreferences({ emailOrderConfirmations: v })}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary + "80" }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={[styles.row, { borderTopColor: theme.colors.border }]}>
          <View style={styles.switchLabel}>
            <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Marketing & tips (email)</Text>
            <Text style={[styles.rowSubtext, { color: theme.colors.mutedForeground }]}>News and offers</Text>
          </View>
          <Switch
            value={notificationPreferences.emailMarketing}
            onValueChange={(v) => setNotificationPreferences({ emailMarketing: v })}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary + "80" }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={[styles.row, { borderTopColor: theme.colors.border }]}>
          <View style={styles.switchLabel}>
            <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Event reminders (email)</Text>
            <Text style={[styles.rowSubtext, { color: theme.colors.mutedForeground }]}>Before events you attend</Text>
          </View>
          <Switch
            value={notificationPreferences.emailEventReminders}
            onValueChange={(v) => setNotificationPreferences({ emailEventReminders: v })}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary + "80" }}
            thumbColor={theme.colors.card}
          />
        </View>
        <View style={[styles.row, { borderTopColor: theme.colors.border }]}>
          <View style={styles.switchLabel}>
            <Text style={[styles.rowText, { color: theme.colors.foreground }]}>In-app notifications</Text>
            <Text style={[styles.rowSubtext, { color: theme.colors.mutedForeground }]}>When you're in the app</Text>
          </View>
          <Switch
            value={notificationPreferences.inAppNotifications}
            onValueChange={handleInAppChange}
            disabled={prefsLoading}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary + "80" }}
            thumbColor={theme.colors.card}
          />
        </View>
      </View>

      {/* Appearance */}
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "18" }]}>
            <Ionicons name="color-palette" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Appearance</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>Switch between light and dark mode</Text>
          </View>
        </View>
        <View style={[styles.row, { borderTopColor: theme.colors.border }]}>
          <View style={styles.switchLabel}>
            <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Dark mode</Text>
            <Text style={[styles.rowSubtext, { color: theme.colors.mutedForeground }]}>
              {colorScheme === "dark" ? "On" : "Off"}
            </Text>
          </View>
          <Switch
            value={colorScheme === "dark"}
            onValueChange={(v) => setColorScheme(v ? "dark" : "light")}
            trackColor={{ false: theme.colors.muted, true: theme.colors.primary + "80" }}
            thumbColor={theme.colors.card}
          />
        </View>
      </View>

      {/* Privacy */}
      <View style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconWrap, { backgroundColor: theme.colors.primary + "18" }]}>
            <Ionicons name="shield-checkmark" size={22} color={theme.colors.primary} />
          </View>
          <View style={styles.cardTitleBlock}>
            <Text style={[styles.cardTitle, { color: theme.colors.foreground }]}>Privacy</Text>
            <Text style={[styles.cardDesc, { color: theme.colors.mutedForeground }]}>Recently viewed events are stored on this device.</Text>
          </View>
        </View>
        <View style={[styles.row, { borderTopColor: theme.colors.border, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}>
          <View style={styles.switchLabel}>
            <Text style={[styles.rowText, { color: theme.colors.foreground }]}>Recently viewed events</Text>
            <Text style={[styles.rowSubtext, { color: theme.colors.mutedForeground }]}>Clear your recently viewed events list</Text>
          </View>
          <TouchableOpacity
            onPress={clearRecentlyViewed}
            style={[styles.clearBtn, { borderColor: theme.colors.border }]}
          >
            <Ionicons name="trash-outline" size={20} color={theme.colors.foreground} />
            <Text style={[styles.clearBtnText, { color: theme.colors.foreground }]}>Clear</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Log out */}
      <TouchableOpacity
        style={[styles.logoutBtn, { backgroundColor: theme.colors.destructive + "18", borderColor: theme.colors.destructive + "40" }]}
        onPress={() => logout()}
      >
        <Ionicons name="log-out-outline" size={22} color={theme.colors.destructive} />
        <Text style={[styles.logoutBtnText, { color: theme.colors.destructive }]}>Log out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: lightTheme.spacing.lg, paddingBottom: 32 },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 24 },
  card: {
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  cardHeader: { flexDirection: "row", alignItems: "center", padding: lightTheme.spacing.md },
  iconWrap: { width: 44, height: 44, borderRadius: lightTheme.radius.md, justifyContent: "center", alignItems: "center", marginRight: 14 },
  cardTitleBlock: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "600" },
  cardDesc: { fontSize: 13, marginTop: 2 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: lightTheme.spacing.md,
    borderTopWidth: 1,
  },
  rowText: { fontSize: 16 },
  switchLabel: { flex: 1 },
  rowSubtext: { fontSize: 12, marginTop: 2 },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: lightTheme.radius.lg,
    borderWidth: 1,
    marginTop: 8,
  },
  logoutBtnText: { fontSize: 16, fontWeight: "600" },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: lightTheme.radius.md,
    borderWidth: 1,
  },
  clearBtnText: { fontSize: 15, fontWeight: "600" },
});
