import React, { useState, useEffect } from 'react';
import { ScrollView, View, StyleSheet, ActivityIndicator, Image, Platform, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { database } from '../(tabs)/firebaseConfig';
import { ref, child, get, getDatabase } from 'firebase/database';
import { useRouter } from 'expo-router';

interface School {
    active: boolean;
    name: string;
    schoolCode: string;
    region: string;
    address: string;
    principalName: string;
    contactNumber: string;
    email: string;
    registeredAt: string;
}

interface DetailRowProps {
    label: string;
    value: string | number | undefined;
}

const DetailRow: React.FC<DetailRowProps> = ({ label, value }) => (
    <View style={styles.detailRow}>
        <ThemedText style={styles.detailLabel}>{label}</ThemedText>
        <ThemedText style={styles.detailValue}>
            {value?.toString() || 'N/A'}
        </ThemedText>
    </View>
);

const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <View style={styles.cardContent}>
            {children}
        </View>
    </View>
);

export default function MySchoolScreen() {
    const [schoolData, setSchoolData] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    const fetchSchoolData = async () => {
        try {
            const studentDataStr = await AsyncStorage.getItem('studentData');
            if (!studentDataStr) {
                setError('No student data found. Please login again.');
                setLoading(false);
                router.push('/');
                return;
            }

            const studentData = JSON.parse(studentDataStr);
            const schoolCode = studentData.schoolCode;

            const dbRef = ref(getDatabase());
            const snapshot = await get(child(dbRef, 'schools'));

            if (snapshot.exists()) {
                const schoolsData = snapshot.val();
                const schoolEntry = Object.entries(schoolsData).find(
                    ([key, value]: [string, any]) => value.schoolCode === schoolCode
                );

                if (schoolEntry) {
                    setSchoolData(schoolEntry[1] as School);
                } else {
                    setError('School not found');
                }
            } else {
                setError('No school data available');
            }
        } catch (error) {
            console.error('Error fetching school data:', error);
            setError('Error loading school data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchSchoolData();
    }, []);

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchSchoolData();
    }, []);

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#3497A3" />
            </View>
        );
    }

    if (error) {
        return (
            <View style={styles.container}>
                <View style={styles.errorContainer}>
                    <ThemedText style={styles.errorMessage}>{error}</ThemedText>
                </View>
            </View>
        );
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
                        source={{
                            uri: 'https://cdn.pixabay.com/photo/2012/04/18/19/28/apricots-37644_1280.png' }}
                        style={styles.schoolImage}
                        resizeMode="cover"
                    />
                    <View style={styles.imageOverlay}>
                        <ThemedText style={styles.schoolNameOverlay}>{schoolData?.name}</ThemedText>
                    </View>
                </View>
                <View style={styles.statusContainer}>
                    <View style={[styles.statusBadge,
                    { backgroundColor: schoolData?.active ? '#E8F5E9' : '#FFEBEE' }]}>
                        <ThemedText style={[styles.statusText,
                        { color: schoolData?.active ? '#2E7D32' : '#C62828' }]}>
                            {schoolData?.active ? 'Active' : 'Inactive'} Institution
                        </ThemedText>
                    </View>
                </View>
            </View>

            <View style={styles.content}>
                <Card title="School Information">
                    <DetailRow label="School Code" value={schoolData?.schoolCode} />
                    <DetailRow label="Region" value={schoolData?.region} />
                    <DetailRow
                        label="Registration Date"
                        value={schoolData?.registeredAt ?
                            new Date(schoolData.registeredAt).toLocaleDateString() :
                            'N/A'
                        }
                    />
                </Card>

                <Card title="Contact Information">
                    <DetailRow label="Principal" value={schoolData?.principalName} />
                    <DetailRow label="Phone" value={schoolData?.contactNumber} />
                    <DetailRow label="Email" value={schoolData?.email} />
                    <DetailRow label="Address" value={schoolData?.address} />
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
        padding: Platform.OS === 'ios' ? 20 : 5,
    },
    schoolNameOverlay: {
        fontSize: 26,
        padding: 22,
        width: 200,
        fontWeight: '700',
        color: '#3497A3',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    statusContainer: {
        position: 'absolute',
        padding: 15,
        left: 10,
        top: 150,
        backgroundColor: 'transparent',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginTop: 4,
    },
    statusText: {
        fontSize: 10,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        fontWeight: '500',
    },
    content: {
        padding: 16,
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
        padding: 36,
        backgroundColor: '#3497A3',
    },
    detailRow: {
        backgroundColor: '#3497A3',
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
    },
});