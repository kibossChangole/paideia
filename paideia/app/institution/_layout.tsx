import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, TouchableOpacity } from 'react-native';
import Animated from 'react-native-reanimated';

import { TabBarIcon } from '@/components/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function DashboardLayout() {
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
            <Tabs.Screen
                name="home"
                options={{
                    title: 'Home',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="students"
                options={{
                    title: 'Our Students',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'school' : 'school-outline'} color={color} />
                    ),
                }}
            />


           
            <Tabs.Screen
                name="classrooms"
                options={{
                    title: 'Classrooms',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="accounts"
                options={{
                    title: 'Accounts',
                    tabBarIcon: ({ color, focused }) => (
                        <TabBarIcon name={focused ? 'bar-chart' : 'bar-chart-outline'} color={color} />
                    ),
                }}
            />

            <Tabs.Screen
                name="classlist"
                options={{
                    href: null, // This hides it from the tab bar
                }}
            />
            <Tabs.Screen
                name="components/attendancetab"
                options={{
                    href: null, // This hides it from the tab bar
                }}
            />
            <Tabs.Screen
                name="components/gradestab"
                options={{
                    href: null, // This hides it from the tab bar
                }}
            />
        </Tabs>
    );
}