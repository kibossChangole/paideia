import { View, Platform, StyleSheet, TouchableOpacity } from "react-native";
import { Tabs } from "expo-router";
import { TabBarIcon } from "@/components/TabBarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";
import { BlurView } from "expo-blur";

const COLORS = {
  primary: "#14B8A6", // Teal
  slate400: "#94a3b8",
  white: "#ffffff",
};

export default function DashboardLayout() {
  const colorScheme = useColorScheme();

  // Determine tab bar background based on platform for blur effect
  const TabBarBackground = () => {
    if (Platform.OS === "ios") {
      return (
        <View style={styles.blurContainer}>
          <BlurView
            intensity={80}
            style={StyleSheet.absoluteFill}
            tint="light"
          />
        </View>
      );
    }
    return (
      <View
        style={[
          styles.blurContainer,
          { backgroundColor: "rgba(255, 255, 255, 0.95)" },
        ]}
      />
    );
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.slate400,
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: true,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: "Home",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "grid" : "grid-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="studies" // Changed from myschool
        options={{
          title: "Studies",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "book" : "book-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="accounts"
        options={{
          title: "Fees",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "card" : "card-outline"}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="myschool" // Moved to end
        options={{
          title: "My School",
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon
              name={focused ? "school" : "school-outline"}
              color={color}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="institution"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 4,
    left: 20,
    right: 20,
    height: 72,
    borderRadius: 32,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    borderTopWidth: 0,
    backgroundColor: "transparent",
  },
  blurContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 32,
    overflow: "hidden",
    backgroundColor: Platform.OS === "android" ? "white" : undefined,
  },
  tabItem: {
    height: 72,
    paddingTop: 12,
    paddingBottom: 12,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 4,
  },
});
