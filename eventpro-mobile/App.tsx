/**
 * EventPro Mobile – mirrors web app with Discover, Profile, Organizer, Admin.
 * Auth uses same backend as web: login, signUp, JWT in SecureStore, 401 clears session.
 */
import React, { useRef, useMemo } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { createEventProApi } from "@eventpro/shared";
import Constants from "expo-constants";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { AuthStack } from "./src/navigation/AuthStack";
import { MainTabs } from "./src/navigation/MainTabs";
import type { RootStackParamList } from "./src/navigation/types";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:8080";

function AppContent() {
  const onUnauthorizedRef = useRef<(() => void) | null>(null);

  const api = useMemo(
    () =>
      createEventProApi({
        baseURL: API_URL,
        getAccessToken: () => SecureStore.getItemAsync("accessToken"),
        setAccessToken: (token) => SecureStore.setItemAsync("accessToken", token),
        removeAccessToken: () => SecureStore.deleteItemAsync("accessToken"),
        onUnauthorized: () => {
          onUnauthorizedRef.current?.();
        },
      }),
    []
  );

  return (
    <AuthProvider api={api} onUnauthorizedRef={onUnauthorizedRef}>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </AuthProvider>
  );
}

const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        <RootStack.Screen name="Auth" component={AuthStack} />
      ) : (
        <RootStack.Screen name="Main" component={MainTabs} />
      )}
    </RootStack.Navigator>
  );
}

export default function App() {
  return <AppContent />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
