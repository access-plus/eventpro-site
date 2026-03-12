import React from "react";
import { TouchableOpacity } from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProfileEditScreen } from "../screens/ProfileEditScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { PricingScreen } from "../screens/PricingScreen";
import { PrivacyScreen } from "../screens/PrivacyScreen";
import { NotificationsScreen } from "../screens/NotificationsScreen";
import { useTheme } from "../contexts/ThemeContext";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileHeaderLeft({ navigation }: { navigation: NativeStackNavigationProp<ProfileStackParamList, "ProfileHome"> }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => navigation.getParent()?.navigate("Discover")}
      style={{ marginLeft: 8, padding: 8 }}
    >
      <Ionicons name="chevron-back" size={24} color={theme.colors.foreground} />
    </TouchableOpacity>
  );
}

function ProfileHeaderRight({ navigation }: { navigation: NativeStackNavigationProp<ProfileStackParamList, "ProfileHome"> }) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity
      onPress={() => navigation.navigate("Notifications")}
      style={{ marginRight: 8, padding: 8 }}
      accessibilityLabel="Notifications"
    >
      <Ionicons name="notifications-outline" size={24} color={theme.colors.foreground} />
    </TouchableOpacity>
  );
}

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen
        name="ProfileHome"
        component={ProfileScreen}
        options={({ navigation }) => ({
          title: "Profile",
          headerLeft: () => <ProfileHeaderLeft navigation={navigation} />,
          headerRight: () => <ProfileHeaderRight navigation={navigation} />,
        })}
      />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: "Edit profile" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} options={{ title: "Notifications" }} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: "Orders" }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: "Pricing" }} />
      <Stack.Screen name="Privacy" component={PrivacyScreen} options={{ title: "Privacy" }} />
    </Stack.Navigator>
  );
}
