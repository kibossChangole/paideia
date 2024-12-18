import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useRouter } from 'expo-router';

interface SchoolData {
    name: string;
    region: string;
}

export default function GradeDashboard() {
    const router = useRouter();
    const [schoolData, setSchoolData] = useState<SchoolData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');
    const [studentCounts, setStudentCounts] = useState<{ [key: number]: number }>({});
    const grades = [1, 2, 3, 4, 5, 6, 7, 8];

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
            const schoolSnapshot = await get(child(dbRef, 'schools'));
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

            // Fetch student counts per grade
            const studentsSnapshot = await get(child(dbRef, 'students'));
            if (studentsSnapshot.exists()) {
                const studentsData = studentsSnapshot.val();
                const counts = grades.reduce((acc, grade) => {
                    const count = Object.values(studentsData).filter(
                        (student: any) => student.schoolCode === schoolId && student.grade === grade
                    ).length;
                    return { ...acc, [grade]: count };
                }, {});
                setStudentCounts(counts);
            }

        } catch (err) {
            console.error('Error fetching data:', err);
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const handleGradePress = (grade: number) => {
        router.push({
            pathname: "./classlist",
            params: {
                grade,
                schoolName: schoolData?.name,
                studentCount: studentCounts[grade] || 0
            }
        });
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
                <Text style={styles.schoolName}>{schoolData?.name}</Text>
                <Text style={styles.regionText}>{schoolData?.region}</Text>
            </View>

            <ScrollView contentContainerStyle={styles.scrollContent}>
                <Text style={styles.sectionTitle}>Grade Panel</Text>

                <View style={styles.gradeGrid}>
                    {grades.map((grade) => (
                        <TouchableOpacity
                            key={grade}
                            style={styles.gradeCard}
                            onPress={() => handleGradePress(grade)}
                            activeOpacity={0.7}
                        >
                            <View style={styles.gradeIconContainer}>
                                <Text style={styles.gradeNumber}>{grade}</Text>
                                <Text style={styles.gradeText}>Grade {grade}</Text>
                            </View>
                            <View style={styles.studentCountContainer}>
                                <Text style={styles.studentCount}>
                                    {studentCounts[grade] || 0}
                                </Text>
                                <Text style={styles.studentCountLabel}>
                                    {studentCounts[grade] === 1 ? 'Student' : 'Students'}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

const windowWidth = Dimensions.get('window').width;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FFFFFF',
    },
    scrollContent: {
        flexGrow: 1,
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
        paddingBottom: 14,
        width: '70%',
        backgroundColor: '#ffffff',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        padding: 16,
        justifyContent: 'space-between',
    },
    gradeCard: {
        width: (windowWidth - 48) / 2,
        height: 160,
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        margin: 4,
        padding: 16,
        justifyContent: 'space-between',
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
    gradeIconContainer: {
        alignItems: 'center',
    },
    gradeNumber: {
        fontSize: 36,
        fontWeight: '700',
        color: '#3497A3',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    gradeText: {
        fontSize: 16,
        color: '#666666',
        marginTop: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    studentCountContainer: {
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 8,
    },
    studentCount: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    studentCountLabel: {
        fontSize: 12,
        color: '#666666',
        marginTop: 2,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    errorText: {
        color: '#FF3B30',
        fontSize: 16,
        textAlign: 'center',
        padding: 24,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
});