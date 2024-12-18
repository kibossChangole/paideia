import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    Modal,
    TextInput,
    Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, child, get, getDatabase, update } from 'firebase/database';

interface Student {
    id: string;
    name: string;
    dob: string;
    documentation: string;
    feeStructure: number;
    grade: number;  // Changed from optional to required to match DB
    guardianContact: string;
    guardianName: string;
    password: string;
    region: string;
    schoolCode: string;
    submittedAt: string;
    
}

interface SchoolData {
    name: string;
    region: string;
}

const StudentDashboard: React.FC = () => {
    const [students, setStudents] = useState<Student[]>([]);
    const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [newGrade, setNewGrade] = useState('');
    const [updating, setUpdating] = useState(false);

    const grades = ['1', '2', '3', '4', '5', '6', '7', '8']; // Add more grades as needed

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) {
                throw new Error('School ID not found');
            }

            const dbRef = ref(getDatabase());

            // Fetch school data
            const schoolSnapshot = await get(child(dbRef, `schools`));
            if (!schoolSnapshot.exists()) {
                throw new Error('School data not found');
            }

            const schoolsData = schoolSnapshot.val();
            const currentSchool = Object.values(schoolsData).find(
                (school: any) => school.schoolCode === schoolId
            );

            if (!currentSchool) {
                throw new Error('School not found');
            }

            setSchoolData({
                name: currentSchool.name,
                region: currentSchool.region,
            });

            // Fetch students
            const studentsSnapshot = await get(child(dbRef, 'students'));

            if (studentsSnapshot.exists()) {
                const studentsData = studentsSnapshot.val();
                // Map the students data directly since grade is now a property of the student object
                const studentsArray = Object.entries(studentsData)
                    .map(([id, data]: [string, any]) => ({
                        id,
                        ...data
                    }))
                    .filter((student: Student) => student.schoolCode === schoolId);

                setStudents(studentsArray);
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGradeUpdate = async () => {
        if (!selectedStudent || !newGrade) return;

        setUpdating(true);
        try {
            const db = getDatabase();
            // Update grade directly in the student object
            const studentRef = ref(db, `students/${selectedStudent.id}`);

            await update(studentRef, {
                grade: parseInt(newGrade) // Convert to number to match your DB structure
            });

            // Update local state
            setStudents(students.map(student =>
                student.id === selectedStudent.id
                    ? { ...student, grade: parseInt(newGrade) }
                    : student
            ));

            Alert.alert('Success', 'Grade updated successfully');
            setIsModalVisible(false);
            setNewGrade('');
            setSelectedStudent(null);
        } catch (err) {
            console.error('Error updating grade:', err);
            Alert.alert('Error', 'Failed to update grade. Please try again.');
        } finally {
            setUpdating(false);
        }
    };

    const openGradeModal = (student: Student) => {
        setSelectedStudent(student);
        setNewGrade(student.grade || '');
        setIsModalVisible(true);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <ActivityIndicator size="large" color="#3497A3" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.centerContainer}>
                <Text style={styles.errorText}>{error}</Text>
            </View>
        );
    }

    return (
        <ScrollView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.schoolName}>{schoolData?.name}</Text>
                <Text style={styles.regionText}>{schoolData?.region}</Text>
            </View>

            <Text style={styles.sectionTitle}>Students</Text>

            <View style={styles.cardsContainer}>
                {students.length === 0 ? (
                    <Text style={styles.noDataText}>No students found</Text>
                ) : (
                    students.map((student) => (
                        <View key={student.id} style={styles.card}>
                            <Text style={styles.studentName}>{student.name}</Text>
                            <Text style={styles.studentDetails}>ID: {student.id}</Text>
                            <Text style={styles.studentDetails}>Guardian: {student.guardianName}</Text>
                            <Text style={styles.studentDetails}>Contact: {student.guardianContact}</Text>
                            <Text style={styles.studentDetails}>Current Grade: {student.grade || 'Not assigned'}</Text>
                            <Text style={styles.studentDetails}>Fees Balance:</Text>
                            <Text style={styles.studentFee}>
                               KES {student.feeStructure?.toLocaleString()}
                            </Text>

                            <TouchableOpacity
                                style={styles.gradeButton}
                                onPress={() => openGradeModal(student)}
                            >
                                <Text style={styles.gradeButtonText}>
                                    {student.grade ? 'Update Grade' : 'Assign Grade'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </View>

            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalContainer}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>
                            {selectedStudent?.grade ? 'Update Grade' : 'Assign Grade'}
                        </Text>
                        <Text style={styles.modalSubtitle}>
                            Student: {selectedStudent?.name}
                        </Text>

                        <View style={styles.gradePickerContainer}>
                            {grades.map((grade) => (
                                <TouchableOpacity
                                    key={grade}
                                    style={[
                                        styles.gradeOption,
                                        newGrade === grade && styles.gradeOptionSelected
                                    ]}
                                    onPress={() => setNewGrade(grade)}
                                >
                                    <Text style={[
                                        styles.gradeOptionText,
                                        newGrade === grade && styles.gradeOptionTextSelected
                                    ]}>
                                        Grade {grade}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <View style={styles.modalButtons}>
                            <TouchableOpacity
                                style={[styles.modalButton, styles.cancelButton]}
                                onPress={() => setIsModalVisible(false)}
                            >
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.modalButton,
                                    styles.submitButton,
                                    (!newGrade || updating) && styles.disabledButton
                                ]}
                                onPress={handleGradeUpdate}
                                disabled={!newGrade || updating}
                            >
                                <Text style={styles.submitButtonText}>
                                    {updating ? 'Updating...' : 'Update'}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 84,
        backgroundColor: '#3497A3',
    },
    schoolName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    regionText: {
        fontSize: 16,
        color: '#E5F9F6',
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#3497A3',
        borderBottomWidth: 1,
        borderBottomColor: '#3497A3',
        padding: 22,
        paddingBottom:14,
        width: '70%',
        backgroundColor: '#ffffff',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    cardsContainer: {
        padding: 16,
    },
    card: {
        backgroundColor: '#3497A3',
        borderRadius: 12,
        
        
        padding: 16,
        marginBottom: 16,
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
    studentName: {
        fontSize: 21,
        fontWeight: '900',
        color: '#FFFFFF',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    studentDetails: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradeButton: {
        backgroundColor: '#FFFFFF',
        padding: 15,
        borderRadius: 10,
        borderBottomColor:'#3497A3',
        marginTop: 12,
        marginBottom: 1,
        marginLeft:-5,
        marginRight: -5,
        alignItems: 'center',
    },
    gradeButtonText: {
        color: '#3497A3',
        fontSize: 14,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        padding: 24,
        width: '90%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    modalSubtitle: {
        fontSize: 16,
        color: '#666666',
        marginBottom: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradePickerContainer: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'flex-start',
        marginBottom: 24,
    },
    gradeOption: {
        backgroundColor: '#F5F5F5',
        padding: 8,
        borderRadius: 8,
        margin: 4,
        minWidth: 80,
        alignItems: 'center',
    },
    gradeOptionSelected: {
        backgroundColor: '#3497A3',
    },
    gradeOptionText: {
        color: '#666666',
        fontSize: 14,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradeOptionTextSelected: {
        color: '#FFFFFF',
        fontWeight: '600',
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    modalButton: {
        padding: 12,
        borderRadius: 8,
        minWidth: 100,
        alignItems: 'center',
        marginLeft: 12,
    },

    studentFee:{
        color: '#FF6347' ,
        fontWeight:500,
        fontSize:16,
    },
    submitButton: {
        backgroundColor: '#3497A3',
    },
    cancelButton: {
        backgroundColor: '#F5F5F5',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    cancelButtonText: {
        color: '#666666',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    disabledButton: {
        opacity: 0.5,
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
        padding: 24,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    noDataText: {
        fontSize: 16,
        color: '#666666',
        textAlign: 'center',
        padding: 24,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
});

export default StudentDashboard;