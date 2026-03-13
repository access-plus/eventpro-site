import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { OrganizerStackParamList } from "./types";
import { useTheme } from "../contexts/ThemeContext";
import { OrganizerDashboardScreen } from "../screens/OrganizerDashboardScreen";
import { OrganizerEventDetailScreen } from "../screens/OrganizerEventDetailScreen";
import { EventTicketsScreen } from "../screens/EventTicketsScreen";
import { EventEnhancementsScreen } from "../screens/EventEnhancementsScreen";
import { CheckInScreen } from "../screens/CheckInScreen";
import { QRScannerScreen } from "../screens/QRScannerScreen";

const Stack = createNativeStackNavigator<OrganizerStackParamList>();

export function OrganizerStack() {
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
      <Stack.Screen name="OrganizerDashboard" component={OrganizerDashboardScreen} options={{ title: "Organizer" }} />
      <Stack.Screen name="OrganizerEventDetail" component={OrganizerEventDetailScreen} options={{ title: "Event" }} />
      <Stack.Screen name="EventTickets" component={EventTicketsScreen} options={{ title: "Tickets" }} />
      <Stack.Screen name="EventEnhancements" component={EventEnhancementsScreen} options={{ title: "Enhancements" }} />
      <Stack.Screen name="CheckIn" component={CheckInScreen} options={{ title: "Check-in" }} />
      <Stack.Screen name="QRScanner" component={QRScannerScreen} options={{ title: "Scan ticket" }} />
    </Stack.Navigator>
  );
}
