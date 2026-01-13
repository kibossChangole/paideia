import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  ImageBackground,
  Platform,
  Linking,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ref, child, get, getDatabase } from "firebase/database";
import { useRouter } from "expo-router";

// --- Constants & Types ---

const COLORS = {
  primary: "#14B8A6", // Teal from dashboard
  background: "#F8FAFC",
  surface: "#FFFFFF",
  slate900: "#0f172a",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate200: "#e2e8f0",
  slate100: "#f1f5f9",
  white: "#ffffff",
  danger: "#ef4444",
};

interface School {
  name: string;
  schoolCode: string;
  region: string;
  address: string;
  principalName: string;
  contactNumber: string;
  email: string;
}

// --- Placeholder Data ---

const STAFF_DATA = [
  {
    id: "1",
    name: "Dr. Sarah Miller",
    role: "Principal",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuC-AXth0UFBTzZQ-bIHcdbQ_5Y8PtXtg3R8qvDr4u1vOyqmmWJcss20LKw8iyqN2LinUC5-M6rUxC8fwtpscwDNfP40mapEYgQl7p-PQfBdHEVnKieeZKf3CW1EvfnMVHztcZhwEFdWvWHPO7SZ_TI_E-u_-pmNG1QGOE197jmVtiNo8GfjerL0cOxcJPUzPf6GQLlBZJrm5AqFJmKFYLH1lowtzZE4b67FeF5R2nvwDV1LG7_HZ-iHzGcdCemUGjprCwJVtjWSO0A",
  },
  {
    id: "2",
    name: "Mr. James Chen",
    role: "Head of Mathematics",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuD6AkdRQS2PdVhiIEuZMLHE0CzN8OZfMUGu15pGMvAqaT23F6DGPw-IXwaaa28G5sRBtzEvgdjl8gKd9CxiHbew7CaPte4rPQSH_V8_kvxK99JaOHsScFw1psOE-ufYgtWBdddledznzoXMyDvLUa_2Wea656l0CXDcAK6qqVSdrgUjqpclfvBQtjVYVnWire2umut1Uhc94KgwcBLptcX99KoWyxijgYp0-Xop9R2eUQEYxNJbPIadhPOpTBKtQSuUYliWFJURRio",
  },
  {
    id: "3",
    name: "Ms. Elena Rodriguez",
    role: "Art Department",
    image:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuArolSJ9X6pG5NyGpibtIORvwsMCh1TyAD6sLmdWLeUey3n5afJEnWhoRrmRozv-1Sd48FFTbpxb_TBbYbcnTyD8QcVv1I9vLkUVrxGEhP2V7I3RC9zAOOll_-8JHD-eULh0ygETiRIcldQRgJCfKu20qVw4WaD3pGx8rjoW4gWMWNZSiuQo_kNOPwgtpwiarzpgt74YG4ybjhsWLpgodgZQZn-nazir-Rv3vdso9bL0rAGE1PnzGzksrX5mX4Un1S3EVnTkvZrSU8",
  },
];

const DOCUMENTS_DATA = [
  {
    id: "1",
    title: "Student Handbook 2024",
    meta: "Updated Aug 15 • 2.4 MB",
    icon: "picture-as-pdf",
    color: "#fee2e2", // red-100
    iconColor: "#dc2626", // red-600
  },
  {
    id: "2",
    title: "Academic Calendar",
    meta: "Fall Semester • 1.1 MB",
    icon: "calendar-today",
    color: "#dbeafe", // blue-100
    iconColor: "#2563eb", // blue-600
  },
  {
    id: "3",
    title: "Code of Conduct",
    meta: "Policy Doc • 850 KB",
    icon: "health-and-safety",
    color: "#d1fae5", // emerald-100
    iconColor: "#059669", // emerald-600
  },
];

export default function MySchoolScreen() {
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  // --- Data Fetching ---

  const fetchSchoolData = async () => {
    try {
      setError(null);
      const studentId = await AsyncStorage.getItem("studentId");
      if (!studentId) {
        // Try fallback key if studentId not found (checking both keys seen in history)
        const studentDataStr = await AsyncStorage.getItem("studentData");
        if (!studentDataStr) {
          setError("No user data found.");
          setLoading(false);
          return;
        }
        // If we have studentData object but no ID, parse it
        const parsed = JSON.parse(studentDataStr);
        if (parsed.schoolCode) {
          await fetchSchoolByCode(parsed.schoolCode);
          return;
        }
      }

      // If we have studentId, fetch from student node first to get schoolCode
      const dbRef = ref(getDatabase());
      // Re-fetching user to be safe and accurate
      const studentRef = child(dbRef, `students`);
      const studentSnap = await get(studentRef);

      let schoolCode = "";

      if (studentSnap.exists()) {
        const students = studentSnap.val();
        const student = Object.values(students).find(
          (s: any) => s.id === studentId
        );
        if (student && (student as any).schoolCode) {
          schoolCode = (student as any).schoolCode;
        }
      }

      if (schoolCode) {
        await fetchSchoolByCode(schoolCode);
      } else {
        // Fallback for demo if no school linked
        setLoading(false);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load school info.");
      setLoading(false);
    } finally {
      setRefreshing(false);
    }
  };

  const fetchSchoolByCode = async (code: string) => {
    const dbRef = ref(getDatabase());
    const schoolsSnap = await get(child(dbRef, "schools"));

    if (schoolsSnap.exists()) {
      const schools = schoolsSnap.val();
      // Finding school by matching property since data structure might be ID-keyed or array
      const schoolEntry = Object.values(schools).find(
        (s: any) => s.schoolCode === code
      );

      if (schoolEntry) {
        setSchoolData(schoolEntry as School);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSchoolData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchSchoolData();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  const displayName = schoolData?.name || "Paideia Academy";
  const displayMotto = "Cultivating Wisdom & Virtue"; // Placeholder as typically not in DB

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* --- Hero Section --- */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuAP29RFpXlSJYZtXsj0PAFUINYWeltyqkityM4SNqXkyGBUKyxB2J962M98doumPK_9K4aqF86AtChku4SteG_nxc2aR3EJfrgSOccRrY1JZiwUrV5YsMSRp7N1xMj29KMbeqN8bhL7LQH0OOk4GR4lXx8hZ3kZYI30uNNVJEusrzjz90c13mUW4nbl6uMRgg0txtJFhW_OyBLgoyyO5RdJ6nmlEppORubcsqsv0xkMimjvCxMVdoFYHoqh1IB7KFL8Lo_pilYlyPo",
            }}
            style={styles.heroImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={["transparent", "rgba(16, 22, 34, 0.6)", "#0f172a"]}
              locations={[0, 0.6, 1]}
              style={styles.heroGradient}
            >
              <View style={styles.heroContent}>
                <View style={styles.logoContainer}>
                  <Image
                    source={{
                      uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBXJPk5GIytfeG5YkHRDbCu2y4bt_87_wXO2Ubrb__SKh4w2rOP6lFgdeAyYfYCWlyJx6mTudeMmcanfYR5Lhq6aMWXbgHOqGMLVoIfueFKI37ssa5VHV7klrhded9wrgCYvQGKSm627okr-T8lamtgNRzoGlL3rCaQ0EmBaWhkpRw0-vajqbKvzyPz5ge3Ozy8NxpTSvhS6Gb791NSD-BHMdrPDVWTDdEYqP4qmObxwAsZzBu1KGjJjcziGtP5E6le1OAuWlDAU30",
                    }}
                    style={styles.logo}
                  />
                </View>
                <View style={styles.heroTextContainer}>
                  <Text style={styles.schoolName}>{displayName}</Text>
                  <Text style={styles.motto}>{displayMotto}</Text>
                </View>
              </View>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* --- Actions Bar --- */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (schoolData?.contactNumber)
                  Linking.openURL(`tel:${schoolData.contactNumber}`);
              }}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons name="call" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.actionLabel}>Call</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                if (schoolData?.email)
                  Linking.openURL(`mailto:${schoolData.email}`);
              }}
            >
              <View style={styles.iconCircle}>
                <MaterialIcons name="mail" size={24} color={COLORS.white} />
              </View>
              <Text style={styles.actionLabel}>Email</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.actionButton}>
              <View style={styles.iconCircle}>
                <MaterialIcons
                  name="location-on"
                  size={24}
                  color={COLORS.white}
                />
              </View>
              <Text style={styles.actionLabel}>Map</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* --- Info Bar --- */}
        <View style={styles.infoBarContainer}>
          <View style={styles.infoBar}>
            <MaterialIcons
              name="schedule"
              size={20}
              color={COLORS.slate400}
              style={{ marginTop: 2 }}
            />
            <View style={styles.infoTextContainer}>
              <Text style={styles.infoLabel}>HOURS TODAY</Text>
              <Text style={styles.infoValue}>Open Now • Closes 4:00 PM</Text>
            </View>
            <MaterialIcons
              name="chevron-right"
              size={24}
              color={COLORS.slate400}
              style={{ marginLeft: "auto" }}
            />
          </View>
        </View>

        {/* --- Staff Directory --- */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Staff Directory</Text>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {/* Search Box */}
          <View style={styles.searchContainer}>
            <MaterialIcons
              name="search"
              size={20}
              color={COLORS.slate400}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Find a teacher or administrator..."
              placeholderTextColor={COLORS.slate400}
            />
          </View>

          {/* Staff List */}
          <View style={styles.listContainer}>
            {STAFF_DATA.map((staff) => (
              <View key={staff.id} style={styles.staffCard}>
                <Image
                  source={{ uri: staff.image }}
                  style={styles.staffImage}
                />
                <View style={styles.staffInfo}>
                  <Text style={styles.staffName} numberOfLines={1}>
                    {staff.name}
                  </Text>
                  <Text style={styles.staffRole} numberOfLines={1}>
                    {staff.role}
                  </Text>
                </View>
                <TouchableOpacity style={styles.mailButton}>
                  <MaterialIcons name="mail" size={18} color={COLORS.primary} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* --- School Documents --- */}
        <View
          style={[
            styles.sectionContainer,
            { paddingTop: 8, paddingBottom: 40 },
          ]}
        >
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>School Documents</Text>
          </View>

          <View style={styles.listContainer}>
            {DOCUMENTS_DATA.map((doc) => (
              <TouchableOpacity key={doc.id} style={styles.docCard}>
                <View
                  style={[styles.docIconBox, { backgroundColor: doc.color }]}
                >
                  <MaterialIcons
                    name={doc.icon as any}
                    size={24}
                    color={doc.iconColor}
                  />
                </View>
                <View style={styles.docInfo}>
                  <Text style={styles.docTitle}>{doc.title}</Text>
                  <Text style={styles.docMeta}>{doc.meta}</Text>
                </View>
                <MaterialIcons
                  name="download"
                  size={24}
                  color={COLORS.slate400}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  // Hero
  heroContainer: {
    height: 280,
    width: "100%",
  },
  heroImage: {
    width: "100%",
    height: "100%",
  },
  heroGradient: {
    flex: 1,
    justifyContent: "flex-end",
    padding: 20,
  },
  heroContent: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 16,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 16,
    backgroundColor: COLORS.white,
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  logo: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  heroTextContainer: {
    flex: 1,
    marginBottom: 4,
  },
  schoolName: {
    fontSize: 24,
    fontWeight: "800",
    color: COLORS.white,
    lineHeight: 28,
  },
  motto: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.slate200,
    marginTop: 2,
  },
  // Actions
  actionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  actionsGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: COLORS.slate600,
  },
  // Info Bar
  infoBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.slate200,
  },
  infoBar: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.slate500,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate900,
  },
  // Sections
  sectionContainer: {
    paddingTop: 24,
    paddingHorizontal: 16,
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
    color: COLORS.primary,
  },
  // Search
  searchContainer: {
    marginBottom: 20,
    position: "relative",
  },
  searchIcon: {
    position: "absolute",
    left: 12,
    top: 14, // roughly centered for 48px height
    zIndex: 1,
  },
  searchInput: {
    backgroundColor: COLORS.surface,
    height: 48,
    borderRadius: 12,
    paddingLeft: 40,
    paddingRight: 16,
    fontSize: 14,
    color: COLORS.slate900,
    borderWidth: 1,
    borderColor: COLORS.slate200,
  },
  // Lists
  listContainer: {
    gap: 12,
  },
  // Staff Card
  staffCard: {
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  staffImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  staffInfo: {
    flex: 1,
    justifyContent: "center",
  },
  staffName: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.slate900,
    marginBottom: 2,
  },
  staffRole: {
    fontSize: 12,
    color: COLORS.slate500,
  },
  mailButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.slate100,
    justifyContent: "center",
    alignItems: "center",
  },
  // Doc Card
  docCard: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  docIconBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  docInfo: {
    flex: 1,
  },
  docTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.slate900,
    marginBottom: 2,
  },
  docMeta: {
    fontSize: 12,
    color: COLORS.slate500,
  },
});
