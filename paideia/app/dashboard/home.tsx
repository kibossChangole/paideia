import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Platform,
  ImageBackground,
  Dimensions,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { database } from "../(tabs)/firebaseConfig";
import { ref, child, get, getDatabase } from "firebase/database";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";

// Types
type Student = {
  id: string;
  name: string;
  dob: string;
  guardianName: string;
  guardianContact: string;
  region: string;
  schoolCode: string;
  grade: number;
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

type Announcement = {
  id: string;
  title: string;
  content: string;
  date: string;
  author: string;
};

const COLORS = {
  primary: "#14B8A6", // Teal
  accentOrange: "#FFB347",
  accentGreen: "#7ED957",
  accentPurple: "#A29BFE",
  accentBlue: "#81ECEC",
  backgroundSoft: "#F8FAFC",
  slate900: "#0f172a",
  slate800: "#1e293b",
  slate600: "#475569",
  slate500: "#64748b",
  slate400: "#94a3b8",
  slate100: "#f1f5f9",
  white: "#ffffff",
};

export default function StudentDashboard() {
  const [studentData, setStudentData] = useState<Student | null>(null);
  const [schoolName, setSchoolName] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [lastSeenDate, setLastSeenDate] = useState<string>("Loading...");

  const fetchSchoolName = async (schoolCode: string) => {
    try {
      const dbRef = ref(getDatabase());
      const snapshot = await get(child(dbRef, "schools"));

      if (snapshot.exists()) {
        const schools = Object.values(snapshot.val()) as School[];
        const school = schools.find((s) => s.schoolCode === schoolCode);
        if (school) {
          setSchoolName(school.name);
        } else {
          setSchoolName("School not found");
        }
      }
    } catch (error) {
      console.error("Error fetching school name:", error);
      setSchoolName("Error loading school name");
    }
  };

  const fetchUserData = async () => {
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
          fetchSchoolName(student.schoolCode);
          fetchAnnouncements(student.schoolCode);

          const lastSeen = await getLastSeenDate(
            studentId,
            student.schoolCode,
            student.grade
          );
          setLastSeenDate(lastSeen);
        } else {
          setError("Student not found");
          router.push("/");
        }
      } else {
        setError("No student data available");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Error loading student data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchAnnouncements = async (schoolCode: string) => {
    try {
      const dbRef = ref(getDatabase());
      const snapshot = await get(child(dbRef, "schools"));

      if (snapshot.exists()) {
        const schools = snapshot.val();
        const schoolData: any = Object.values(schools).find(
          (s: any) => s.schoolCode === schoolCode
        );

        if (schoolData) {
          if (schoolData.announcements) {
            let ads: any[] = [];
            if (Array.isArray(schoolData.announcements)) {
              ads = schoolData.announcements;
            } else {
              ads = Object.values(schoolData.announcements);
            }
            // Filter invalid items
            const validAds = ads.filter((a) => a && (a.title || a.content));
            setAnnouncements(validAds as Announcement[]);
          } else {
            setAnnouncements([]);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching announcements:", error);
    }
  };

  const getLastSeenDate = async (
    studentId: string,
    schoolCode: string,
    grade: number
  ) => {
    try {
      const dbRef = ref(getDatabase());
      const attendanceRef = child(dbRef, `attendance/${schoolCode}/${grade}`);
      const snapshot = await get(attendanceRef);

      if (snapshot.exists()) {
        const attendanceData = snapshot.val();
        const dates = Object.keys(attendanceData).sort(
          (a, b) => new Date(b).getTime() - new Date(a).getTime()
        );

        const lastSeenDate = dates.find(
          (date) => attendanceData[date][studentId] === true
        );

        return lastSeenDate
          ? new Date(lastSeenDate).toLocaleDateString()
          : "No attendance record";
      }
      return "No attendance record";
    } catch (error) {
      console.error("Error fetching last seen date:", error);
      return "Error fetching attendance";
    }
  };

  useEffect(() => {
    fetchUserData();
  }, []);

  // Reset index when announcements change to avoid out of bounds
  useEffect(() => {
    setCurrentAnnouncementIndex(0);
  }, [announcements]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserData();
  };

  const handlePrevAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextAnnouncement = () => {
    setCurrentAnnouncementIndex((prev) =>
      Math.min(announcements.length - 1, prev + 1)
    );
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
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  // Safe Index Calculation
  const safeIndex = Math.min(
    Math.max(0, currentAnnouncementIndex),
    Math.max(0, announcements.length - 1)
  );

  const currentAnnouncement =
    announcements.length > 0 ? announcements[safeIndex] : null;

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <ImageBackground
            source={{
              uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNTqnzeJftHvbn60xkpHR4iIqr4i6OzLwRboSHAy0lzvnsqKULRjXrfI7KKN63z4U0BmGPk8AN9dJjSNWzkv54ogANkqDbyjMsLMbebi_M_nlRg1TkhKqezeRhjBdiFMH5mk96zboWIy_WBSmc8tZK4AO1v3cB0dtEuqND6cmvIY3-WB-EZ2n0gFNAoPtLe4nOzbV5IdvNkCgE7C0ueST8-8MT15q5cxAkRapoXcAqm6ftZBVJPpT9_vledQMu6pEz8jWvcvhBro8",
            }}
            blurRadius={Platform.OS === "ios" ? 20 : 5}
            style={StyleSheet.absoluteFillObject}
            imageStyle={{ opacity: 0.2 }}
          />
          <View style={styles.headerContent}>
            <View style={styles.headerLeft}>
              <View style={styles.avatarContainer}>
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuDNTqnzeJftHvbn60xkpHR4iIqr4i6OzLwRboSHAy0lzvnsqKULRjXrfI7KKN63z4U0BmGPk8AN9dJjSNWzkv54ogANkqDbyjMsLMbebi_M_nlRg1TkhKqezeRhjBdiFMH5mk96zboWIy_WBSmc8tZK4AO1v3cB0dtEuqND6cmvIY3-WB-EZ2n0gFNAoPtLe4nOzbV5IdvNkCgE7C0ueST8-8MT15q5cxAkRapoXcAqm6ftZBVJPpT9_vledQMu6pEz8jWvcvhBro8",
                  }}
                  style={styles.avatar}
                />
                <View
                  style={[
                    styles.onlineBadge,
                    { backgroundColor: COLORS.primary },
                  ]}
                />
              </View>
              <View>
                <Text style={styles.greetingText}>GOOD MORNING</Text>
                <Text style={styles.nameText}>
                  {studentData?.name.split(" ")[0] || "Student"}
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.notificationButton}>
              <MaterialIcons
                name="notifications-none"
                size={26}
                color={COLORS.slate600}
              />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Important Alerts */}
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Important Alerts</Text>
              <View
                style={[
                  styles.badge,
                  { backgroundColor: "rgba(20, 184, 166, 0.1)" },
                ]}
              >
                <Text style={styles.badgeText}>
                  {announcements.length > 0 ? safeIndex + 1 : 0} of{" "}
                  {announcements.length}
                </Text>
              </View>
            </View>

            {announcements.length > 0 && currentAnnouncement ? (
              <View style={styles.announcementCard}>
                <ImageBackground
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuBI7-6_RQUg4NAQcy0OYlGXn7sY_Ck8yiXkUvL362-wiaX_ssaEMDQ_Otu5a-94l4H7bxcxbT6m50Q331zLhhupRth1pNBk5KUxzGrXGbEdF2Mnb-4JsdfQnjpFw69XdDZ35I4j0_MN2zL8rt1a_anjuAZ8B8xkDwjBuJ1ZPWREWO3ukvu33KTBONNDTQ7NyItu04zce7sY-DUK4Wp1HY3jlYZY6MoU91j2I_10-4iBvwXz3nA2SVPD-AYigcDunjjHaQpeuSmJUrg",
                  }}
                  style={styles.announcementImage}
                  imageStyle={styles.announcementImageStyle}
                >
                  <LinearGradient
                    colors={["transparent", "rgba(0,0,0,0.8)"]}
                    style={styles.announcementGradient}
                  >
                    <View style={styles.urgentBadge}>
                      <Text style={styles.urgentText}>notice</Text>
                    </View>
                  </LinearGradient>
                </ImageBackground>
                <View style={styles.announcementContent}>
                  <View style={styles.announcementTextContent}>
                    <Text style={styles.announcementTitle} numberOfLines={1}>
                      {currentAnnouncement.title}
                    </Text>
                    <Text
                      style={styles.announcementDescription}
                      numberOfLines={3}
                    >
                      {currentAnnouncement.content}
                    </Text>
                  </View>

                  <View style={styles.announcementActions}>
                    <TouchableOpacity style={styles.joinButton}>
                      <Text style={styles.joinButtonText}>Read More</Text>
                      <MaterialIcons
                        name="arrow-forward"
                        size={18}
                        color="white"
                      />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.paginationRow}>
                    <TouchableOpacity
                      disabled={safeIndex <= 0}
                      onPress={handlePrevAnnouncement}
                      style={[
                        styles.paginationDot,
                        safeIndex > 0 && styles.paginationDotActive,
                      ]}
                    >
                      <MaterialIcons
                        name="chevron-left"
                        size={32}
                        color={
                          safeIndex <= 0 ? COLORS.slate400 : COLORS.primary
                        }
                      />
                    </TouchableOpacity>

                    <Text style={styles.paginationText}>
                      {safeIndex + 1} / {announcements.length}
                    </Text>

                    <TouchableOpacity
                      disabled={safeIndex >= announcements.length - 1}
                      onPress={handleNextAnnouncement}
                      style={[
                        styles.paginationDot,
                        safeIndex < announcements.length - 1 &&
                          styles.paginationDotActive,
                      ]}
                    >
                      <MaterialIcons
                        name="chevron-right"
                        size={32}
                        color={
                          safeIndex >= announcements.length - 1
                            ? COLORS.slate400
                            : COLORS.primary
                        }
                      />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ) : (
              <View
                style={[
                  styles.announcementCard,
                  {
                    justifyContent: "center",
                    alignItems: "center",
                    height: 200,
                  },
                ]}
              >
                <Text style={{ color: COLORS.slate400 }}>
                  No announcements active
                </Text>
              </View>
            )}
          </View>

          {/* School Services */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>School Services</Text>
            <View style={styles.grid}>
              {/* Fee Payment */}
              <TouchableOpacity
                style={styles.serviceCard}
                onPress={() => router.push("/dashboard/accounts")}
              >
                <View style={styles.serviceHeader}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#EEF2FF" }]}
                  >
                    <MaterialIcons
                      name="account-balance-wallet"
                      size={28}
                      color={COLORS.primary}
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.serviceTitle}>Fee Payment</Text>
                  <Text style={styles.serviceSubtitle}>
                    {studentData?.feeStructure
                      ? `View Balance`
                      : "Check status"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Attendance */}
              <TouchableOpacity
                style={styles.serviceCard}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/studies",
                    params: { type: "attendance" },
                  })
                }
              >
                <View style={styles.serviceHeader}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#ECFDF5" }]}
                  >
                    <MaterialIcons
                      name="check-circle"
                      size={28}
                      color="#10B981"
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.serviceTitle}>Attendance</Text>
                  <Text style={styles.serviceSubtitle}>
                    {lastSeenDate !== "Loading..."
                      ? "Check History"
                      : "Loading..."}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Report Cards */}
              <TouchableOpacity
                style={styles.serviceCard}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/studies",
                    params: { type: "report-cards" },
                  })
                }
              >
                <View style={styles.serviceHeader}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#FFFBEB" }]}
                  >
                    <MaterialIcons name="menu-book" size={28} color="#F59E0B" />
                  </View>
                </View>
                <View>
                  <Text style={styles.serviceTitle}>Report Cards</Text>
                  <Text style={styles.serviceSubtitle}>View Grades</Text>
                </View>
              </TouchableOpacity>

              {/* Exam Schedule */}
              <TouchableOpacity
                style={styles.serviceCard}
                onPress={() =>
                  router.push({
                    pathname: "/dashboard/studies",
                    params: { type: "exams" },
                  })
                }
              >
                <View style={styles.serviceHeader}>
                  <View
                    style={[styles.iconBox, { backgroundColor: "#F5F3FF" }]}
                  >
                    <MaterialIcons
                      name="event-available"
                      size={28}
                      color="#8B5CF6"
                    />
                  </View>
                </View>
                <View>
                  <Text style={styles.serviceTitle}>Exam Schedule</Text>
                  <Text style={styles.serviceSubtitle}>View Dates</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* Upcoming Break */}
          <View style={[styles.sectionContainer, styles.lastSection]}>
            <View
              style={[styles.breakCard, { backgroundColor: COLORS.primary }]}
            >
              <View style={styles.circleDecoration1} />
              <View style={styles.circleDecoration2} />
              <View style={{ zIndex: 10 }}>
                <Text style={styles.breakLabel}>UPCOMING BREAK</Text>
                <Text style={styles.breakTitle}>Spring Break Holiday</Text>
                <Text style={styles.breakDesc}>
                  School will be closed this Friday. Enjoy your time off with
                  family!
                </Text>
              </View>
              <TouchableOpacity style={styles.calendarButton}>
                <Text
                  style={[styles.calendarButtonText, { color: COLORS.primary }]}
                >
                  View Calendar
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color={COLORS.primary}
                />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: COLORS.backgroundSoft,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120, // Space for floating navbar
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.backgroundSoft,
  },
  errorText: {
    color: COLORS.slate600,
    fontSize: 16,
  },
  header: {
    paddingTop: Platform.OS === "ios" ? 60 : 40,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "rgba(255,255,255,0.8)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(241, 245, 249, 0.5)",
    overflow: "hidden",
  },
  headerContent: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  onlineBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: COLORS.accentGreen,
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  greetingText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.slate400,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  nameText: {
    fontSize: 20,
    fontWeight: "800",
    color: COLORS.slate900,
  },
  notificationButton: {
    width: 44,
    height: 44,
    backgroundColor: COLORS.white,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  notificationBadge: {
    position: "absolute",
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#F87171",
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  mainContent: {
    padding: 20,
    gap: 24,
  },
  sectionContainer: {
    gap: 12,
  },
  lastSection: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.slate900,
  },
  badge: {
    backgroundColor: "rgba(99, 102, 241, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "700",
  },
  announcementCard: {
    backgroundColor: COLORS.white,
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 3,
    borderWidth: 1,
    borderColor: COLORS.slate100,
  },
  announcementImage: {
    width: "100%",
    height: 180,
    justifyContent: "flex-end",
  },
  announcementImageStyle: {
    resizeMode: "cover",
  },
  announcementGradient: {
    flex: 1,
    justifyContent: "flex-start",
    padding: 16,
  },
  urgentBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)",
  },
  urgentText: {
    color: COLORS.white,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  announcementContent: {
    padding: 20,
  },
  announcementTextContent: {
    marginBottom: 16,
  },
  announcementTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.slate900,
    marginBottom: 6,
  },
  announcementDescription: {
    fontSize: 14,
    color: COLORS.slate500,
    lineHeight: 20,
  },
  announcementActions: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  joinButton: {
    flex: 1,
    height: 48,
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
    marginRight: 16,
  },
  joinButtonText: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: "700",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  paginationDot: {
    padding: 4,
  },
  paginationDotActive: {
    opacity: 1,
  },
  paginationText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.slate400,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  serviceCard: {
    width: (Dimensions.get("window").width - 56) / 2, // 2 columns, padding 20*2 + gap 16
    backgroundColor: COLORS.white,
    padding: 16,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: COLORS.slate100,
    gap: 12,
  },
  serviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  iconBox: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  serviceTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.slate900,
    marginBottom: 4,
  },
  serviceSubtitle: {
    fontSize: 12,
    color: COLORS.slate400,
  },
  breakCard: {
    backgroundColor: "#4F46E5",
    padding: 24,
    borderRadius: 24,
    position: "relative",
    overflow: "hidden",
    shadowColor: "#4F46E5",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 5,
  },
  circleDecoration1: {
    position: "absolute",
    top: -40,
    right: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  circleDecoration2: {
    position: "absolute",
    bottom: -20,
    right: 60,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  breakLabel: {
    color: "#E0E7FF",
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  breakTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  breakDesc: {
    color: "#E0E7FF",
    fontSize: 14,
    lineHeight: 20,
    opacity: 0.9,
    marginBottom: 20,
  },
  calendarButton: {
    backgroundColor: COLORS.white,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calendarButtonText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "700",
  },
});
