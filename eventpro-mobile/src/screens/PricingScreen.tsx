import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";

export function PricingScreen({ navigation }: { navigation?: any }) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pricing</Text>
      <View style={styles.card}>
        <Text style={styles.tier}>Basic</Text>
        <Text style={styles.price}>Free</Text>
        <Text style={styles.desc}>Create events and sell tickets. Perfect to get started.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.tier}>Pro</Text>
        <Text style={styles.price}>Paid</Text>
        <Text style={styles.desc}>More features, team members, and branding. Subscribe on the web app.</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.tier}>Enterprise</Text>
        <Text style={styles.price}>Contact us</Text>
        <Text style={styles.desc}>Custom needs, API access, and dedicated support.</Text>
      </View>
      <Text style={styles.footnote}>
        Upgrade or manage your subscription at eventpro on the web.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 20 },
  card: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#eee",
  },
  tier: { fontSize: 18, fontWeight: "600" },
  price: { fontSize: 20, fontWeight: "700", marginTop: 4, color: "#0a0a0a" },
  desc: { fontSize: 14, color: "#666", marginTop: 8 },
  footnote: { fontSize: 13, color: "#888", marginTop: 24, textAlign: "center" },
});
