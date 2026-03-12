import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { DiscoverStackParamList } from "./types";
import { HomeScreen } from "../screens/HomeScreen";
import { EventsListScreen } from "../screens/EventsListScreen";
import { EventDetailScreen } from "../screens/EventDetailScreen";
import { CheckoutScreen } from "../screens/CheckoutScreen";

const Stack = createNativeStackNavigator<DiscoverStackParamList>();

export function DiscoverStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: true }}>
      <Stack.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
      <Stack.Screen name="EventsList" component={EventsListScreen} options={{ title: "Events" }} />
      <Stack.Screen name="EventDetail" component={EventDetailScreen} options={{ title: "Event" }} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ title: "Checkout" }} />
    </Stack.Navigator>
  );
}
