import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { ProfileStackParamList } from "./types";
import { ProfileScreen } from "../screens/ProfileScreen";
import { ProfileEditScreen } from "../screens/ProfileEditScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { OrderHistoryScreen } from "../screens/OrderHistoryScreen";
import { PricingScreen } from "../screens/PricingScreen";

const Stack = createNativeStackNavigator<ProfileStackParamList>();

export function ProfileStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
      <Stack.Screen name="ProfileEdit" component={ProfileEditScreen} options={{ title: "Edit profile" }} />
      <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: "Settings" }} />
      <Stack.Screen name="OrderHistory" component={OrderHistoryScreen} options={{ title: "Orders" }} />
      <Stack.Screen name="Pricing" component={PricingScreen} options={{ title: "Pricing" }} />
    </Stack.Navigator>
  );
}
