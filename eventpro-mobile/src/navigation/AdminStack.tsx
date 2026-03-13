import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { AdminStackParamList } from "./types";
import { useTheme } from "../contexts/ThemeContext";
import { AdminOverviewScreen } from "../screens/AdminOverviewScreen";
import { AdminStatsScreen } from "../screens/AdminStatsScreen";
import { AdminUsersScreen } from "../screens/AdminUsersScreen";
import { AdminVerificationScreen } from "../screens/AdminVerificationScreen";
import { AdminEventsScreen } from "../screens/AdminEventsScreen";
import { AdminEventSalesScreen } from "../screens/AdminEventSalesScreen";
import { AdminRevenueScreen } from "../screens/AdminRevenueScreen";
import { AdminSubscriptionPaymentsScreen } from "../screens/AdminSubscriptionPaymentsScreen";

const Stack = createNativeStackNavigator<AdminStackParamList>();

export function AdminStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.foreground,
        headerTitleStyle: { color: theme.colors.foreground },
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="AdminOverview" component={AdminOverviewScreen} options={{ title: "Admin" }} />
      <Stack.Screen name="AdminStats" component={AdminStatsScreen} options={{ title: "Platform overview" }} />
      <Stack.Screen name="AdminUsers" component={AdminUsersScreen} options={{ title: "Users" }} />
      <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} options={{ title: "Verification" }} />
      <Stack.Screen name="AdminEvents" component={AdminEventsScreen} options={{ title: "Events" }} />
      <Stack.Screen name="AdminEventSales" component={AdminEventSalesScreen} options={{ title: "Event sales" }} />
      <Stack.Screen name="AdminRevenue" component={AdminRevenueScreen} options={{ title: "Revenue" }} />
      <Stack.Screen name="AdminSubscriptionPayments" component={AdminSubscriptionPaymentsScreen} options={{ title: "Subscription payments" }} />
    </Stack.Navigator>
  );
}
