import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useLocalSearchParams, useRouter } from 'expo-router';

interface Student {
    id: string;
    name: string;
    dob: string;
    documentation: string;
    feeStructure: number;
    grade: number;
    guardianContact: string;
    guardianName: string;
    password: string;
    region: string;
    schoolCode: string;
    submittedAt: string;
}

export default function ClassList() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const currentGrade = Number(params.grade);

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchGradeStudents();
    }, [currentGrade]); // Add currentGrade as dependency

    const fetchGradeStudents = async () => {
        try {
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) {
                throw new Error('School ID not found');
            }

            const dbRef = ref(getDatabase());
            const studentsSnapshot = await get(child(dbRef, 'students'));

            if (studentsSnapshot.exists()) {
                const studentsData = studentsSnapshot.val();

                // Log for debugging
                console.log('Current Grade:', currentGrade);

                const gradeStudents = Object.entries(studentsData)
                    .map(([id, data]: [string, any]) => ({
                        id,
                        ...data
                    }))
                    .filter((student: Student) => {
                        // Verify both conditions
                        const isInSchool = student.schoolCode === schoolId;
                        const isInGrade = student.grade === currentGrade;

                        // Log for debugging
                        console.log('Student:', student.name, 'Grade:', student.grade, 'Match:', isInGrade);

                        return isInSchool && isInGrade;
                    });

                setStudents(gradeStudents);
            } else {
                setStudents([]);
            }
        } catch (err) {
            console.error('Error fetching grade students:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
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
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => router.push('./classrooms')}
                >
                    <Text style={styles.backButtonText}>← Back</Text>
                </TouchableOpacity>
                <Text style={styles.gradeTitleText}>Grade {currentGrade} Students</Text>
                <Text style={styles.studentCountText}>
                    {students.length} {students.length === 1 ? 'Student' : 'Students'}
                </Text>
            </View>

            <ScrollView style={styles.scrollView}>
                <View style={styles.cardsContainer}>
                    {students.length === 0 ? (
                        <Text style={styles.noDataText}>No students found in Grade {currentGrade}</Text>
                    ) : (
                        students.map((student) => (
                            <View key={student.id} style={styles.studentCard}>
                                <Text style={styles.studentName}>{student.name}</Text>
                                <Text style={styles.studentDetails}>ID: {student.id}</Text>
                                <Text style={styles.studentDetails}>
                                    Guardian: {student.guardianName}
                                </Text>
                                <Text style={styles.studentDetails}>
                                    Contact: {student.guardianContact}
                                </Text>
                                <View style={styles.feeContainer}>
                                    <Text style={styles.studentDetails}>Fees Balance:</Text>
                                    <Text style={styles.studentFee}>
                                        KES {student.feeStructure?.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </View>
    );
}

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
    backButton: {
        marginBottom: 16,
    },
    backButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradeTitleText: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    studentCountText: {
        fontSize: 16,
        color: '#E5F9F6',
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    scrollView: {
        flex: 1,
    },
    cardsContainer: {
        padding: 16,
    },
    studentCard: {
        backgroundColor: '#FFFFFF',
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
        fontSize: 18,
        fontWeight: '600',
        color: '#333333',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    studentDetails: {
        fontSize: 14,
        color: '#666666',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    feeContainer: {
        marginTop: 8,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
        paddingTop: 8,
    },
    studentFee: {
        color: '#FF6347',
        fontWeight: '500',
        fontSize: 16,
        marginTop: 2,
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