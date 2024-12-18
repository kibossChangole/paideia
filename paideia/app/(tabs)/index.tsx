import React, { useState, useEffect } from 'react';
import {
    View,
    TextInput,
    StyleSheet,
    Text,
    ScrollView,
    TouchableOpacity,
    Platform,
    Image,
} from 'react-native';
import { database } from './firebaseConfig';
import { ref, get } from 'firebase/database';
import { useRouter, useNavigation } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { Asset } from 'expo-asset';

// Keep splash screen visible while we load resources
SplashScreen.preventAutoHideAsync();

type LoginData = {
    studentID: string;
    password: string;
};

type ValidationErrors = Partial<Record<keyof LoginData, string>>;

export default function Page() {
    const [showSplash, setShowSplash] = useState(true);
    const [loginData, setLoginData] = useState<LoginData>({
        studentID: '',
        password: '',
    });
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [message, setMessage] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const navigation = useNavigation();

    // Handle tab bar visibility and splash screen
    useEffect(() => {
        if (showSplash) {
            // Hide the tab bar when splash screen is showing
            navigation.setOptions({
                tabBarStyle: {
                    display: 'none'
                }
            });
        } else {
            // Restore the original tab bar style when main content is showing
            navigation.setOptions({
                tabBarStyle: {
                    height: Platform.OS === 'ios' ? 88 : 60,
                    backgroundColor: '#FFFFFF',
                    borderTopWidth: 0.5,
                    borderTopColor: '#E5E5E5',
                    paddingBottom: Platform.OS === 'ios' ? 30 : 10,
                    paddingTop: 10,
                    elevation: 0,
                    ...Platform.select({
                        ios: {
                            shadowColor: '#000000',
                            shadowOffset: { width: 0, height: -2 },
                            shadowOpacity: 0.05,
                            shadowRadius: 4,
                        },
                    }),
                }
            });
        }
    }, [showSplash]);

    // Handle splash screen and initial loading
    useEffect(() => {
        async function prepare() {
            try {
                // Load splash screen asset
                await Asset.loadAsync([
                    require('../../assets/images/finalSplash.jpg'),
                ]);

                // Keep splash visible for 2 seconds
                await new Promise(resolve => setTimeout(resolve, 9000));
            } catch (error) {
                console.warn('Error preparing app:', error);
            } finally {
                // Hide splash screen and show main content
                await SplashScreen.hideAsync();
                setShowSplash(false);
            }
        }

        prepare();
    }, []);

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!loginData.studentID.trim()) {
            newErrors.studentID = 'Student ID is required';
        }

        if (!loginData.password.trim()) {
            newErrors.password = 'Password is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof LoginData, value: string) => {
        setLoginData((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setMessage('Please correct the errors before submitting');
            return;
        }

        setIsLoading(true);
        const { studentID, password } = loginData;

        try {
            const studentsRef = ref(database, 'students');
            const snapshot = await get(studentsRef);

            if (snapshot.exists()) {
                const studentsData = snapshot.val();
                const student = Object.values(studentsData).find(
                    (student: any) => student.id === studentID
                );

                if (student) {
                    await AsyncStorage.setItem('studentId', studentID);
                    await AsyncStorage.setItem('studentData', JSON.stringify(student));
                    setMessage('Login successful');
                    router.push('/dashboard/home');
                } else {
                    setMessage('Invalid Student ID or Password');
                }
            } else {
                setMessage('No student data found');
            }
        } catch (error) {
            console.error('Login error:', error);
            setMessage('Error during login. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    const renderError = (field: keyof LoginData) => (
        errors[field] ? <Text style={styles.error}>{errors[field]}</Text> : null
    );

    // Render splash screen
    if (showSplash) {
        return (
            <View style={[styles.splashContainer, styles.fullScreenAbsolute]}>
                <View style={styles.splashContent}>
                    <Image
                        source={require('../../assets/images/finalSplash.jpg')}
                        style={styles.splashLogo}
                        resizeMode="contain"
                    />
                    <Text style={styles.splashtext}>Keep Moving Forward</Text>
                </View>
            </View>
        );
    }

    // Render login screen
    return (
        <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.formContainer}>
                <Text style={styles.header}>Welcome Back</Text>
                <Text style={styles.subHeader}>Sign in to Paideia to continue</Text>

                <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Student ID</Text>
                    <TextInput
                        style={[styles.input, errors.studentID && styles.inputError]}
                        placeholder="Enter your student ID"
                        placeholderTextColor="#A0A0A0"
                        value={loginData.studentID}
                        onChangeText={(text) => handleInputChange('studentID', text)}
                        editable={!isLoading}
                        autoCapitalize="none"
                        keyboardType="default"
                    />
                    {renderError('studentID')}

                    <Text style={styles.inputLabel}>Password</Text>
                    <TextInput
                        style={[styles.input, errors.password && styles.inputError]}
                        placeholder="Enter your password"
                        placeholderTextColor="#A0A0A0"
                        value={loginData.password}
                        onChangeText={(text) => handleInputChange('password', text)}
                        secureTextEntry={true}
                        editable={!isLoading}
                        autoCapitalize="none"
                    />
                    {renderError('password')}
                </View>

                <TouchableOpacity
                    style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
                    onPress={handleSubmit}
                    activeOpacity={0.8}
                    disabled={isLoading}
                >
                    <Text style={styles.loginButtonText}>
                        {isLoading ? 'Signing In...' : 'Sign In'}
                    </Text>
                </TouchableOpacity>

                {message && (
                    <Text style={[
                        styles.message,
                        message.includes('successful') ? styles.successMessage : styles.errorMessage
                    ]}>
                        {message}
                    </Text>
                )}

                <TouchableOpacity
                    onPress={() => router.push('/admin')}
                    style={styles.adminLinkContainer}
                    disabled={isLoading}
                >
                    <Text style={styles.adminLink}>Admin Portal</Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => router.push('/school')}
                    style={styles.adminLinkContainer}
                    disabled={isLoading}
                >
                    <Text style={styles.adminLink}>Institution Portal</Text>
                </TouchableOpacity>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    fullScreenAbsolute: {
        position: 'absolute',
        top: -150,  // Changed from -110 to 0 to ensure full coverage
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1,
    },

    // Main splash container
    splashContainer: {
        flex: 1,
        backgroundColor: '#3497A3',
    },

    // Content wrapper for splash screen
    splashContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center', // Centers the image vertically
        position: 'relative', // Enables absolute positioning of children
    },

    // Logo/image styling
    splashLogo: {
        width: '100%',
        height: '100%', // Takes full height of container
        resizeMode: 'cover', // Ensures image covers the full area
    },

    // Welcome text styling
    splashtext: {
        position: 'absolute',
        bottom: 80, // Positions text from bottom
        width: '100%',
        textAlign: 'center',
        fontSize: 22,
        fontWeight: '100',
        color: '#FFFFFF',
        ...Platform.select({
            ios: {
                fontFamily: 'Sans',
                fontWeight: '300', // Makes it lighter
            },
            android: {
                fontFamily: 'sans-serif-light', // Android's light version of Sans
            },
    
        }),
        /*
        // Optional shadow for better visibility
        textShadowColor: 'rgba(255, 255, 255, 0.75)',
        textShadowOffset: { width: 0, height: 1 },
        textShadowRadius: 2,
        */
    },
    container: {
        flexGrow: 1,
        backgroundColor: '#FFFFFF',
    },
    formContainer: {
        flex: 1,
        padding: 24,
        
        paddingTop: Platform.OS === 'ios' ? 60 : 130,
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
    loginButtonDisabled: {
        opacity: 0.7,
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
    adminLinkContainer: {
        marginTop: 24,
        padding: 12,
        alignItems: 'center',
    },
    adminLink: {
        color: '#3497A3',
        fontSize: 15,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
});