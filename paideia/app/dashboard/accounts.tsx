import React, { useState, useEffect } from 'react';
import { ScrollView, RefreshControl, ActivityIndicator, View, StyleSheet, Platform, TouchableOpacity, TextInput, Modal } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { database } from '../(tabs)/firebaseConfig';
import { ref, get, update } from 'firebase/database';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';

// Types
type Student = {
    id: string;
    name: string;
    grade: string;
    feeStructure: number;
    schoolCode: string;
};

type Payment = {
    amount: number;
    date: string;
    reference: string;
    status: 'success' | 'pending' | 'failed';
};

// Components
const Card: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <View style={styles.card}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <View style={styles.cardContent}>
            {children}
        </View>
    </View>
);

const PaymentModal = ({ visible, onClose, onSubmit, maxAmount }: any) => {
    const [amount, setAmount] = useState('');
    const [processing, setProcessing] = useState(false);

    const handlePayment = async () => {
        if (!amount || parseFloat(amount) <= 0 || parseFloat(amount) > maxAmount) {
            alert('Please enter a valid amount');
            return;
        }

        setProcessing(true);
        // Simulate payment processing
        await new Promise(resolve => setTimeout(resolve, 2000));
        setProcessing(false);
        onSubmit(parseFloat(amount));
        setAmount('');
        onClose();
    };

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
        >
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <ThemedText style={styles.modalTitle}>Make Payment</ThemedText>
                    <TextInput
                        style={styles.input}
                        placeholder="Enter amount"
                        keyboardType="numeric"
                        value={amount}
                        onChangeText={setAmount}
                        placeholderTextColor="#666"
                    />
                    {processing ? (
                        <ActivityIndicator size="small" color="#3497A3" />
                    ) : (
                        <View style={styles.modalButtons}>
                            <TouchableOpacity 
                                style={[styles.button, styles.cancelButton]} 
                                onPress={onClose}
                            >
                                <ThemedText style={styles.buttonText}>Cancel</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={[styles.button, styles.payButton2]} 
                                onPress={handlePayment}
                            >
                                <ThemedText style={styles.buttonText}>Pay Now</ThemedText>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export default function AccountsScreen() {
    const [studentData, setStudentData] = useState<Student | null>(null);
    const [payments, setPayments] = useState<Payment[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const router = useRouter();

    const fetchData = async () => {
        try {
            const studentId = await AsyncStorage.getItem('studentId');
            console.log('Retrieved student ID:', studentId);

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
                // Find the student with matching ID
                const student = Object.values(students).find(
                    (s: any) => s.id === studentId
                ) as Student;

                if (student) {
                    setStudentData(student);
                    console.log("Found student data:", student);
                    
                    // Fetch payment history if exists
                    const paymentsRef = ref(database, `payments/${studentId}`);
                    const paymentsSnapshot = await get(paymentsRef);
                    if (paymentsSnapshot.exists()) {
                        const paymentsData = paymentsSnapshot.val();
                        setPayments(Object.values(paymentsData));
                    }
                } else {
                    setError('Student not found');
                    router.push('/');
                }
            } else {
                setError('No student data available');
            }
        } catch (error) {
            console.error('Error fetching data:', error);
            setError('Error loading data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handlePayment = async (amount: number) => {
        if (!studentData) return;

        try {
            const payment: Payment = {
                amount,
                date: new Date().toISOString(),
                reference: Math.random().toString(36).substring(2, 15),
                status: 'success',
            };

            const newBalance = studentData.feeStructure - amount;
            const updates: any = {};
            
            // Update student's fee balance
            const studentRef = `students/${studentData.id}/feeStructure`;
            updates[studentRef] = newBalance;
            
            // Add payment record
            const paymentRef = `payments/${studentData.id}/${payment.reference}`;
            updates[paymentRef] = payment;

            await update(ref(database), updates);

            // Update local state
            setStudentData({
                ...studentData,
                feeStructure: newBalance
            });
            setPayments([payment, ...payments]);

            alert('Payment successful!');
        } catch (error) {
            console.error('Payment error:', error);
            alert('Payment failed. Please try again.');
        }
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

    return (
        <ScrollView
            style={styles.container}
            contentContainerStyle={styles.scrollContent}
            refreshControl={
                <RefreshControl
                    refreshing={refreshing}
                    onRefresh={fetchData}
                    tintColor="#FFFFFF"
                />
            }
        >
            <View style={styles.content}>
                <Card title="Current Balance">
                    <ThemedText style={styles.balanceAmount}>
                        KES {studentData?.feeStructure?.toLocaleString()}
                    </ThemedText>
                    <TouchableOpacity 
                        style={styles.payButton}
                        onPress={() => setShowPaymentModal(true)}
                    >
                        <ThemedText style={styles.payButtonText}>Make Payment</ThemedText>
                    </TouchableOpacity>
                </Card>

                <Card title="Payment History">
                    {payments.length > 0 ? (
                        payments.map((payment, index) => (
                            <View key={index} style={styles.paymentRow}>
                                <View style={styles.paymentInfo}>
                                    <ThemedText style={styles.paymentDate}>
                                        {new Date(payment.date).toLocaleDateString()}
                                    </ThemedText>
                                    <ThemedText style={styles.paymentReference}>
                                        Ref: {payment.reference}
                                    </ThemedText>
                                </View>
                                <ThemedText style={styles.paymentAmount}>
                                    KES {payment.amount.toLocaleString()}
                                </ThemedText>
                            </View>
                        ))
                    ) : (
                        <ThemedText style={styles.noPayments}>
                            No payment history available
                        </ThemedText>
                    )}
                </Card>
            </View>

            <PaymentModal 
                visible={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSubmit={handlePayment}
                maxAmount={studentData?.feeStructure || 0}
            />
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
        paddingBottom: 24,
    },
    content: {
        padding: 16,
        marginTop: -40,
        backgroundColor: '#3497A3',
        paddingTop: Platform.OS === 'ios' ? 48 : 100,
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
        backgroundColor: '#3497A3',
        padding: 24,
    },
    balanceAmount: {
        fontSize: 36,
        fontWeight: 'bold',
        color: '#FFFFFF',
        textAlign: 'center',
        padding:20,
        paddingBottom:2,
        marginVertical: 16,
    },
    payButton: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
    },
    payButtonText: {
        color: '#3497A3',
        fontSize: 16,
        fontWeight: '600',
    },
    paymentRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: '#F0F0F0',
    },
    paymentInfo: {
        flex: 1,
    },
    paymentDate: {
        fontSize: 14,
        color: '#FFFFFF',
        marginBottom: 4,
    },
    paymentReference: {
        fontSize: 12,
        color: '#FFFFFF',
        opacity: 0.8,
    },
    paymentAmount: {
        fontSize: 16,
        fontWeight: '600',
        color: '#FFFFFF',
    },
    noPayments: {
        textAlign: 'center',
        color: '#FFFFFF',
        opacity: 0.8,
        padding: 16,
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
        padding: 24,
        width: '80%',
        maxWidth: 400,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '600',
        marginBottom: 16,
        textAlign: 'center',
        color: '#3497A3',
    },
    input: {
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 8,
        padding: 12,
        marginBottom: 16,
        fontSize: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
    },
    button: {
        flex: 1,
        padding: 12,
        borderRadius: 8,
    },
    cancelButton: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: '#FF3B30',
    },
    payButton2: {
        borderRadius: 8,
        padding: 16,
        alignItems: 'center',
        marginTop: 16,
        backgroundColor: '#34C759',
    },
    buttonText: {
        color: '#FFFFFF',
        textAlign: 'center',
        fontSize: 16,
        fontWeight: '600',
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