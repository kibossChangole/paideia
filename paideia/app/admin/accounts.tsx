import React, { useState, useEffect } from "react";
import {
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  View,
  StyleSheet,
  Platform,
  TouchableOpacity,
  Text,
  Dimensions,
} from "react-native";
import {
  MaterialIcons,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import { database } from "../(tabs)/firebaseConfig";
import { ref, onValue, DataSnapshot, get } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Circle, G, Text as SvgText } from "react-native-svg";

const { width } = Dimensions.get("window");

const COLORS = {
  primary: "#14B8A6", // Teal
  darkTeal: "#2D6A6A", // Image button color
  background: "#F8F9FA",
  white: "#FFFFFF",
  slate900: "#0f172a",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate100: "#f1f5f9",
  salmon: "#FEF2F2",
  salmonIcon: "#EE4444",
  amber: "#fbbf24",
};

type Payment = {
  amount: number;
  date: string;
  reference: string;
  status: "success" | "pending" | "failed";
  studentId?: string;
  studentName?: string;
  studentGrade?: string;
};

type Student = {
  id: string;
  name: string;
  grade: string;
  feeStructure: number;
  schoolCode: string;
};

export default function AdminAccountsScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalCollected, setTotalCollected] = useState(0);
  const [outstandingBalance, setOutstandingBalance] = useState(0);
  const [pendingStudentsCount, setPendingStudentsCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState<Payment[]>([]);
  const [schoolId, setSchoolId] = useState<string | null>(null);

  const ANNUAL_GOAL = 5000000;

  const fetchData = async () => {
    try {
      const storedSchoolId = await AsyncStorage.getItem("schoolId");
      setSchoolId(storedSchoolId);

      // Fetch Students
      const studentsRef = ref(database, "students");
      const studentsSnap = await get(studentsRef);
      const studentsData = studentsSnap.exists() ? studentsSnap.val() : {};
      const allStudents = Object.values(studentsData) as Student[];

      const filteredStudents = storedSchoolId
        ? allStudents.filter((s) => s.schoolCode === storedSchoolId)
        : allStudents;

      const totalOwed = filteredStudents.reduce(
        (acc, s) => acc + (s.feeStructure || 0),
        0
      );
      const pendingCount = filteredStudents.filter(
        (s) => s.feeStructure > 0
      ).length;

      setOutstandingBalance(totalOwed);
      setPendingStudentsCount(pendingCount);

      // Fetch Payments
      const paymentsRef = ref(database, "payments");
      const paymentsSnap = await get(paymentsRef);
      const paymentsData = paymentsSnap.exists() ? paymentsSnap.val() : {};

      let allPayments: Payment[] = [];
      Object.keys(paymentsData).forEach((sId) => {
        // Only include if student belongs to this school (if schoolId is set)
        const student = filteredStudents.find((s) => s.id === sId);
        if (student) {
          const studentPayments = paymentsData[sId];
          Object.values(studentPayments).forEach((p: any) => {
            allPayments.push({
              ...p,
              studentId: sId,
              studentName: student.name,
              studentGrade: student.grade,
            });
          });
        }
      });

      // Filter successful and sort
      const successfulPayments = allPayments.filter(
        (p) => p.status === "success"
      );
      const totalCol = successfulPayments.reduce((acc, p) => acc + p.amount, 0);
      setTotalCollected(totalCol);

      // Sort by date desc for recent list
      allPayments.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecentTransactions(allPayments.slice(0, 10));
    } catch (error) {
      console.error("Error fetching admin accounts data:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const CircularProgress = ({
    size,
    strokeWidth,
    percentage,
  }: {
    size: number;
    strokeWidth: number;
    percentage: number;
  }) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
      <View
        style={{
          width: size,
          height: size,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${size / 2}, ${size / 2}`}>
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.slate100}
              strokeWidth={strokeWidth}
              fill="none"
            />
            <Circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              stroke={COLORS.darkTeal}
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </G>
        </Svg>
        <View style={styles.percentageContainer}>
          <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const collectedPercentage = Math.min(
    100,
    (totalCollected / ANNUAL_GOAL) * 100
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.iconButton}>
          <Ionicons name="menu" size={28} color={COLORS.darkTeal} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Collection Overview</Text>
        <TouchableOpacity style={styles.profileButton}>
          <View style={styles.profileCircle}>
            <MaterialIcons name="monetization-on" size={20} color="#B45309" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.darkTeal}
          />
        }
      >
        {/* Total Fees Collected Card */}
        <View style={styles.mainCard}>
          <View style={styles.cardHeaderRow}>
            <View>
              <Text style={styles.cardInfoLabel}>Total Fees Collected</Text>
              <Text style={styles.mainAmountText}>
                KSh {totalCollected.toLocaleString()}
              </Text>
              <View style={styles.goalStatusRow}>
                <Ionicons name="trending-up" size={16} color={COLORS.primary} />
                <Text style={styles.goalStatusText}>
                  {Math.round(collectedPercentage)}% of Annual Goal
                </Text>
              </View>
            </View>
            <CircularProgress
              size={80}
              strokeWidth={8}
              percentage={collectedPercentage}
            />
          </View>

          <View style={styles.progressBarBackground}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${collectedPercentage}%` },
              ]}
            />
          </View>

          <View style={styles.cardFooterRow}>
            <Text style={styles.footerLabel}>
              TARGET: KSH {(ANNUAL_GOAL / 1000000).toFixed(0)}M
            </Text>
            <Text style={styles.footerLabel}>
              REMAINING: KSH{" "}
              {Math.max(0, ANNUAL_GOAL - totalCollected).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Total Outstanding Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceIconContainer}>
            <MaterialCommunityIcons
              name="wallet-outline"
              size={24}
              color={COLORS.salmonIcon}
            />
          </View>
          <View style={styles.balanceTextContainer}>
            <Text style={styles.balanceLabel}>Total Outstanding Balance</Text>
            <Text style={styles.balanceAmountText}>
              KSh {outstandingBalance.toLocaleString()}
            </Text>
            <Text style={styles.balanceSubText}>
              Pending from {pendingStudentsCount} students
            </Text>
          </View>
        </View>

        {/* Recent M-Pesa Transactions */}
        <View style={styles.transactionSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent M-Pesa Transactions</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.historyList}>
            {recentTransactions.map((item, index) => (
              <View key={item.reference + index} style={styles.transactionItem}>
                <View style={styles.itemIconContainer}>
                  <MaterialIcons
                    name="description"
                    size={24}
                    color={COLORS.darkTeal}
                  />
                </View>
                <View style={styles.itemMainInfo}>
                  <Text style={styles.itemName}>
                    {item.studentName} ({item.studentGrade || "N/A"})
                  </Text>
                  <Text style={styles.itemMeta}>
                    {new Date(item.date).toLocaleDateString("en-GB", {
                      day: "2-digit",
                      month: "short",
                    })}{" "}
                    • {item.reference.substring(0, 10)}
                  </Text>
                </View>
                <Text style={styles.itemAmount}>
                  KSh {item.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Export Button */}
      <View style={styles.footerAction}>
        <TouchableOpacity style={styles.exportButton}>
          <MaterialCommunityIcons
            name="file-export-outline"
            size={24}
            color={COLORS.white}
          />
          <Text style={styles.exportButtonText}>Export Financial Report</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.white,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: "#FED7AA",
    justifyContent: "center",
    alignItems: "center",
  },
  profileCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#FFEDD5",
    justifyContent: "center",
    alignItems: "center",
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  mainCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  cardInfoLabel: {
    fontSize: 14,
    color: COLORS.slate500,
    marginBottom: 4,
  },
  mainAmountText: {
    fontSize: 28,
    fontWeight: "800",
    color: COLORS.darkTeal,
    marginBottom: 8,
  },
  goalStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  goalStatusText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.primary,
  },
  percentageContainer: {
    position: "absolute",
  },
  percentageText: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.darkTeal,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: COLORS.slate100,
    borderRadius: 4,
    width: "100%",
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: COLORS.darkTeal,
    borderRadius: 4,
  },
  cardFooterRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.slate400,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  balanceCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    padding: 24,
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  balanceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: COLORS.salmon,
    justifyContent: "center",
    alignItems: "center",
  },
  balanceTextContainer: {
    flex: 1,
  },
  balanceLabel: {
    fontSize: 13,
    color: COLORS.slate500,
    fontWeight: "500",
    marginBottom: 2,
  },
  balanceAmountText: {
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.slate900,
    marginBottom: 2,
  },
  balanceSubText: {
    fontSize: 12,
    color: COLORS.salmonIcon,
    fontWeight: "500",
  },
  transactionSection: {
    marginTop: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.darkTeal,
  },
  historyList: {
    gap: 12,
  },
  transactionItem: {
    backgroundColor: COLORS.white,
    borderRadius: 20,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 5,
    elevation: 1,
  },
  itemIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "#F1F5F9",
    justifyContent: "center",
    alignItems: "center",
  },
  itemMainInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.slate900,
    marginBottom: 2,
  },
  itemMeta: {
    fontSize: 12,
    color: COLORS.slate400,
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.slate900,
  },
  footerAction: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(248, 249, 249, 0.9)",
  },
  exportButton: {
    backgroundColor: COLORS.darkTeal,
    height: 60,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    shadowColor: COLORS.darkTeal,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 5,
  },
  exportButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "700",
  },
});
