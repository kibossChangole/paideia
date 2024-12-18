import React, { useState, useEffect } from 'react';
import { View, TextInput, StyleSheet, ScrollView, TouchableOpacity, Platform, ActivityIndicator } from 'react-native';
import { database } from '../(tabs)/firebaseConfig';
import { ref, update, get } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ThemedText } from '@/components/ThemedText';

type BioData = {
    gender: string;
    residentialArea: string;
    transportationMeans: string;
    allergies: string;
    chronicConditions: string;
    emergencyContact: {
        name: string;
        relationship: string;
        contact: string;
    };
};

type ValidationErrors = Partial<Record<keyof BioData | 'emergencyContactName' | 'emergencyContactRelationship' | 'emergencyContactNumber', string>>;

const BioDataScreen: React.FC = () => {
    const [formData, setFormData] = useState<BioData>({
        gender: '',
        residentialArea: '',
        transportationMeans: '',
        allergies: '',
        chronicConditions: '',
        emergencyContact: {
            name: '',
            relationship: '',
            contact: '',
        }
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [message, setMessage] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        fetchExistingBioData();
    }, []);

    const fetchExistingBioData = async () => {
        try {
            const studentId = await AsyncStorage.getItem('studentId');
            if (!studentId) {
                setError('No student ID found. Please login again.');
                setLoading(false);
                router.push('/');
                return;
            }

            const bioDataRef = ref(database, `students/${studentId}/bioData`);
            const snapshot = await get(bioDataRef);

            if (snapshot.exists()) {
                const bioData = snapshot.val();
                setFormData(bioData);
            }
        } catch (error) {
            console.error('Error fetching bio data:', error);
            setMessage('Error loading existing bio data');
        } finally {
            setLoading(false);
        }
    };

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!formData.gender.trim()) newErrors.gender = 'Gender is required';
        if (!formData.residentialArea.trim()) newErrors.residentialArea = 'Residential area is required';
        if (!formData.transportationMeans.trim()) newErrors.transportationMeans = 'Transportation means is required';

        if (!formData.emergencyContact.name.trim()) {
            newErrors.emergencyContactName = 'Emergency contact name is required';
        }
        if (!formData.emergencyContact.relationship.trim()) {
            newErrors.emergencyContactRelationship = 'Relationship is required';
        }

        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(formData.emergencyContact.contact)) {
            newErrors.emergencyContactNumber = 'Invalid phone number';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof BioData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleEmergencyContactChange = (field: keyof typeof formData.emergencyContact, value: string) => {
        setFormData(prev => ({
            ...prev,
            emergencyContact: {
                ...prev.emergencyContact,
                [field]: value
            }
        }));
        const errorField = `emergencyContact${field.charAt(0).toUpperCase() + field.slice(1)}` as keyof ValidationErrors;
        if (errors[errorField]) {
            setErrors(prev => ({ ...prev, [errorField]: undefined }));
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setMessage('Please correct the errors before submitting');
            return;
        }

        try {
            const studentId = await AsyncStorage.getItem('studentId');
            if (!studentId) {
                setMessage('No student ID found. Please login again.');
                router.push('/');
                return;
            }

            const bioDataRef = ref(database, `students/${studentId}/bioData`);
            await update(bioDataRef, formData);
            setMessage('Bio data updated successfully!');
        } catch (error) {
            console.error(error);
            setMessage('Error updating bio data. Please try again later.');
        }
    };

    const renderError = (field: keyof ValidationErrors) => (
        errors[field] ? <ThemedText style={styles.error}>{errors[field]}</ThemedText> : null
    );

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.loadingContainer}>
                <ThemedText style={styles.errorText}>{error}</ThemedText>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
            <View style={styles.content}>
                <ThemedText style={styles.header}>Student Bio Data</ThemedText>
                <ThemedText style={styles.subHeader}>Additional Information</ThemedText>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>Personal Details</ThemedText>
                    </View>
                    <View style={styles.cardContent}>
                        <TextInput
                            style={[styles.input]}
                            placeholder="Gender"
                            value={formData.gender}
                            onChangeText={(text) => handleInputChange('gender', text)}
                            placeholderTextColor="#666666"
                        />
                        {renderError('gender')}

                        <TextInput
                            style={[styles.input]}
                            placeholder="Residential Area"
                            value={formData.residentialArea}
                            onChangeText={(text) => handleInputChange('residentialArea', text)}
                            placeholderTextColor="#666666"
                        />
                        {renderError('residentialArea')}

                        <TextInput
                            style={[styles.input]}
                            placeholder="Transportation Means"
                            value={formData.transportationMeans}
                            onChangeText={(text) => handleInputChange('transportationMeans', text)}
                            placeholderTextColor="#666666"
                        />
                        {renderError('transportationMeans')}
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>Health Information</ThemedText>
                    </View>
                    <View style={styles.cardContent}>
                        <TextInput
                            style={[styles.input]}
                            placeholder="Allergies (if any)"
                            value={formData.allergies}
                            onChangeText={(text) => handleInputChange('allergies', text)}
                            multiline
                            placeholderTextColor="#666666"
                        />

                        <TextInput
                            style={[styles.input, styles.multilineInput]}
                            placeholder="Chronic Conditions (if any)"
                            value={formData.chronicConditions}
                            onChangeText={(text) => handleInputChange('chronicConditions', text)}
                            multiline
                            placeholderTextColor="#666666"
                        />
                    </View>
                </View>

                <View style={styles.card}>
                    <View style={styles.cardHeader}>
                        <ThemedText style={styles.cardTitle}>Emergency Contact</ThemedText>
                    </View>
                    <View style={styles.cardContent}>
                        <TextInput
                            style={[styles.input]}
                            placeholder="Emergency Contact Name"
                            value={formData.emergencyContact.name}
                            onChangeText={(text) => handleEmergencyContactChange('name', text)}
                            placeholderTextColor="#666666"
                        />
                        {renderError('emergencyContactName')}

                        <TextInput
                            style={[styles.input]}
                            placeholder="Relationship to Student"
                            value={formData.emergencyContact.relationship}
                            onChangeText={(text) => handleEmergencyContactChange('relationship', text)}
                            placeholderTextColor="#666666"
                        />
                        {renderError('emergencyContactRelationship')}

                        <TextInput
                            style={[styles.input]}
                            placeholder="Emergency Contact Number"
                            value={formData.emergencyContact.contact}
                            onChangeText={(text) => handleEmergencyContactChange('contact', text)}
                            keyboardType="phone-pad"
                            placeholderTextColor="#666666"
                        />
                        {renderError('emergencyContactNumber')}
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.button}
                    onPress={handleSubmit}
                >
                    <ThemedText style={styles.buttonText}>Update Bio Data</ThemedText>
                </TouchableOpacity>

                {message && (
                    <ThemedText style={[styles.message, message.includes('Error') ? styles.errorMessage : styles.successMessage]}>
                        {message}
                    </ThemedText>
                )}
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3497A3',
    },
    scrollContent: {
        flexGrow: 1,
        paddingBottom: 0,
    },
    content: {
        padding: 16,
        marginTop: -40,
        backgroundColor: '#3497A3',
        paddingTop: Platform.OS === 'ios' ? 48 : 100,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    subHeader: {
        fontSize: 16,
        color: '#FFFFFF',
        marginBottom: 24,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    card: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.08,
                shadowRadius: 8,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    cardHeader: {
        backgroundColor: '#3497A3',
    },
    cardTitle: {
        fontSize: 19,
        fontWeight: '900',
        color: '#FFFFFF',
        backgroundColor: '#3497A3',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    cardContent: {
        backgroundColor: '#FFFFFF',
        padding: 16,
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        marginVertical: 8,
        paddingHorizontal: 10,
        backgroundColor: '#fafafa',
        color: '#333333',
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.05,
                shadowRadius: 2,
            },
            android: {
                elevation: 1,
            },
        }),
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
        paddingTop: 10,
    },
    error: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: -4,
        marginLeft: 5,
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    message: {
        marginTop: 20,
        padding: 10,
        borderRadius: 5,
        textAlign: 'center',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    successMessage: {
        backgroundColor: '#d4edda',
        color: '#155724',
    },
    errorMessage: {
        backgroundColor: '#f8d7da',
        color: '#721c24',
    },
    button: {
        backgroundColor: '#FFFFFF',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.2,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    buttonText: {
        color: '#3497A3',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3497A3',
    },
    errorText: {
        fontSize: 16,
        color: '#FFEBEE',
        textAlign: 'center',
        padding: 20,
    },
});

export default BioDataScreen;