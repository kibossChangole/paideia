import React, { useState, useEffect } from "react";
import {
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  TextInput,
  Image,
  Text,
  KeyboardAvoidingView,
} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { database } from "../(tabs)/firebaseConfig";
import { ref, get, update } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

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
  status: "success" | "pending" | "failed";
};

const COLORS = {
  primary: "#14B8A6", // Teal
  secondary: "#0D9488", // Darker Teal
  background: "#FFFFFF",
  surface: "#F9FAFB",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate700: "#334155",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate300: "#cbd5e1",
  slate100: "#f1f5f9",
  slate50: "#f8fafc",
  amber400: "#fbbf24",
  white: "#ffffff",
};

export default function AccountsScreen() {
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // Payment Form State
  const [payAmount, setPayAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("0712 345 678");
  const [processing, setProcessing] = useState(false);

  const fetchData = async () => {
    try {
      const studentId = await AsyncStorage.getItem("studentId");

      if (!studentId) {
        setError("No student ID found. Please login again.");
        setLoading(false);
        router.push("/");
        return;
      }

      const studentsRef = ref(database, "students");
      const snapshot = await get(studentsRef);

      if (snapshot.exists()) {
        const students = snapshot.val();
        const student = Object.values(students).find(
          (s: any) => s.id === studentId
        ) as Student;

        if (student) {
          setStudentData(student);

          // Fetch payment history if exists
          const paymentsRef = ref(database, `payments/${studentId}`);
          const paymentsSnapshot = await get(paymentsRef);
          if (paymentsSnapshot.exists()) {
            const paymentsData = paymentsSnapshot.val();
            // Convert to array and sort by date descending
            const paymentsList = Object.values(paymentsData) as Payment[];
            paymentsList.sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            );
            setPayments(paymentsList);
          }
        } else {
          setError("Student not found");
          router.push("/");
        }
      } else {
        setError("No student data available");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Error loading data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handlePaymentSubmit = async () => {
    if (!studentData) return;
    const amountVal = parseFloat(payAmount);

    if (!payAmount || isNaN(amountVal) || amountVal <= 0) {
      alert("Please enter a valid amount");
      return;
    }

    if (amountVal > studentData.feeStructure) {
      alert("Amount cannot exceed outstanding balance");
      return;
    }

    setProcessing(true);

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 2000));

      const payment: Payment = {
        amount: amountVal,
        date: new Date().toISOString(),
        reference: Math.random().toString(36).substring(2, 8).toUpperCase(),
        status: "success",
      };

      const newBalance = studentData.feeStructure - amountVal;
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
        feeStructure: newBalance,
      });
      setPayments([payment, ...payments]);
      setPayAmount("");

      alert("Payment successful!");
    } catch (error) {
      console.error("Payment error:", error);
      alert("Payment failed. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
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
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Custom Navbar */}
      <View style={styles.navbar}>
        <View style={styles.navContainer}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons
              name="arrow-back-ios"
              size={24}
              color={COLORS.slate900}
            />
          </TouchableOpacity>
          <Text style={styles.navTitle}>Payments</Text>
          <View style={styles.navPlaceholder} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                fetchData();
              }}
              tintColor={COLORS.primary}
            />
          }
        >
          <View style={styles.main}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.balanceLabel}>Outstanding Balance</Text>
              <View style={styles.balanceRow}>
                <Text style={styles.currencySymbol}>KES</Text>
                <Text style={styles.balanceAmount}>
                  {studentData?.feeStructure?.toLocaleString() || "0"}
                </Text>
              </View>
              <View style={styles.studentBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.studentIdText}>
                  Student ID: {studentData?.id || "..."}
                </Text>
              </View>
            </View>

            {/* Payment Section */}
            <View style={styles.section}>
              {/* Amount Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  How much would you like to pay?
                </Text>
                <View style={styles.inputContainer}>
                  <View style={styles.inputIconLeft}>
                    <Text style={styles.inputCurrency}>KES</Text>
                  </View>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="0.00"
                    placeholderTextColor={COLORS.slate300}
                    keyboardType="numeric"
                    value={payAmount}
                    onChangeText={setPayAmount}
                  />
                </View>
              </View>

              {/* Phone Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>M-Pesa Phone Number</Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.phoneInput}
                    placeholder="07XX XXX XXX"
                    keyboardType="phone-pad"
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                  />
                  <View style={styles.inputIconRight}>
                    <MaterialIcons
                      name="contact-phone"
                      size={24}
                      color={COLORS.slate400}
                    />
                  </View>
                </View>
                <Text style={styles.helperText}>
                  This is your registered profile number.
                </Text>
              </View>

              {/* Pay Button */}
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.payButton}
                  onPress={handlePaymentSubmit}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <View style={styles.mpesaIconContainer}>
                        <Text style={styles.mpesaText}>M</Text>
                      </View>
                      <Text style={styles.payButtonText}>Pay with M-Pesa</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.infoRow}>
                  <MaterialIcons
                    name="info"
                    size={18}
                    color={COLORS.slate400}
                    style={{ marginTop: 2 }}
                  />
                  <Text style={styles.infoText}>
                    A secure STK Push prompt will be sent to your phone. Simply
                    enter your PIN to confirm payment.
                  </Text>
                </View>
              </View>
            </View>

            {/* Recent Transactions */}
            <View style={styles.historySection}>
              <View style={styles.historyHeader}>
                <Text style={styles.historyTitle}>Recent Transactions</Text>
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See all</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.transactionsList}>
                {payments.length > 0 ? (
                  payments.map((payment, index) => (
                    <View key={index} style={styles.transactionRow}>
                      <View style={styles.transactionLeft}>
                        <View style={styles.transactionIcon}>
                          <MaterialIcons
                            name="description"
                            size={24}
                            color={COLORS.slate400}
                          />
                        </View>
                        <View>
                          <Text style={styles.transactionName}>
                            Fee Payment
                          </Text>
                          <Text style={styles.transactionMeta}>
                            {new Date(payment.date).toLocaleDateString()} • REF:{" "}
                            {payment.reference}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={styles.transactionAmount}>
                          KES {payment.amount.toLocaleString()}
                        </Text>
                        <Text
                          style={[
                            styles.transactionStatus,
                            payment.status === "success"
                              ? { color: COLORS.primary }
                              : payment.status === "pending"
                              ? { color: COLORS.amber400 }
                              : { color: COLORS.slate400 },
                          ]}
                        >
                          {payment.status.toUpperCase()}
                        </Text>
                      </View>
                    </View>
                  ))
                ) : (
                  <Text style={styles.emptyText}>No recent transactions</Text>
                )}
              </View>
            </View>

            <View style={{ height: 40 }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.white,
  },
  errorText: {
    fontSize: 16,
    color: "#FFEBEE",
    textAlign: "center",
    padding: 20,
  },

  // Navbar
  navbar: {
    backgroundColor: "rgba(255,255,255,0.8)",
    zIndex: 50,
  },
  navContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: 480,
    marginHorizontal: "auto",
    width: "100%",
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "flex-start",
    justifyContent: "center",
  },
  navTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.slate900,
    letterSpacing: -0.5,
  },
  navPlaceholder: {
    width: 40,
    height: 40,
  },

  // Main
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 96,
  },
  main: {
    maxWidth: 480,
    marginHorizontal: "auto",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // Header
  header: {
    paddingTop: 20,
    paddingBottom: 40,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate500,
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: "600",
    color: COLORS.slate900,
    marginTop: 6,
    marginRight: 4,
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: "800",
    color: COLORS.slate900,
    letterSpacing: -1,
  },
  studentBadge: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.slate50,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.amber400,
  },
  studentIdText: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.slate600,
  },

  // Form Section
  section: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate700,
    marginLeft: 4,
  },
  inputContainer: {
    position: "relative",
  },
  inputIconLeft: {
    position: "absolute",
    left: 20,
    zIndex: 10,
    height: "100%",
    justifyContent: "center",
  },
  inputIconRight: {
    position: "absolute",
    right: 20,
    zIndex: 10,
    height: "100%",
    justifyContent: "center",
  },
  inputCurrency: {
    color: COLORS.slate400,
    fontWeight: "500",
    fontSize: 16,
  },
  amountInput: {
    width: "100%",
    backgroundColor: COLORS.slate50,
    borderRadius: 20,
    paddingVertical: 20,
    paddingLeft: 64,
    paddingRight: 20,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  phoneInput: {
    width: "100%",
    backgroundColor: COLORS.slate50,
    borderRadius: 20,
    paddingVertical: 20,
    paddingLeft: 20,
    paddingRight: 60,
    fontSize: 18,
    fontWeight: "500",
    color: COLORS.slate900,
  },
  helperText: {
    fontSize: 11,
    color: COLORS.slate400,
    marginLeft: 4,
  },

  // Action
  actionContainer: {
    paddingTop: 16,
  },
  payButton: {
    width: "100%",
    backgroundColor: COLORS.primary,
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  mpesaIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    alignItems: "center",
    justifyContent: "center",
  },
  mpesaText: {
    color: "red",
    fontWeight: "bold",
    fontSize: 18,
  },
  payButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.white,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.slate500,
    lineHeight: 18,
  },

  // History
  historySection: {
    marginTop: 48,
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.primary,
  },
  transactionsList: {
    gap: 1,
    backgroundColor: COLORS.slate100, // For divider effect
  },
  transactionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
    backgroundColor: COLORS.white,
  },
  transactionLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.slate50,
    alignItems: "center",
    justifyContent: "center",
  },
  transactionName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  transactionMeta: {
    fontSize: 12,
    color: COLORS.slate400,
    marginTop: 2,
  },
  transactionRight: {
    alignItems: "flex-end",
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  transactionStatus: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
    marginTop: 2,
    letterSpacing: 0.5,
  },
  emptyText: {
    padding: 24,
    textAlign: "center",
    color: COLORS.slate400,
    backgroundColor: COLORS.white,
  },
});
