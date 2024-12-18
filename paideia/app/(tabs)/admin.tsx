import React, { useState } from 'react';
import { View, TextInput, StyleSheet, Text, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';


const AdminLoginScreen: React.FC = () => {
    const [loginData, setLoginData] = useState<LoginData>({
        username: '',
        password: '',
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [message, setMessage] = useState<string>('');

    const router = useRouter(); // Initialize useRouter

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!loginData.username.trim()) {
            newErrors.username = 'Username is required';
        }

        if (!loginData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof LoginData, value: string) => {
        setLoginData((prev) => ({ ...prev, [field]: value }));
        // Clear error when user starts typing
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = () => {
        if (!validateForm()) {
            setMessage('Please correct the errors before submitting');
            return;
        }

        const { username, password } = loginData;

        // Hardcoded admin credentials
        const adminUsername = 'Boss';
        const adminPassword = 'Godmode';

        if (username === adminUsername && password === adminPassword) {
            setMessage('Login successful');
            // Redirect to the Admin Dashboard on successful login
            router.push('../admin/home');
        } else {
            setMessage('Invalid Admin Username or Password');
        }
    };

    const renderError = (field: keyof LoginData) => (
        errors[field] ? <Text style={styles.error}>{errors[field]}</Text> : null
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <View style={styles.formContainer}>
                <Text style={styles.header}>Admin Portal</Text>
                <Text style={styles.subHeader}>Sign in to continue</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Username</Text>
                    <TextInput
                        style={[styles.input, errors.username && styles.inputError]}
                        placeholder="Enter your username"
                        placeholderTextColor="#A0A0A0"
                        value={loginData.username}
                        onChangeText={(text) => handleInputChange('username', text)}
                    />
                    {renderError('username')}

                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="Enter your password"
                        placeholderTextColor="#A0A0A0"
                        value={loginData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        secureTextEntry={true}
                    />
                    {renderError('password')}
                </View>

                <TouchableOpacity
                    style={styles.loginButton}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                >
                    <Text style={styles.loginButtonText}>Sign In</Text>
                </TouchableOpacity>

                {message && (
                    <Text style={[
                        styles.message,
                        message.includes('Error') || message.includes('Invalid')
                            ? styles.errorMessage
                            : styles.successMessage
                    ]}>
                        {message}
                    </Text>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
    },
    formContainer: {
        flex: 1,
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 150,
    },
    header: {
        fontSize: 32,
        fontWeight: '700',
        color: '#000000',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    subHeader: {
        fontSize: 17,
        color: '#666666',
        marginBottom: 32,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    inputContainer: {
        marginBottom: 24,
    },
    inputLabel: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    input: {
        height: 48,
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        fontSize: 16,
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 3,
            },
            android: {
                elevation: 2,
            },
        }),
    },
    inputError: {
        borderWidth: 1,
        borderColor: '#FF3B30',
        backgroundColor: '#FFF5F5',
    },
    error: {
        color: '#FF3B30',
        fontSize: 13,
        marginTop: -8,
        marginBottom: 16,
        marginLeft: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    loginButton: {
        backgroundColor: '#3497A3',
        height: 50,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
        ...Platform.select({
            ios: {
                shadowColor: '#3497A3',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.2,
                shadowRadius: 8,
            },
            android: {
                elevation: 4,
            },
        }),
    },
    loginButtonText: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    message: {
        marginTop: 16,
        padding: 12,
        borderRadius: 12,
        fontSize: 15,
        textAlign: 'center',
        overflow: 'hidden',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    successMessage: {
        backgroundColor: '#E5F9F6',
        color: '#00966D',
    },
    errorMessage: {
        backgroundColor: '#FFF3F3',
        color: '#FF3B30',
    },
});

export default AdminLoginScreen;