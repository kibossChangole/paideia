import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, View, StyleSheet, Platform, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { database } from '../(tabs)/firebaseConfig';
import { ref, child, get, getDatabase } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Types
type Student = {
    id: string;
    name: string;
    dob: string;
    guardianName: string;
    guardianContact: string;
    region: string;
    schoolCode: string;
    feeStructure: number;
    submittedAt: string;
    documentation: string;
    password: string;
};

type School = {
    name: string;
    schoolCode: string;
    region: string;
};

// Card Components
const Card: React.FC<{ children: React.ReactNode, style?: any }> = ({ children, style }) => (
    <View style={[styles.card, style]}>
        {children}
    </View>
);

const CardHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.cardHeader}>
        {children}
    </View>
);

const CardContent: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <View style={styles.cardContent}>
        {children}
    </View>
);

export default function StudentDashboard() {
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [schoolName, setSchoolName] = useState<string>('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const fetchSchoolName = async (schoolCode: string) => {
        try {
            const dbRef = ref(getDatabase());
            const snapshot = await get(child(dbRef, 'schools'));

            if (snapshot.exists()) {
                const schools = Object.values(snapshot.val()) as School[];
                const school = schools.find(s => s.schoolCode === schoolCode);
                if (school) {
                    setSchoolName(school.name);
                } else {
                    setSchoolName('School not found');
                }
            }
        } catch (error) {
            console.error('Error fetching school name:', error);
            setSchoolName('Error loading school name');
        }
    };

    const fetchUserData = async () => {
        try {
            const studentId = await AsyncStorage.getItem('studentId');
            if (!studentId) {
                setError('No student ID found. Please login again.');
                setLoading(false);
                router.push('/');
                return;
            }

            const studentsRef = ref(database, 'students');
            const snapshot = await get(studentsRef);

            if (snapshot.exists()) {
                const students = snapshot.val();
                const student = Object.values(students).find(
                    (s: any) => s.id === studentId
                ) as Student;

                if (student) {
                    setStudentData(student);
                    fetchSchoolName(student.schoolCode);
                } else {
                    setError('Student not found');
                    router.push('/');
                }
            } else {
                setError('No student data available');
            }
        } catch (error) {
            console.error('Error fetching user data:', error);
            setError('Error loading student data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchUserData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchUserData();
    };

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

    const ProfileCard = () => (
    
                <View style={styles.profileHeader}>
                    <View style={styles.imageContainer}>
                        <Image
                            source={{ uri: "https://cdn.pixabay.com/photo/2020/10/16/05/41/student-5658577_1280.png" }}
                            style={styles.schoolImage}
                        />
                    </View>
                    <View style={styles.profileInfo}>
                        <ThemedText style={styles.profileName}>
                            {studentData?.name}
                        </ThemedText>
                        <View style={styles.statusContainer}>
                            <View style={[styles.statusBadge, { backgroundColor: '#E8F5E9' }]}>
                                <ThemedText style={[styles.statusText, { color: '#2E7D32' }]}>
                                    Active Student
                                </ThemedText>
                            </View>
                        </View>
                    </View>
                </View>
        
    );

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#FFFFFF"
                />
            }
        >
            <View style={styles.content}>
                <ProfileCard />

                <Card>
                    <CardHeader>
                        <ThemedText style={styles.cardTitle}>Student Details</ThemedText>
                    </CardHeader>
                    <CardContent>
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Date of Birth</ThemedText>
                            <ThemedText style={styles.detailValue}>
                                {studentData?.dob}
                            </ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Guardian Name</ThemedText>
                            <ThemedText style={styles.detailValue}>
                                {studentData?.guardianName}
                            </ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Guardian Contact</ThemedText>
                            <ThemedText style={styles.detailValue}>
                                {studentData?.guardianContact}
                            </ThemedText>
                        </View>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <ThemedText style={styles.cardTitle}>School Information</ThemedText>
                    </CardHeader>
                    <CardContent>
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>School Name</ThemedText>
                            <ThemedText style={styles.detailValue}>
                                {schoolName || 'Loading...'}
                            </ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>Region</ThemedText>
                            <ThemedText style={styles.detailValue}>
                                {studentData?.region}
                            </ThemedText>
                        </View>
                        <View style={styles.detailRow}>
                            <ThemedText style={styles.detailLabel}>School Code</ThemedText>
                            <ThemedText style={styles.detailValue}>
                                {studentData?.schoolCode}
                            </ThemedText>
                        </View>
                    </CardContent>
                </Card>

                <Card style={styles.feesCard}>
                    <CardHeader>
                        <ThemedText style={styles.cardTitle}>Fee Balance</ThemedText>
                    </CardHeader>
                    <CardContent>
                        <ThemedText style={styles.feeAmount}>
                            KES {studentData?.feeStructure?.toLocaleString()}
                        </ThemedText>
                    </CardContent>
                </Card>
            </View>
        </ScrollView>
    );
}

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
        marginTop:-40,
        backgroundColor: '#3497A3',
     
        paddingTop: Platform.OS === 'ios' ? 48 : 100,
    },
    profileHeader: {
    
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingHorizontal: 16,
        paddingVertical: 24,
        backgroundColor: '#3497A3',
        position: 'relative',
    },
    imageContainer: {
        width: 100,
        height: 100,
        borderRadius: 50,
        marginRight: 16,
        backgroundColor: '#f3f4f6',
        overflow: 'hidden',
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
    schoolImage: {
        width: '100%',
        height: '100%',
    },
    profileInfo: {
        flex: 1,
        
        paddingTop: 8,
    },
    profileName: {
        fontSize: 24,
        fontWeight: '700',
        color: '#FFFFFF',
        marginBottom: 4,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    statusContainer: {
        backgroundColor: 'transparent',
        marginTop: 4,
    },
    statusBadge: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
        marginTop: 2,
    },
    statusText: {
        fontSize: 12,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fontWeight: '500',
        letterSpacing: 0.2,
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
        color: '#ffffff',

        backgroundColor: '#3497A3',
        padding: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    cardContent: {
        backgroundColor: '#3497A3',
        padding: 24,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F0F0F0',
    },
    detailLabel: {
        fontSize: 15,
        fontWeight: '900',
        color: '#FFFFFF',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        color: '#FFFFFF',
        fontWeight: '200',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        flex: 2,
        textAlign: 'right',
    },
    feesCard: {
        marginBottom: 50,
    },
    feeAmount: {
        marginTop: 10,
        padding: 20,
        fontSize: 32,
        fontWeight: 'bold',
        textAlign: 'center',
        color: '#FFFFFF',
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