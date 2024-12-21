import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    Platform,
    ActivityIndicator,
    TouchableOpacity,
    Dimensions,
    Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AttendanceTab from './components/attendancetab';
import GradesTab from './components/gradestab';
import DiaryTab from './components/diarytab';

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

type TabType = 'students' | 'attendance' | 'grades' | 'diary';

export default function ClassList() {
    const router = useRouter();
    const params = useLocalSearchParams();
const currentGrade = Number(params.grade);
const initialTab = params.activeTab as TabType || 'students';
const [activeTab, setActiveTab] = useState<TabType>(initialTab);

    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string>('');

    useEffect(() => {
        fetchGradeStudents();
    }, [currentGrade]);

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
                const gradeStudents = Object.entries(studentsData)
                    .map(([id, data]: [string, any]) => ({
                        id,
                        ...data
                    }))
                    .filter((student: Student) =>
                        student.schoolCode === schoolId && student.grade === currentGrade
                    );

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

    const renderTabContent = () => {
        switch (activeTab) {
            case 'students':
                return (
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
                                            <Text style={styles.studentDetails}>Fee Balance:</Text>
                                            <Text style={styles.studentFee}>
                                                KES {student.feeStructure?.toLocaleString()}
                                            </Text>
                                        </View>
                                    </View>
                                ))
                            )}
                        </View>
                    </ScrollView>
                );
            case 'attendance':
                return <AttendanceTab currentGrade={currentGrade} />;
            case 'grades':
                return <GradesTab currentGrade={currentGrade} />;
            case 'diary':
                return <DiaryTab currentGrade={currentGrade} />;
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
                <Image
                    source={require('../../assets/images/PaideiaMini.png')}
                    style={styles.headerIcon}
                />
            </View>

            <View style={styles.tabContainer}>
                {(['students', 'attendance', 'grades', 'diary'] as TabType[]).map((tab) => (
                    <TouchableOpacity
                        key={tab}
                        style={[
                            styles.tab,
                            activeTab === tab && styles.activeTab
                        ]}
                        onPress={() => setActiveTab(tab)}
                    >
                        <Text style={[
                            styles.tabText,
                            activeTab === tab && styles.activeTabText
                        ]}>
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            {renderTabContent()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#3497A3',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    header: {
        padding: 24,
        paddingTop: Platform.OS === 'ios' ? 60 : 59,
        backgroundColor: '#3497A3',
    },
    headerContent: {

        flexDirection: 'row',
        alignItems: 'center',

    },
    headerIcon: {
        position: 'absolute',
        width: 120,
        height: 120,
        bottom: 10,
        right: 0,
    },
    headerTextContainer: {
        marginLeft: 5,
        flex: 1,
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: '#FFFFFF',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    tab: {
        margin:3,
        flex: 1,
        paddingVertical: 16,
        alignItems: 'center',
        
    },
    activeTab: {
        borderBottomWidth: 3,
        borderColor:'#3497A3',
        
        
    },
    tabText: {
        fontSize: 16,
        color: '#666666',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    activeTabText: {
        color: '#3497A3',
        fontWeight: '600',
    },
    placeholderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    placeholderText: {
        fontSize: 16,
        color: '#666666',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
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
        marginTop:10,
    },
    studentCard: {
        backgroundColor: '#3497A3',
        borderRadius: 12,
        borderWidth:0,
        borderColor: '#FFFFFF',
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
        color: '#ffffff',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    studentDetails: {
        fontSize: 14,
        color: '#FFFFFF',
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