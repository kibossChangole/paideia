import { Tabs } from "expo-router";
import React from "react";
import { Platform, TouchableOpacity, View, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";

import { TabBarIcon } from "@/components/TabBarIcon";
import { useColorScheme } from "@/hooks/useColorScheme";

const COLORS = {
  primaryTeal: "#14b8a6",
  warmGray: "#94a3b8",
  white: "#ffffff",
  softBg: "#fcfcfd",
  slate100: "#f1f5f9",
};

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: COLORS.primaryTeal,
        tabBarInactiveTintColor: COLORS.warmGray,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          bottom: 24,
          left: 24,
          right: 24,
          height: 72,
          backgroundColor: COLORS.white,
          borderRadius: 24,
          borderTopWidth: 0,
          elevation: 5,
          shadowColor: COLORS.primaryTeal,
          shadowOffset: { width: 0, height: 10 },
          shadowOpacity: 0.15,
          shadowRadius: 20,
          paddingBottom: 0, // Reset padding
          alignItems: "center",
          justifyContent: "center",
        },
        tabBarShowLabel: false, // Hide labels for cleaner look
        tabBarItemStyle: {
          height: "100%",
          justifyContent: "center",
          alignItems: "center",
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={[
              props.style,
              {
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              },
            ]}
          />
        ),
      }}
    >
      {/* Login Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Login",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <TabBarIcon
                name={focused ? "log-in" : "log-in-outline"}
                color={focused ? COLORS.white : color}
                style={{ marginBottom: 0 }}
              />
            </Animated.View>
          ),
        }}
      />

      {/* Registration Tab */}
      <Tabs.Screen
        name="registration"
        options={{
          title: "Register",
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={[
                styles.iconContainer,
                focused && styles.activeIconContainer,
              ]}
            >
              <TabBarIcon
                name={focused ? "person-add" : "person-add-outline"}
                color={focused ? COLORS.white : color}
                style={{ marginBottom: 0 }}
              />
            </Animated.View>
          ),
        }}
      />

      {/* Admin Tab - Hidden from navigation */}
      <Tabs.Screen
        name="admin"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />

      <Tabs.Screen
        name="school"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />

      <Tabs.Screen
        name="firebaseConfig"
        options={{
          href: null, // This hides it from the tab bar
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconContainer: {
    backgroundColor: COLORS.primaryTeal,
    shadowColor: COLORS.primaryTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
