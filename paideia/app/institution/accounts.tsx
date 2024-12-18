import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, View, ViewProps, StyleSheet, Platform, Image } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { database } from '../(tabs)/firebaseConfig';
import { ref, onValue, DataSnapshot } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Card Components
const Card: React.FC<ViewProps> = ({ children, style, ...props }) => (
    <ThemedView style={[styles.card, style]} {...props}>
        {children}
    </ThemedView>
);

const CardHeader: React.FC<ViewProps> = ({ children, style, ...props }) => (
    <ThemedView style={[styles.cardHeader, style]} {...props}>
        {children}
    </ThemedView>
);

const CardTitle: React.FC<ViewProps> = ({ children, style, ...props }) => (
    <ThemedText style={[styles.cardTitle, style]} {...props}>
        {children}
    </ThemedText>
);

const CardContent: React.FC<ViewProps> = ({ children, style, ...props }) => (
    <ThemedView style={[styles.cardContent, style]} {...props}>
        {children}
    </ThemedView>
);

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
};

type DashboardStats = {
    totalStudents: number;
    totalFees: number;
    regionBreakdown: Record<string, number>;
    schoolCode: string | null;
};

// Main Component
export default function HomeScreen() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalFees: 0,
        regionBreakdown: {},
        schoolCode: null
    });

    const fetchData = async () => {
        try {
            // Get school ID from AsyncStorage
            const schoolId = await AsyncStorage.getItem('schoolId');

            if (!schoolId) {
                setError('No school ID found. Please login again.');
                setLoading(false);
                return;
            }

            // Reference to all students
            const studentsRef = ref(database, 'students');

            onValue(studentsRef, (snapshot: DataSnapshot) => {
                const data = snapshot.val();
                if (data) {
                    // Filter students for the specific school
                    const allStudents = Object.values(data) as Student[];
                    const schoolStudents = allStudents.filter(
                        student => student.schoolCode === schoolId
                    );

                    setStudents(schoolStudents);

                    // Calculate stats for school-specific students
                    const stats = schoolStudents.reduce((acc, student) => ({
                        totalStudents: acc.totalStudents + 1,
                        totalFees: acc.totalFees + (student.feeStructure || 0),
                        regionBreakdown: {
                            ...acc.regionBreakdown,
                            [student.region]: (acc.regionBreakdown[student.region] || 0) + 1
                        },
                        schoolCode: schoolId
                    }), {
                        totalStudents: 0,
                        totalFees: 0,
                        regionBreakdown: {} as Record<string, number>,
                        schoolCode: schoolId
                    });

                    setStats(stats);
                } else {
                    // No students found
                    setStats({
                        totalStudents: 0,
                        totalFees: 0,
                        regionBreakdown: {},
                        schoolCode: schoolId
                    });
                }
                setLoading(false);
                setRefreshing(false);
            }, (error) => {
                console.error("Error fetching data:", error);
                setError('Error loading student data');
                setLoading(false);
                setRefreshing(false);
            });
        } catch (error) {
            console.error("Error in fetchData:", error);
            setError('An unexpected error occurred');
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Cleanup function for the database listener
        return () => {
            const studentsRef = ref(database, 'students');
            // Detach the listener
            const unsubscribe = onValue(studentsRef, () => { });
            unsubscribe();
        };
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        setError(null);
        fetchData();
    };

    // Error display component
    const ErrorDisplay = () => (
        <ThemedView style={styles.errorContainer}>
            <ThemedText style={styles.errorText}>{error}</ThemedText>
        </ThemedView>
    );

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    if (error) {
        return <ErrorDisplay />;
    }
    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                    tintColor="#3497A3"
                />
            }
        >
            <View style={styles.header}>
                <View style={styles.imageContainer}>
                    <Image
                        source={{ uri: 'https://cdn.pixabay.com/photo/2012/04/18/19/28/apricots-37644_1280.png' }}
                        style={styles.schoolImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                        <ThemedText style={styles.schoolNameOverlay}>Accounts.</ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <Card title="Current Statistics">
                    <CardContent>
                        <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>Total Students</ThemedText>
                            <ThemedText style={styles.value}>{stats.totalStudents}</ThemedText>
                        </View>
                        <View style={styles.dataRow}>
                            <ThemedText style={styles.label}>Total Fees</ThemedText>
                            <ThemedText style={styles.value}>
                                ${stats.totalFees.toLocaleString()}
                            </ThemedText>
                        </View>
                    </CardContent>
                </Card>

                <Card title="Recent Registrations">
                    <CardContent>
                        <ScrollView style={styles.recentList}>
                            {students.slice(-5).reverse().map((student) => (
                                <View key={student.id} style={styles.dataRow}>
                                    <ThemedText style={styles.label}>{student.name}</ThemedText>
                                    <ThemedText style={styles.value}>
                                        {new Date(student.submittedAt).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                            ))}
                        </ScrollView>
                    </CardContent>
                </Card>

                <Card title="Regional Distribution">
                    <CardContent>
                        {Object.entries(stats.regionBreakdown).map(([region, count]) => (
                            <View key={region} style={styles.dataRow}>
                                <ThemedText style={styles.label}>{region}</ThemedText>
                                <ThemedText style={styles.value}>{count} students</ThemedText>
                            </View>
                        ))}
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
        },
        header: {
            backgroundColor: '#FFFFFF',
            paddingTop: Platform.OS === 'ios' ? 60 : 24,
            borderBottomWidth: 1,
            borderBottomColor: '#E0E0E0',
            alignItems: 'center',
        },
        imageContainer: {
            width: '100%',
            height: 300,
            marginTop: -25,
            backgroundColor: 'transparent',
            position: 'relative',
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
            position: 'absolute',
            width: 158,
            height: 270,
            right: 0,
        },
        imageOverlay: {
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            backgroundColor: 'transparent',
            padding: Platform.OS === 'ios' ? 20 : 15,
        },
        schoolNameOverlay: {
            fontSize: 31,
            padding: 10,
            fontWeight: '700',
            color: '#3497A3',
            marginBottom: 8,
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        },
        content: {
            padding: 16,
        },
        dataRow: {
            backgroundColor: '#3497A3',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: '#F0F0F0',
        },
        label: {
            fontSize: 15,
            fontWeight: '900',
            color: '#FFFFFF',
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
            flex: 1,
        },
        value: {
            fontSize: 16,
            color: '#FFFFFF',
            fontWeight: '200',
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
            flex: 2,
            textAlign: 'right',
        },
        recentList: {
            maxHeight: 300,
        },
        loadingContainer: {
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
        },
        errorContainer: {
            margin: 24,
        },
        errorMessage: {
            backgroundColor: '#FFF3F3',
            color: '#FF3B30',
            padding: 12,
            borderRadius: 12,
            fontSize: 15,
            textAlign: 'center',
            overflow: 'hidden',
            fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        }
    });