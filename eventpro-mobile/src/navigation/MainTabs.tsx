import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "./types";
import { useAuth } from "../context/AuthContext";
import { DiscoverStack } from "./DiscoverStack";
import { ProfileStack } from "./ProfileStack";
import { OrganizerStack } from "./OrganizerStack";
import { AdminStack } from "./AdminStack";

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainTabs() {
  const { user } = useAuth();
  const isOrganizer = user?.role === "ORGANIZER" || user?.role === "ADMIN";
  const isAdmin = user?.role === "ADMIN";

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarLabelStyle: { fontSize: 12 },
      }}
    >
      <Tab.Screen
        name="Discover"
        component={DiscoverStack}
        options={{ title: "Home", tabBarLabel: "Home" }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStack}
        options={{ title: "Profile", tabBarLabel: "Profile" }}
      />
      {isOrganizer && (
        <Tab.Screen
          name="Organizer"
          component={OrganizerStack}
          options={{ title: "Organizer", tabBarLabel: "Organizer" }}
        />
      )}
      {isAdmin && (
        <Tab.Screen
          name="Admin"
          component={AdminStack}
          options={{ title: "Admin", tabBarLabel: "Admin" }}
        />
      )}
    </Tab.Navigator>
  );
}
