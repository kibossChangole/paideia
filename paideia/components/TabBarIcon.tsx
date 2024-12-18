import { Ionicons } from '@expo/vector-icons';
import { View, TextInput, Button, StyleSheet, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';

type IconName = React.ComponentProps<typeof Ionicons>['name'];
export function TabBarIcon(props: {
    name: React.ComponentProps<typeof Ionicons>['name'];
    color: string;
}) {
    return (
        <Ionicons
            size={Platform.OS === 'ios' ? 24 : 22}
            style={{ marginBottom: -3 }}
            {...props}
        />
    );
}