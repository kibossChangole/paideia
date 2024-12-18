import React from 'react';
import { View } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
    return (
        <ThemedView className="flex-1 p-4">
            <ThemedText className="text-2xl font-bold">Profile</ThemedText>
            {/* Add your profile content here */}
        </ThemedView>
    );
}