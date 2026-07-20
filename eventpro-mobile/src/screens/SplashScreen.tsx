import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet, Animated, Easing, Dimensions } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { width: W } = Dimensions.get("window");

/**
 * Stitch-style splash: KanamEvents mark, tagline, initializing progress.
 */
export function SplashScreen() {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          useNativeDriver: false,
        }),
      ])
    ).start();
  }, [progress]);

  const barWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [8, Math.min(W - 80, 320)],
  });

  return (
    <LinearGradient colors={["#faf5ff", "#f3e8ff", "#ffffff"]} style={styles.root} start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}>
      <View style={styles.center}>
        <View style={styles.logoOuter}>
          <View style={styles.logoInner}>
            <View style={styles.heartWrap}>
              <Ionicons name="heart" size={42} color="#fff" />
              <View style={styles.bolt}>
                <Ionicons name="flash" size={14} color="#ec4899" />
              </View>
            </View>
          </View>
        </View>
        <Text style={styles.brand}>KanamEvents</Text>
        <Text style={styles.tag}>
          <Text style={styles.tagMuted}>Curating </Text>
          <Text style={styles.tagAccent}>Live Moments</Text>
        </Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.track}>
          <Animated.View style={[styles.fill, { width: barWidth }]} />
        </View>
        <Text style={styles.init}>INITIALIZING EXPERIENCE</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 32 },
  logoOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 8,
  },
  logoInner: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#7c3aed",
    justifyContent: "center",
    alignItems: "center",
  },
  heartWrap: { position: "relative", justifyContent: "center", alignItems: "center" },
  bolt: { position: "absolute", alignItems: "center", justifyContent: "center" },
  brand: { fontSize: 32, fontWeight: "900", color: "#1e1b4b", letterSpacing: -0.5, marginBottom: 8 },
  tag: { fontSize: 16, textAlign: "center" },
  tagMuted: { color: "#7c6f9a", fontWeight: "600" },
  tagAccent: { color: "#db2777", fontWeight: "700" },
  bottom: { paddingBottom: 48, paddingHorizontal: 32, alignItems: "center" },
  track: {
    width: "100%",
    maxWidth: 320,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(124, 58, 237, 0.15)",
    overflow: "hidden",
    marginBottom: 12,
  },
  fill: {
    height: 4,
    borderRadius: 2,
    backgroundColor: "#db2777",
  },
  init: { fontSize: 10, fontWeight: "800", letterSpacing: 3, color: "#9ca3af" },
});
