/**
 * EventPro Mobile – mirrors web app with Discover, Profile, Organizer, Admin.
 * Auth uses same backend as web: login, signUp, JWT in SecureStore, 401 clears session.
 * Handles eventpro://subscription/return after Stripe Checkout so tier/role sync without reopening web.
 */
import React, { useRef, useMemo, useEffect } from "react";
import { NavigationContainer, useNavigationContainerRef } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as SecureStore from "expo-secure-store";
import { createEventProApi } from "@eventpro/shared";
import Constants from "expo-constants";
import { View, ActivityIndicator, StyleSheet, Linking, Alert } from "react-native";

import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { NotificationPreferencesProvider } from "./src/contexts/NotificationPreferencesContext";
import { RecentlyViewedProvider } from "./src/contexts/RecentlyViewedContext";
import { ThemeProvider } from "./src/contexts/ThemeContext";
import { AuthStack } from "./src/navigation/AuthStack";
import { MainTabs } from "./src/navigation/MainTabs";
import type { RootStackParamList } from "./src/navigation/types";
import { useTheme } from "./src/contexts/ThemeContext";

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:8080";

function handleSubscriptionReturnUrl(
  url: string,
  api: ReturnType<typeof createEventProApi>,
  refreshUser: () => Promise<void>,
  navigationRef: React.RefObject<ReturnType<typeof useNavigationContainerRef>["current"]>
) {
  if (!url || !url.startsWith("eventpro://subscription/return")) return;
  api
    .syncSubscriptionFromStripe()
    .then(({ message }) => refreshUser().then(() => ({ message })))
    .then(({ message }) => {
      if (message.toLowerCase().includes("synced") || message.toLowerCase().includes("tier=")) {
        Alert.alert("Success", "Subscription updated. You now have organizer access.");
      }
      const root = navigationRef.current;
      if (root?.isReady()) {
        root.navigate("Main", { screen: "Profile" });
      }
    })
    .catch(() => {
      Alert.alert(
        "Sync issue",
        "Could not sync subscription. Your payment may still have gone through. Check your profile on the web."
      );
      const root = navigationRef.current;
      if (root?.isReady()) {
        root.navigate("Main", { screen: "Profile" });
      }
    });
}

function DeepLinkHandler({
  navigationRef,
}: {
  navigationRef: React.RefObject<ReturnType<typeof useNavigationContainerRef>["current"]>;
}) {
  const { api, refreshUser, user } = useAuth();
  const pendingReturnUrl = useRef<string | null>(null);

  useEffect(() => {
    const subscription = Linking.addEventListener("url", (event) => {
      handleSubscriptionReturnUrl(event.url, api, refreshUser, navigationRef);
    });
    Linking.getInitialURL().then((url) => {
      if (url?.startsWith("eventpro://subscription/return")) pendingReturnUrl.current = url;
    });
    return () => subscription.remove();
  }, [api, refreshUser, navigationRef]);

  useEffect(() => {
    if (!user || !pendingReturnUrl.current) return;
    const url = pendingReturnUrl.current;
    pendingReturnUrl.current = null;
    handleSubscriptionReturnUrl(url, api, refreshUser, navigationRef);
  }, [user, api, refreshUser, navigationRef]);
  return null;
}

function AppContent() {
  const onUnauthorizedRef = useRef<(() => void) | null>(null);
  const navigationRef = useNavigationContainerRef<RootStackParamList>();

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
    <ThemeProvider>
      <AuthProvider api={api} onUnauthorizedRef={onUnauthorizedRef}>
        <NotificationPreferencesProvider>
          <RecentlyViewedProvider>
            <NavigationContainer ref={navigationRef}>
            <RootNavigator />
            <DeepLinkHandler navigationRef={navigationRef} />
          </NavigationContainer>
          </RecentlyViewedProvider>
        </NotificationPreferencesProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

const RootStack = createNativeStackNavigator<RootStackParamList>();

function RootNavigator() {
  const { user, loading } = useAuth();
  const { theme } = useTheme();
  if (loading) {
    return (
      <View style={[styles.loading, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
