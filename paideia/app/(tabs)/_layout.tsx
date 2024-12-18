import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';

import { TabBarIcon } from '@/components/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colorScheme === 'dark' ? '#3497A3' : '#3497A3',
        tabBarInactiveTintColor: colorScheme === 'dark' ? '#8E8E93' : '#8E8E93',
        headerShown: false,
        tabBarStyle: {
          height: Platform.OS === 'ios' ? 88 : 60,
          backgroundColor: colorScheme === 'dark' ? '#ffffff' : '#FFFFFF',
          borderTopWidth: 0.5,
          borderTopColor: colorScheme === 'dark' ? '#38383A' : '#E5E5E5',
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
          elevation: 0,
          ...Platform.select({
            ios: {
              shadowColor: colorScheme === 'dark' ? '#000000' : '#000000',
              shadowOffset: { width: 0, height: -2 },
              shadowOpacity: colorScheme === 'dark' ? 0.2 : 0.05,
              shadowRadius: 4,
            },
          }),
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
          fontWeight: '500',
          paddingBottom: Platform.OS === 'ios' ? 0 : 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarButton: (props) => (
          <TouchableOpacity
            {...props}
            activeOpacity={0.7}
            style={[
              props.style,
              {
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
              },
            ]}
          />
        ),
      }}>
      {/* Login Tab */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Login',
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={{
                opacity: focused ? 1 : 0.8,
              }}
            >
              <TabBarIcon
                name={focused ? 'log-in' : 'log-in-outline'}
                color={color}
              />
            </Animated.View>
          ),
        }}
      />

      {/* Registration Tab */}
      <Tabs.Screen
        name="registration"
        options={{
          title: 'Register',
          tabBarIcon: ({ color, focused }) => (
            <Animated.View
              style={{
                opacity: focused ? 1 : 0.8,
              }}
            >
              <TabBarIcon
                name={focused ? 'person-add' : 'person-add-outline'}
                color={color}
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
    </Tabs>

    
  );
}