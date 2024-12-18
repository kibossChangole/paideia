import React, { useState } from 'react';
import {
    ScrollView,
    View,
    StyleSheet,
    ActivityIndicator,
    TextInput,
    TouchableOpacity,
    Alert,
    ViewProps,
    TextInputProps,
    TouchableOpacityProps
} from 'react-native';
import type { ViewStyle, TextStyle } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { database } from '../(tabs)/firebaseConfig';
import { ref, push, set, get } from 'firebase/database';

interface CardProps extends ViewProps {
    children: React.ReactNode;
    style?: ViewStyle;
}

interface InputProps extends TextInputProps {
    label: string;
    style?: ViewStyle;
}

interface ButtonProps extends TouchableOpacityProps {
    title: string;
    loading?: boolean;
}

// Reuse existing Card components
const Card: React.FC<CardProps> = ({ children, style, ...props }) => (
    <ThemedView style={[styles.card, style]} {...props}>
        {children}
    </ThemedView>
);

const CardHeader: React.FC<CardProps> = ({ children, style, ...props }) => (
    <ThemedView style={[styles.cardHeader, style]} {...props}>
        {children}
    </ThemedView>
);

const CardTitle: React.FC<CardProps> = ({ children, style, ...props }) => (
    <ThemedText style={[styles.cardTitle, style]} {...props}>
        {children}
    </ThemedText>
);

const CardContent: React.FC<CardProps> = ({ children, style, ...props }) => (
    <ThemedView style={[styles.cardContent, style]} {...props}>
        {children}
    </ThemedView>
);

const Input: React.FC<InputProps> = ({ label, value, onChangeText, placeholder, style, ...props }) => (
    <View style={styles.inputContainer}>
        <ThemedText style={styles.inputLabel}>{label}</ThemedText>
        <TextInput
            style={[styles.input, style]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            {...props}
        />
    </View>
);

const Button: React.FC<ButtonProps> = ({ onPress, title, loading }) => (
    <TouchableOpacity
        style={styles.button}
        onPress={onPress}
        disabled={loading}
    >
        {loading ? (
            <ActivityIndicator color="white" />
        ) : (
            <ThemedText style={styles.buttonText}>{title}</ThemedText>
        )}
    </TouchableOpacity>
);

export default function SchoolRegistration() {
    const [schoolData, setSchoolData] = useState({
        name: '',
        address: '',
        region: '',
        principalName: '',
        contactNumber: '',
        email: '',
    });
    const [loading, setLoading] = useState(false);

    // Generate a random 3-digit school code
    const generateSchoolCode = async () => {
        const schoolsRef = ref(database, 'schools');
        let code;
        let isUnique = false;

        while (!isUnique) {
            // Generate random 3-digit number
            code = Math.floor(Math.random() * 900 + 100).toString();

            // Check if code exists
            const snapshot = await get(ref(database, `schools/${code}`));
            if (!snapshot.exists()) {
                isUnique = true;
            }
        }

        return code;
    };

    const handleSubmit = async () => {
        if (!schoolData.name || !schoolData.region || !schoolData.email) {
            alert('Please fill in all required fields');
            return;
        }

        setLoading(true);
        try {
            const schoolCode = await generateSchoolCode();
            const schoolsRef = ref(database, 'schools');

            // Create new school entry
            const newSchoolRef = push(schoolsRef);
            await set(newSchoolRef, {
                ...schoolData,
                schoolCode,
                registeredAt: new Date().toISOString(),
                active: true
            });

            alert(`School registered successfully!\nSchool Code: ${schoolCode}`);
            // Reset form
            setSchoolData({
                name: '',
                address: '',
                region: '',
                principalName: '',
                contactNumber: '',
                email: '',
            });
        } catch (error) {
            console.error('Error registering school:', error);
            alert('Failed to register school. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ScrollView style={styles.container}>
            <ThemedView style={styles.content}>
                <Card>
                    <CardHeader>
                        <CardTitle>School Registration</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Input
                            label="School Name *"
                            value={schoolData.name}
                            onChangeText={(text) => setSchoolData(prev => ({ ...prev, name: text }))}
                            placeholder="Enter school name"
                        />
                        <Input
                            label="Address"
                            value={schoolData.address}
                            onChangeText={(text) => setSchoolData(prev => ({ ...prev, address: text }))}
                            placeholder="Enter school address"
                        />
                        <Input
                            label="Region *"
                            value={schoolData.region}
                            onChangeText={(text) => setSchoolData(prev => ({ ...prev, region: text }))}
                            placeholder="Enter school region"
                        />
                        <Input
                            label="Principal's Name"
                            value={schoolData.principalName}
                            onChangeText={(text) => setSchoolData(prev => ({ ...prev, principalName: text }))}
                            placeholder="Enter principal's name"
                        />
                        <Input
                            label="Contact Number"
                            value={schoolData.contactNumber}
                            onChangeText={(text) => setSchoolData(prev => ({ ...prev, contactNumber: text }))}
                            placeholder="Enter contact number"
                            keyboardType="phone-pad"
                        />
                        <Input
                            label="Email *"
                            value={schoolData.email}
                            onChangeText={(text) => setSchoolData(prev => ({ ...prev, email: text }))}
                            placeholder="Enter school email"
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                        <Button
                            title="Register School"
                            onPress={handleSubmit}
                            loading={loading}
                        />
                    </CardContent>
                </Card>
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
        paddingTop: 60,
    },
    inputContainer: {
        marginBottom: 16,
        color: '#FFFFFF',
    },
    inputLabel: {
        fontSize: 16,
        marginBottom: 8,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#e5e5e5',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        color: '#FFFFFF'
    },
    button: {
        backgroundColor: '#4a5568',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 24,
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    card: {
        borderRadius: 8,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 8,
    },
    cardHeader: {
        padding: 16,
        paddingBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cardContent: {
        padding: 16,
    },
});