import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { DiscoverStackParamList } from "./types";
import { useTheme } from "../contexts/ThemeContext";
import { HomeScreen } from "../screens/HomeScreen";
import { EventsListScreen } from "../screens/EventsListScreen";
import { EventDetailScreen } from "../screens/EventDetailScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStack() {
  const { theme } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: theme.colors.card },
        headerTintColor: theme.colors.foreground,
        headerTitleStyle: { color: theme.colors.foreground },
        headerShadowVisible: false,
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen
        name="EventsList"
        component={EventsListScreen}
        options={({ route }) => ({ title: (route.params as { organizerId?: string })?.organizerId ? "More from this organizer" : "Events" })}
      />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Event" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </Stack.Navigator>
  );
}
