import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, View, ViewProps, StyleSheet } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { database } from '../(tabs)/firebaseConfig';
import { ref, onValue, DataSnapshot } from 'firebase/database';

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
};

// Main Component
export default function HomeScreen() {
    const [students, setStudents] = useState<Student[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState<DashboardStats>({
        totalStudents: 0,
        totalFees: 0,
        regionBreakdown: {},
    });

    const fetchData = () => {
        const studentsRef = ref(database, 'students');

        onValue(studentsRef, (snapshot: DataSnapshot) => {
            const data = snapshot.val();
            if (data) {
                const studentList = Object.values(data) as Student[];
                setStudents(studentList);

                const stats = studentList.reduce((acc, student) => ({
                    totalStudents: acc.totalStudents + 1,
                    totalFees: acc.totalFees + (student.feeStructure || 0),
                    regionBreakdown: {
                        ...acc.regionBreakdown,
                        [student.region]: (acc.regionBreakdown[student.region] || 0) + 1
                    }
                }), {
                    totalStudents: 0,
                    totalFees: 0,
                    regionBreakdown: {} as Record<string, number>
                });

                setStats(stats);
            }
            setLoading(false);
            setRefreshing(false);
        }, (error) => {
            console.error("Error fetching data:", error);
            setLoading(false);
            setRefreshing(false);
        });
    };

    useEffect(() => {
        fetchData();
    }, []);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const StatCard = ({ title, value }: { title: string; value: string | number }) => (
        <Card style={styles.statCard}>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent>
                <ThemedText style={styles.statValue}>{value}</ThemedText>
            </CardContent>
        </Card>
    );

    const RecentRegistrations = () => (
        <Card style={styles.recentRegistrationsCard}>
            <CardHeader>
                <CardTitle>Recent Registrations</CardTitle>
            </CardHeader>
            <CardContent>
                <ScrollView style={styles.recentList}>
                    {students.slice(-5).reverse().map((student) => (
                        <ThemedView key={student.id} style={styles.recentItem}>
                            <ThemedText style={styles.studentName}>
                                {student.name}
                            </ThemedText>
                            <ThemedText style={styles.studentDetails}>
                                ID: {student.id} | Region: {student.region}
                            </ThemedText>
                            <ThemedText style={styles.registrationDate}>
                                Registered: {new Date(student.submittedAt).toLocaleDateString()}
                            </ThemedText>
                        </ThemedView>
                    ))}
                </ScrollView>
            </CardContent>
        </Card>
    );

    const RegionalDistribution = () => (
        <Card style={styles.regionalCard}>
            <CardHeader>
                <CardTitle>Regional Distribution</CardTitle>
            </CardHeader>
            <CardContent>
                {Object.entries(stats.regionBreakdown).map(([region, count]) => (
                    <ThemedView key={region} style={styles.regionRow}>
                        <ThemedText style={styles.regionCode}>{region}</ThemedText>
                        <ThemedText style={styles.regionCount}>
                            {count} students
                        </ThemedText>
                    </ThemedView>
                ))}
            </CardContent>
        </Card>
    );

    if (loading) {
        return (
            <ThemedView style={styles.loadingContainer}>
                <ActivityIndicator size="large" />
            </ThemedView>
        );
    }

    return (
        <ScrollView
            style={styles.container}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
        >
            <ThemedView style={styles.content}>
                <ThemedText style={styles.header}>Analytics</ThemedText>

                <ThemedView style={styles.statsContainer}>
                    <StatCard
                        title="Total Students"
                        value={stats.totalStudents}
                    />
                    <StatCard
                        title="Total Fees"
                        value={`$${stats.totalFees.toLocaleString()}`}
                    />
                </ThemedView>

                <RecentRegistrations />
                <RegionalDistribution />
            </ThemedView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    content: {
        flex: 1,
        padding: 16,
        paddingTop: 60,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 16,
    },
    card: {
        borderRadius: 8,
        backgroundColor: 'white',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        marginBottom: 8,
    },
    cardHeader: {
        padding: 16,
        paddingBottom: 8,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    cardContent: {
        padding: 16,
    },
    statsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    statCard: {
        flex: 1,
        marginHorizontal: 4,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
    },
    recentRegistrationsCard: {
        marginBottom: 16,
    },
    recentList: {
        maxHeight: 300,
    },
    recentItem: {
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    studentName: {
        fontSize: 16,
        fontWeight: '600',
    },
    studentDetails: {
        fontSize: 14,
        color: '#666',
        marginTop: 2,
    },
    registrationDate: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
    },
    regionalCard: {
        marginBottom: 16,
    },
    regionRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#e5e5e5',
    },
    regionCode: {
        fontSize: 16,
        fontWeight: '500',
    },
    regionCount: {
        fontSize: 16,
        color: '#666',
    },
});