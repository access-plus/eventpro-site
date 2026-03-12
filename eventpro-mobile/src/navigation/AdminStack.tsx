import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "./types";
import { AdminOverviewScreen } from "../screens/AdminOverviewScreen";
import { AdminUsersScreen } from "../screens/AdminUsersScreen";
import { AdminVerificationScreen } from "../screens/AdminVerificationScreen";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} options={{ title: "Admin" }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Users" }} />
      <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} options={{ title: "Verification" }} />
    </Stack.Navigator>
  );
}
