import React, { useState, useEffect } from 'react';
import Icon from 'react-native-vector-icons/Feather';
import {
    ScrollView,
    RefreshControl,
    ActivityIndicator,
    View,
    StyleSheet,
    Platform,
    Image,
    TouchableOpacity,
    TextInput,
    Modal
} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { database } from '../(tabs)/firebaseConfig';
import { ref, child, get, getDatabase, update, push } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Announcement {
    id: string;
    title: string;
    content: string;
    date: string;
    author: string;
}

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
    announcements?: Announcement[];
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

const SchoolDashboardScreen: React.FC = () => {
    const [schoolData, setSchoolData] = useState<School | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
    const [newAnnouncement, setNewAnnouncement] = useState({
        title: '',
        content: '',
        author: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);


    const sampleAnnouncements = [
        {
            id: '1',
            title: 'End of Term Examinations',
            content: 'Final examinations will begin next week. Please check the schedule posted on the notice board for detailed timings and room assignments.',
            date: new Date().toISOString(),
            author: 'Principal Smith'
        },
        {
            id: '2',
            title: 'Holiday Break',
            content: 'School will be closed for winter break from Dec 20 to Jan 5. We wish all students and staff a wonderful holiday season!',
            date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
            author: 'Admin Office'
        },
        {
            id: '3',
            title: 'Sports Day Event',
            content: 'Annual Sports Day will be held next month. Students interested in participating should register with their PE teachers.',
            date: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
            author: 'Sports Department'
        },
        {
            id: '4',
            title: 'Parent-Teacher Meeting',
            content: 'Quarterly parent-teacher meeting is scheduled for next Friday. Booking slots are now open.',
            date: new Date(Date.now() - 259200000).toISOString(), // 3 days ago
            author: 'Academic Coordinator'
        }
    ];

    const fetchSchoolData = async () => {
        try {
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) {
                setError('No school ID found. Please login again.');
                setLoading(false);
                return;
            }

            const db = getDatabase();
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, 'schools'));

            if (snapshot.exists()) {
                const schoolsData = snapshot.val();
                const schoolEntry = Object.entries(schoolsData).find(([key, value]: [string, any]) =>
                    value.schoolCode === schoolId
                );

                if (schoolEntry) {
                    const [schoolKey, schoolValue] = schoolEntry;

                    // If school doesn't have announcements, add sample ones
                    if (!schoolValue.announcements) {
                        const updates = {
                            [`schools/${schoolKey}/announcements`]: sampleAnnouncements
                        };

                        try {
                            await update(ref(db), updates);
                            schoolValue.announcements = sampleAnnouncements;
                        } catch (updateError) {
                            console.error('Error adding announcements:', updateError);
                        }
                    }

                    setSchoolData(schoolValue as School);
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

    const handleAddAnnouncement = async () => {
        if (!newAnnouncement.title || !newAnnouncement.content || !newAnnouncement.author) {
            setError('Please fill in all fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const schoolId = await AsyncStorage.getItem('schoolId');
            if (!schoolId) {
                setError('No school ID found. Please login again.');
                return;
            }

            const db = getDatabase();
            const dbRef = ref(db);
            const snapshot = await get(child(dbRef, 'schools'));

            if (snapshot.exists()) {
                const schoolsData = snapshot.val();
                const schoolEntry = Object.entries(schoolsData).find(([key, value]: [string, any]) =>
                    value.schoolCode === schoolId
                );

                if (schoolEntry) {
                    const [schoolKey] = schoolEntry;
                    const announcement = {
                        id: push(child(ref(db), 'announcements')).key,
                        title: newAnnouncement.title,
                        content: newAnnouncement.content,
                        author: newAnnouncement.author,
                        date: new Date().toISOString()
                    };

                    const currentAnnouncements = schoolData?.announcements || [];
                    const updates = {
                        [`schools/${schoolKey}/announcements`]: [announcement, ...currentAnnouncements]
                    };

                    await update(ref(db), updates);

                    // Update local state
                    setSchoolData(prev => ({
                        ...prev!,
                        announcements: [announcement, ...(prev?.announcements || [])]
                    }));

                    // Reset form
                    setNewAnnouncement({
                        title: '',
                        content: '',
                        author: ''
                    });
                }
            }
        } catch (error) {
            console.error('Error adding announcement:', error);
            setError('Failed to add announcement');
        } finally {
            setIsSubmitting(false);
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
        <View style={{ flex: 1 }}> 
            <Modal
                animationType="slide"
                transparent={true}
                visible={isModalVisible}
                onRequestClose={() => setIsModalVisible(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <ThemedText style={styles.modalTitle}>Add Announcement</ThemedText>
                            <TouchableOpacity
                                onPress={() => setIsModalVisible(false)}
                                style={styles.closeButton}
                            >
                                <ThemedText style={styles.closeButtonText}>×</ThemedText>
                            </TouchableOpacity>
                        </View>

                        <View style={styles.formContainer}>
                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.inputLabel}>Title</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={newAnnouncement.title}
                                    onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, title: text }))}
                                    placeholder="Enter announcement title"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.inputLabel}>Content</ThemedText>
                                <TextInput
                                    style={[styles.input, styles.contentInput]}
                                    value={newAnnouncement.content}
                                    onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, content: text }))}
                                    placeholder="Enter announcement content"
                                    placeholderTextColor="#999"
                                    multiline
                                    numberOfLines={4}
                                />
                            </View>

                            <View style={styles.inputContainer}>
                                <ThemedText style={styles.inputLabel}>Author</ThemedText>
                                <TextInput
                                    style={styles.input}
                                    value={newAnnouncement.author}
                                    onChangeText={(text) => setNewAnnouncement(prev => ({ ...prev, author: text }))}
                                    placeholder="Enter author name"
                                    placeholderTextColor="#999"
                                />
                            </View>

                            <TouchableOpacity
                                style={[
                                    styles.submitButton,
                                    isSubmitting && styles.submitButtonDisabled
                                ]}
                                onPress={() => {
                                    handleAddAnnouncement();
                                    setIsModalVisible(false);
                                }}
                                disabled={isSubmitting}
                            >
                                <ThemedText style={styles.submitButtonText}>
                                    {isSubmitting ? 'Adding...' : 'Add Announcement'}
                                </ThemedText>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>



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
               
          
                    <View style={styles.announcementsContainer}>
                        <View style={styles.announcementHeader}>
                            <ThemedText style={styles.announcementTitle}>Latest Announcements</ThemedText>
                            <View style={styles.paginationControls}>
                                    <View style={styles.paginationControls}>
                                        <TouchableOpacity
                                            onPress={() => setCurrentAnnouncementIndex(prev =>
                                                prev > 0 ? prev - 3 : prev
                                            )}
                                            disabled={currentAnnouncementIndex === 0}
                                            style={styles.paginationButton}
                                        >
                                            <Icon
                                                name="chevron-left"
                                                size={24}
                                                color="#FFFFFF"
                                                style={[
                                                    currentAnnouncementIndex === 0 && styles.paginationArrowDisabled
                                                ]}
                                            />
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            onPress={() => setCurrentAnnouncementIndex(prev =>
                                                prev + 3 < (schoolData?.announcements?.length || 0) ? prev + 3 : prev
                                            )}
                                            disabled={currentAnnouncementIndex + 3 >= (schoolData?.announcements?.length || 0)}
                                            style={styles.paginationButton}
                                        >
                                            <Icon
                                                name="chevron-right"
                                                size={24}
                                                color="#FFFFFF"
                                                style={[
                                                    (currentAnnouncementIndex + 3 >= (schoolData?.announcements?.length || 0)) &&
                                                    styles.paginationArrowDisabled
                                                ]}
                                            />
                                        </TouchableOpacity>
                                    </View>
                            </View>
                        </View>
                        {schoolData?.announcements?.slice(currentAnnouncementIndex, currentAnnouncementIndex + 3).map((announcement, index) => (
                            <View key={announcement.id} style={styles.announcementItem}>
                                <View style={styles.announcementItemHeader}>
                                    <ThemedText style={styles.announcementItemTitle}>{announcement.title}</ThemedText>
                                    <ThemedText style={styles.announcementDate}>
                                        {new Date(announcement.date).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.announcementContent}>{announcement.content}</ThemedText>
                                <ThemedText style={styles.announcementAuthor}>- {announcement.author}</ThemedText>
                            </View>
                        ))}
                        {(!schoolData?.announcements || schoolData.announcements.length === 0) && (
                            <View style={styles.noAnnouncementsContainer}>
                                <ThemedText style={styles.noAnnouncementsText}>
                                    No announcements available
                                </ThemedText>
                            </View>
                        )}
                    </View>
          

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
            {/* Floating Action Button */}
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setIsModalVisible(true)}
            >
                <Icon name="radio" size={24} color="#3497A3" />
            </TouchableOpacity>
        </View>
    );
};

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

    fab: {
        position: 'absolute',
        right: 20,
        bottom: 20,
        backgroundColor: '#FFFFFF',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        zIndex: 999, // Add this
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    modalContent: {
        backgroundColor: '#FFFFFF',
        borderRadius: 12,
        width: '90%',
        maxHeight: '80%',
        padding: 20,
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        color: '#333333',
    },
    closeButton: {
        padding: 8,
    },
    closeButtonText: {
        fontSize: 24,
        color: '#666666',
        fontWeight: '600',
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
        padding: 16,
        backgroundColor: '#FFFFFF',
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
        fontWeight: '600',
        color: '#333333',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
        flex: 1,
    },
    detailValue: {
        fontSize: 16,
        color: '#666666',
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
    formContainer: {
        padding: 16,
        backgroundColor: '#FFFFFF',
    },
    inputContainer: {
        marginBottom: 16,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#3497A3',
        marginBottom: 8,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
        color: '#333333',
        fontSize: 16,
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    contentInput: {
        height: 100,
        textAlignVertical: 'top',
    },
    submitButton: {
        backgroundColor: '#3497A3',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
        marginTop: 16,
    },
    submitButtonDisabled: {
        opacity: 0.5,
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '600',
        fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
    },
    announcementsContainer: {
        backgroundColor: '#3497A3',
        borderRadius: 8,
        padding: 16,
    },
    announcementHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    announcementTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    paginationControls: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    paginationButton: {
        padding: 8,
    },
    paginationArrowDisabled: {
        opacity: 0.3,
    },
    announcementItem: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#E0E0E0',
    },
    announcementItemHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    announcementItemTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#3497A3',
        flex: 1,
    },
    announcementDate: {
        fontSize: 12,
        color: '#666666',
    },
    announcementContent: {
        fontSize: 14,
        color: '#333333',
        marginBottom: 8,
        lineHeight: 20,
    },
    announcementAuthor: {
        fontSize: 12,
        color: '#666666',
        fontStyle: 'italic',
        textAlign: 'right',
    },
    noAnnouncementsContainer: {
        padding: 24,
        alignItems: 'center',
    },
    noAnnouncementsText: {
        fontSize: 16,
        color: '#666666',
        fontStyle: 'italic',
    },
});

export default SchoolDashboardScreen;