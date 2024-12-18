import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Alert, ScrollView, TouchableOpacity, Platform, FlatList } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { database } from './firebaseConfig';
import { ref, get, set } from 'firebase/database';

interface School {
    name: string;
    schoolCode: string;
    region: string;
}

type FormData = {
    name: string;
    dob: string;
    guardianName: string;
    guardianContact: string;
    region: string;
    schoolCode: string;
    documentation: string | null;
    feeStructure: number;
    password: string;
}

type ValidationErrors = Partial<Record<keyof FormData, string>>;

const SchoolDropdown: React.FC<{ onSelect: (schoolCode: string, region: string) => void; error?: string }> = ({ onSelect, error }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [schools, setSchools] = useState<School[]>([]);
    const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
    const [isDropdownVisible, setIsDropdownVisible] = useState(false);
    const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);

    React.useEffect(() => {
        const fetchSchools = async () => {
            try {
                const schoolsRef = ref(database, 'schools');
                const snapshot = await get(schoolsRef);

                if (snapshot.exists()) {
                    const schoolsData = Object.values(snapshot.val()).map((school: any) => ({
                        name: school.name,
                        schoolCode: school.schoolCode,
                        region: school.region
                    }));
                    setSchools(schoolsData);
                    setFilteredSchools(schoolsData);
                }
            } catch (error) {
                console.error('Error fetching schools:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchSchools();
    }, []);

    React.useEffect(() => {
        if (searchQuery) {
            const filtered = schools.filter(school =>
                school.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                school.schoolCode.includes(searchQuery)
            );
            setFilteredSchools(filtered);
        } else {
            setFilteredSchools(schools);
        }
    }, [searchQuery, schools]);

    const handleSelectSchool = (school: School) => {
        setSelectedSchool(school);
        setSearchQuery(school.name);
        setIsDropdownVisible(false);
        onSelect(school.schoolCode, school.region);
    };

    return (
        <View style={styles.dropdownContainer}>
            <TextInput
                style={[styles.input, error && styles.inputError]}
                placeholder="Search for school..."
                value={searchQuery}
                onChangeText={(text) => {
                    setSearchQuery(text);
                    setIsDropdownVisible(true);
                }}
                onFocus={() => setIsDropdownVisible(true)}
            />

            {error && <Text style={styles.error}>{error}</Text>}

            {isDropdownVisible && (
                <View style={styles.dropdown}>
                    {loading ? (
                        <Text style={styles.dropdownText}>Loading schools...</Text>
                    ) : filteredSchools.length > 0 ? (
                        <ScrollView
                            style={styles.dropdownList}
                            nestedScrollEnabled={true}
                        >
                            {filteredSchools.map((item) => (
                                <TouchableOpacity
                                    key={item.schoolCode}
                                    style={styles.dropdownItem}
                                    onPress={() => handleSelectSchool(item)}
                                >
                                    <Text style={styles.schoolName}>{item.name}</Text>
                                    <Text style={styles.schoolCode}>Code: {item.schoolCode}</Text>
                                </TouchableOpacity>
                            ))}
                        </ScrollView>
                    ) : (
                        <Text style={styles.dropdownText}>No schools found</Text>
                    )}
                </View>
            )}

            {selectedSchool && !isDropdownVisible && (
                <View style={styles.selectedSchool}>
                    <Text style={styles.selectedSchoolText}>
                        Selected: {selectedSchool.name} (Code: {selectedSchool.schoolCode})
                    </Text>
                </View>
            )}
        </View>
    );
};

const RegistrationScreen: React.FC = () => {
    const [formData, setFormData] = useState<FormData>({
        name: '',
        dob: '',
        guardianName: '',
        guardianContact: '',
        region: '',
        schoolCode: '',
        documentation: null,
        feeStructure: 0,
        password: '',
    });

    const [errors, setErrors] = useState<ValidationErrors>({});
    const [message, setMessage] = useState<string>('');

    const validateForm = (): boolean => {
        const newErrors: ValidationErrors = {};

        if (!formData.name.trim()) newErrors.name = 'Name is required';
        if (!formData.guardianName.trim()) newErrors.guardianName = 'Guardian name is required';

        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(formData.dob)) {
            newErrors.dob = 'Invalid date format (YYYY-MM-DD)';
        }

        const phoneRegex = /^\+?[\d\s-]{10,}$/;
        if (!phoneRegex.test(formData.guardianContact)) {
            newErrors.guardianContact = 'Invalid phone number';
        }

        if (!formData.schoolCode) {
            newErrors.schoolCode = 'Please select a school';
        }

        if (!formData.region) {
            newErrors.region = 'Region is required';
        }

        if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters long';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const generateStudentID = (): string => {
        const currentYear = new Date().getFullYear();
        const sequentialNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${formData.region}${formData.schoolCode}${currentYear}${sequentialNumber}`;
    };

    const handleInputChange = (field: keyof FormData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSchoolSelect = (schoolCode: string, region: string) => {
        setFormData(prev => ({
            ...prev,
            schoolCode: schoolCode,
            region: region
        }));
        if (errors.schoolCode || errors.region) {
            setErrors(prev => ({
                ...prev,
                schoolCode: undefined,
                region: undefined
            }));
        }
    };

    const handleUpload = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*']
            });

            if (!result.canceled && result.assets && result.assets[0]) {
                setFormData(prev => ({ ...prev, documentation: result.assets[0].uri }));
                setMessage('Document uploaded successfully');
            }
        } catch (error) {
            setMessage('Error uploading document');
        }
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            setMessage('Please correct the errors before submitting');
            return;
        }

        if (!formData.documentation) {
            setMessage('Please upload required documentation');
            return;
        }

        const studentID = generateStudentID();

        // Check if ID already exists
        const existingRef = ref(database, `students/${studentID}`);
        const snapshot = await get(existingRef);

        if (snapshot.exists()) {
            setMessage('Error: Generated ID already exists. Please try again.');
            return;
        }

        const initialFeeStructure = 5000;

        const registrationData = {
            ...formData,
            id: studentID,
            feeStructure: initialFeeStructure,
            submittedAt: new Date().toISOString(),
        };

        try {
            const studentRef = ref(database, `students/${studentID}`);
            await set(studentRef, registrationData);
            setMessage(`Registration successful! Student ID: ${studentID}`);

            // Reset form after successful submission
            setFormData({
                name: '',
                dob: '',
                guardianName: '',
                guardianContact: '',
                region: '',
                schoolCode: '',
                documentation: null,
                feeStructure: 0,
                password: '',
            });
        } catch (error) {
            console.error(error);
            setMessage('Error registering student. Please try again later.');
        }
    };

    const renderError = (field: keyof FormData) => (
        errors[field] ? <Text style={styles.error}>{errors[field]}</Text> : null
    );

    return (
        <ScrollView contentContainerStyle={styles.container}>
            <Text style={styles.header}>Registration</Text>
            <Text style={styles.subHeader}>Setup your Paideia account</Text>

            <View style={styles.inputContainer}>
                <TextInput
                    style={[styles.input]}
                    placeholder="Student Name"
                    value={formData.name}
                    onChangeText={(text) => handleInputChange('name', text)}
                />
                {renderError('name')}

                <TextInput
                    style={[styles.input]}
                    placeholder="Date of Birth (YYYY-MM-DD)"
                    value={formData.dob}
                    onChangeText={(text) => handleInputChange('dob', text)}
                />
                {renderError('dob')}

                <TextInput
                    style={[styles.input]}
                    placeholder="Guardian Name"
                    value={formData.guardianName}
                    onChangeText={(text) => handleInputChange('guardianName', text)}
                />
                {renderError('guardianName')}

                <TextInput
                    style={[styles.input]}
                    placeholder="Guardian Contact"
                    value={formData.guardianContact}
                    onChangeText={(text) => handleInputChange('guardianContact', text)}
                    keyboardType="phone-pad"
                />
                {renderError('guardianContact')}

                <SchoolDropdown
                    onSelect={handleSchoolSelect}
                    error={errors.schoolCode}
                />

                <TextInput
                    style={[styles.input]}
                    placeholder="Region"
                    value={formData.region}
                    editable={false}
                />
                {renderError('region')}

                <TextInput
                    style={[styles.input]}
                    placeholder="Password"
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
                    secureTextEntry={true}
                />
                {renderError('password')}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={handleUpload}
            >
                <Text style={styles.buttonText}>Upload Documentation</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.button}
                onPress={handleSubmit}
            >
                <Text style={styles.buttonText}>Submit Registration</Text>
            </TouchableOpacity>

            {message && (
                <Text style={[styles.message, message.includes('Error') ? styles.errorMessage : styles.successMessage]}>
                    {message}
                </Text>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flexGrow: 1,
        padding: 25,
        paddingTop: 120,
        backgroundColor: '#FFFFFF',
    },
    header: {
        fontSize: 32,
        fontWeight: 'bold',
        marginBottom: 12,
        color: '#333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    subHeader: {
        fontSize: 17,
        color: '#666666',
        marginBottom: 12,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    inputContainer: {
        marginBottom: 20,
    },
    input: {
        height: 40,
        borderColor: '#ddd',
        borderWidth: 1,
        borderRadius: 5,
        marginTop: 10,
        paddingHorizontal: 10,
        backgroundColor: '#fafafa',
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
    inputError: {
        borderColor: '#ff6b6b',
    },
    error: {
        color: '#ff6b6b',
        fontSize: 12,
        marginTop: 5,
        marginLeft: 5,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    documentStatus: {
        marginVertical: 10,
        fontSize: 14,
        textAlign: 'center',
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
    dropdownContainer: {
        marginTop: 10,
        zIndex: 1000,
    },
    dropdown: {
        position: 'absolute',
        top: 45,
        left: 0,
        right: 0,
        maxHeight: 200,
        backgroundColor: '#fff',
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 5,
        zIndex: 1000,
        ...Platform.select({
            ios: {
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
            },
            android: {
                elevation: 3,
            },
        }),
    },
    dropdownList: {
        maxHeight: 200,
    },
    dropdownItem: {
        padding: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    dropdownText: {
        padding: 10,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    schoolName: {
        fontSize: 14,
        fontWeight: '500',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    schoolCode: {
        fontSize: 12,
        color: '#666',
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    selectedSchool: {
        marginTop: 5,
        padding: 5,
    },
    selectedSchoolText: {
        fontSize: 12,
        color: '#666',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    button: {
        backgroundColor: '#3497A3',
        padding: 12,
        borderRadius: 8,
        marginVertical: 8,
        ...Platform.select({
            ios: {
                shadowColor: '#3497A3',
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
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
});

export default RegistrationScreen;