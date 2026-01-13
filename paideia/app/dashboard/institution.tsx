import { View, Text, StyleSheet } from "react-native";

export default function StudiesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Studies Screen</Text>
      <Text style={styles.subText}>Diary and other features coming soon.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  text: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
  },
  subText: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
  },
});
