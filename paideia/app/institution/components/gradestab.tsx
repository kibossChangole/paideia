import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface GradesTabProps {
    currentGrade: number;
}

export default function GradesTab({ currentGrade }: GradesTabProps) {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Grade {currentGrade} Reports</Text>
            {/* Add your grades reporting UI here */}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    title: {
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    }
});